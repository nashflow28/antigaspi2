<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\DeliveryDriver;
use App\Services\DeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DriverDeliveryController extends Controller
{
    public function __construct(
        private DeliveryService $deliveryService
    ) {}

    /**
     * Get available deliveries for driver
     */
    public function available(Request $request): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver) {
            return $this->driverNotFound();
        }

        if (! $driver->canAcceptDelivery()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas accepter de livraisons actuellement',
                'reason' => $this->getUnavailableReason($driver),
            ], 400);
        }

        $deliveries = Delivery::availableForDrivers()
            ->with(['reservation.product.merchant', 'zone'])
            ->orderBy('created_at', 'asc')
            ->get();

        // If driver has location, sort by distance
        if ($driver->current_latitude && $driver->current_longitude) {
            $deliveries = $deliveries->sortBy(function ($delivery) use ($driver) {
                return $this->calculateDistance(
                    $driver->current_latitude,
                    $driver->current_longitude,
                    $delivery->pickup_latitude,
                    $delivery->pickup_longitude
                );
            })->values();
        }

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }

    /**
     * Get driver's active delivery
     */
    public function active(): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver) {
            return $this->driverNotFound();
        }

        $delivery = $driver->getActiveDelivery();

        if (! $delivery) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        $delivery->load([
            'reservation.product.merchant',
            'reservation.user',
            'zone',
        ]);

        return response()->json([
            'success' => true,
            'data' => $delivery,
        ]);
    }

    /**
     * Get driver's delivery history
     */
    public function history(Request $request): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver) {
            return $this->driverNotFound();
        }

        $deliveries = $driver->deliveries()
            ->with(['reservation.product', 'zone'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }

    /**
     * Accept a delivery
     */
    public function accept(Delivery $delivery): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver) {
            return $this->driverNotFound();
        }

        if (! $driver->canAcceptDelivery()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas accepter de livraisons actuellement',
            ], 400);
        }

        if (! in_array($delivery->status, [Delivery::STATUS_PENDING, Delivery::STATUS_SEARCHING])) {
            return response()->json([
                'success' => false,
                'message' => 'Cette livraison n\'est plus disponible',
            ], 400);
        }

        if ($delivery->driver_id !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Cette livraison a déjà été acceptée',
            ], 400);
        }

        $delivery->assignDriver($driver);

        // Mark driver as busy (not available for other deliveries)
        // We don't set is_available to false, they can still see but not accept others

        $delivery->load([
            'reservation.product.merchant',
            'reservation.user',
            'zone',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Livraison acceptée',
            'data' => $delivery,
        ]);
    }

    /**
     * Reject a delivery offer
     */
    public function reject(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        // Just log the rejection, delivery stays available for others
        // In a real app, you might want to track rejections

        return response()->json([
            'success' => true,
            'message' => 'Livraison refusée',
        ]);
    }

    /**
     * Mark as picking up (on the way to merchant)
     */
    public function startPickup(Delivery $delivery): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $delivery->markAsPickingUp()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée pour ce statut',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'En route vers le commerçant',
            'data' => $delivery,
        ]);
    }

    /**
     * Mark as picked up (got the package from merchant)
     */
    public function confirmPickup(Delivery $delivery): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $delivery->markAsPickedUp()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée pour ce statut',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Colis récupéré',
            'data' => $delivery,
        ]);
    }

    /**
     * Mark as delivering (on the way to customer)
     */
    public function startDelivery(Delivery $delivery): JsonResponse
    {
        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $delivery->markAsDelivering()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée pour ce statut',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Livraison en cours',
            'data' => $delivery,
        ]);
    }

    /**
     * Complete delivery
     */
    public function complete(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'photo_url' => 'nullable|url|max:500',
            'signature_url' => 'nullable|url|max:500',
            'notes' => 'nullable|string|max:500',
        ]);

        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        if ($request->notes) {
            $delivery->update(['driver_notes' => $request->notes]);
        }

        if (! $delivery->markAsDelivered($request->photo_url, $request->signature_url)) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée pour ce statut',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Livraison terminée! Commission: '.number_format($delivery->driver_commission, 0).' XOF',
            'data' => $delivery,
        ]);
    }

    /**
     * Report delivery failure
     */
    public function reportFailure(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $delivery->markAsFailed($request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Échec de livraison signalé',
            'data' => $delivery,
        ]);
    }

    /**
     * Update delivery location (tracking)
     */
    public function updateLocation(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed' => 'nullable|numeric',
            'heading' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric',
        ]);

        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Update driver's current location
        $driver->updateLocation($request->latitude, $request->longitude);

        // Record tracking point
        $tracking = $delivery->recordPosition(
            $request->latitude,
            $request->longitude,
            $request->speed,
            $request->heading
        );

        // Broadcast location update (for real-time tracking)
        // event(new DriverLocationUpdated($delivery, $request->latitude, $request->longitude));

        return response()->json([
            'success' => true,
            'data' => $tracking,
        ]);
    }

    /**
     * Cancel delivery (by driver)
     */
    public function cancel(Request $request, Delivery $delivery): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $driver = $this->getDriver();
        if (! $driver || $delivery->driver_id !== $driver->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Drivers can only cancel before pickup
        if (! in_array($delivery->status, [Delivery::STATUS_ASSIGNED, Delivery::STATUS_PICKING_UP])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez plus annuler cette livraison',
            ], 400);
        }

        // Reset delivery to pending so another driver can take it
        $delivery->update([
            'driver_id' => null,
            'status' => Delivery::STATUS_PENDING,
            'assigned_at' => null,
            'driver_notes' => 'Annulé par livreur: '.$request->reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Livraison annulée',
        ]);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private function getDriver(): ?DeliveryDriver
    {
        return DeliveryDriver::where('user_id', Auth::id())->first();
    }

    private function driverNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Profil livreur non trouvé',
        ], 404);
    }

    private function getUnavailableReason(DeliveryDriver $driver): string
    {
        if (! $driver->is_verified) {
            return 'Compte non vérifié';
        }
        if (! $driver->is_active) {
            return 'Compte désactivé';
        }
        if (! $driver->is_available) {
            return 'Vous êtes hors ligne';
        }
        if ($driver->getActiveDelivery()) {
            return 'Vous avez déjà une livraison en cours';
        }

        return 'Indisponible';
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $latDiff = deg2rad($lat2 - $lat1);
        $lngDiff = deg2rad($lng2 - $lng1);

        $a = sin($latDiff / 2) * sin($latDiff / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lngDiff / 2) * sin($lngDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
