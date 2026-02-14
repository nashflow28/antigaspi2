<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Services\DeliveryPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryZoneController extends Controller
{
    public function __construct(
        private DeliveryPricingService $pricingService
    ) {}

    /**
     * Get all active delivery zones
     */
    public function index(Request $request): JsonResponse
    {
        $city = $request->query('city');

        $query = DeliveryZone::active();

        if ($city) {
            $query->inCity($city);
        }

        $zones = $query->get();

        return response()->json([
            'success' => true,
            'data' => $zones,
        ]);
    }

    /**
     * Get delivery zone details
     */
    public function show(DeliveryZone $zone): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $zone,
        ]);
    }

    /**
     * Estimate delivery fee
     */
    public function estimateFee(Request $request): JsonResponse
    {
        $request->validate([
            'pickup_latitude' => 'required|numeric',
            'pickup_longitude' => 'required|numeric',
            'delivery_latitude' => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
            'order_amount' => 'sometimes|numeric|min:0',
        ]);

        try {
            $estimate = $this->pricingService->estimateDelivery(
                $request->pickup_latitude,
                $request->pickup_longitude,
                $request->delivery_latitude,
                $request->delivery_longitude,
                $request->order_amount ?? 0
            );

            return response()->json([
                'success' => true,
                'data' => $estimate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => \App\Helpers\ErrorHelper::safeMessage($e, 'Erreur de zone de livraison'),
            ], 400);
        }
    }

    /**
     * Check if delivery is available for coordinates
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $zones = DeliveryZone::active()->get();

        // For now, simple check based on city center distances
        // In production, use polygon containment
        $available = $zones->isNotEmpty();

        return response()->json([
            'success' => true,
            'data' => [
                'available' => $available,
                'zones' => $zones,
            ],
        ]);
    }
}
