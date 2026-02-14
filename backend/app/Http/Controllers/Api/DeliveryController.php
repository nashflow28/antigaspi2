<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Reservation;
use App\Services\DeliveryPricingService;
use App\Services\DeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeliveryController extends Controller
{
    public function __construct(
        private DeliveryService $deliveryService,
        private DeliveryPricingService $pricingService
    ) {}

    /**
     * Estimate delivery fee for a reservation
     */
    public function estimate(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'delivery_latitude' => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
        ]);

        // Check if user owns this reservation
        if ($reservation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Get merchant coordinates
        $merchant = $reservation->product->merchant;
        $pickupLat = $merchant->latitude ?? 6.1725; // Default Lomé
        $pickupLng = $merchant->longitude ?? 1.2314;

        try {
            $estimate = $this->pricingService->estimateDelivery(
                $pickupLat,
                $pickupLng,
                $request->delivery_latitude,
                $request->delivery_longitude,
                $reservation->total_amount
            );

            return response()->json([
                'success' => true,
                'data' => $estimate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => \App\Helpers\ErrorHelper::safeMessage($e, 'Erreur de livraison'),
            ], 400);
        }
    }

    /**
     * Request delivery for a reservation
     */
    public function requestDelivery(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'delivery_address' => 'required|string|max:500',
            'delivery_latitude' => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
            'delivery_notes' => 'nullable|string|max:500',
            'delivery_instructions' => 'nullable|string|max:500',
            'recipient_name' => 'nullable|string|max:100',
            'recipient_phone' => 'nullable|string|max:20',
        ]);

        // Check if user owns this reservation
        if ($reservation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Check if reservation can have delivery
        if (! in_array($reservation->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être livrée',
            ], 400);
        }

        // Check if delivery already exists
        if (Delivery::where('reservation_id', $reservation->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Une livraison existe déjà pour cette réservation',
            ], 400);
        }

        try {
            $delivery = $this->deliveryService->createDelivery(
                $reservation,
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Demande de livraison créée',
                'data' => $delivery->load(['driver.user', 'zone']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => \App\Helpers\ErrorHelper::safeMessage($e, 'Erreur de livraison'),
            ], 400);
        }
    }

    /**
     * Get delivery details
     */
    public function show(Delivery $delivery): JsonResponse
    {
        $user = Auth::user();

        // Check access rights
        $hasAccess = false;
        if ($delivery->reservation->user_id === $user->id) {
            $hasAccess = true; // Consumer
        } elseif ($delivery->reservation->product->merchant->user_id === $user->id) {
            $hasAccess = true; // Merchant
        } elseif ($delivery->driver && $delivery->driver->user_id === $user->id) {
            $hasAccess = true; // Driver
        } elseif ($user->role === 'admin') {
            $hasAccess = true; // Admin
        }

        if (! $hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $delivery->load([
            'driver.user',
            'zone',
            'reservation.product.merchant',
            'reservation.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => $delivery,
        ]);
    }

    /**
     * Track delivery in real-time
     */
    public function track(Delivery $delivery): JsonResponse
    {
        $user = Auth::user();

        // Check if consumer owns this delivery
        if ($delivery->reservation->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $delivery->load(['driver.user', 'zone']);

        // Get latest tracking position
        $latestPosition = $delivery->getLatestPosition();

        // Get driver's current position if available
        $driverPosition = null;
        if ($delivery->driver) {
            $driverPosition = [
                'latitude' => $delivery->driver->current_latitude,
                'longitude' => $delivery->driver->current_longitude,
                'updated_at' => $delivery->driver->last_location_update,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'delivery' => $delivery,
                'driver_position' => $driverPosition,
                'tracking_history' => $delivery->trackingHistory()->limit(50)->get(),
                'pickup_location' => [
                    'latitude' => $delivery->pickup_latitude,
                    'longitude' => $delivery->pickup_longitude,
                    'address' => $delivery->pickup_address,
                ],
                'delivery_location' => [
                    'latitude' => $delivery->delivery_latitude,
                    'longitude' => $delivery->delivery_longitude,
                    'address' => $delivery->delivery_address,
                ],
            ],
        ]);
    }

    /**
     * Cancel delivery (by consumer)
     */
    public function cancel(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Check if consumer owns this delivery
        if ($delivery->reservation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $delivery->can_cancel) {
            return response()->json([
                'success' => false,
                'message' => 'Cette livraison ne peut plus être annulée',
            ], 400);
        }

        $delivery->cancel($request->reason, 'consumer');

        return response()->json([
            'success' => true,
            'message' => 'Livraison annulée',
            'data' => $delivery,
        ]);
    }

    /**
     * Rate delivery (by consumer)
     */
    public function rate(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:500',
        ]);

        // Check if consumer owns this delivery
        if ($delivery->reservation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Check if delivery is completed
        if ($delivery->status !== Delivery::STATUS_DELIVERED) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez noter que les livraisons terminées',
            ], 400);
        }

        // Check if already rated
        if ($delivery->consumer_rating) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà noté cette livraison',
            ], 400);
        }

        $delivery->rateByConsumer($request->rating, $request->feedback);

        return response()->json([
            'success' => true,
            'message' => 'Merci pour votre évaluation',
            'data' => $delivery,
        ]);
    }

    /**
     * Get consumer's delivery history
     */
    public function history(Request $request): JsonResponse
    {
        $user = Auth::user();

        $deliveries = Delivery::whereHas('reservation', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['driver.user', 'reservation.product'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }
}
