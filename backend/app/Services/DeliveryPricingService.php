<?php

namespace App\Services;

use App\Models\DeliveryZone;

class DeliveryPricingService
{
    // Default pricing configuration (in XOF)
    private const DEFAULT_BASE_FEE = 500;          // Frais de base

    private const DEFAULT_PER_KM_FEE = 150;        // Frais par km

    private const DEFAULT_DRIVER_COMMISSION_RATE = 0.75; // 75% pour le livreur

    private const DEFAULT_PLATFORM_RATE = 0.25;   // 25% pour la plateforme

    private const FREE_DELIVERY_THRESHOLD = 10000; // Livraison gratuite au-delà de 10000 XOF

    private const MINIMUM_FEE = 300;              // Frais minimum

    private const MAXIMUM_FEE = 3000;             // Frais maximum

    /**
     * Calculate delivery fee based on distance and zone
     */
    public function calculateDeliveryFee(
        float $pickupLat,
        float $pickupLng,
        float $deliveryLat,
        float $deliveryLng,
        float $orderAmount,
        ?DeliveryZone $zone = null
    ): array {
        $distance = $this->calculateDistance($pickupLat, $pickupLng, $deliveryLat, $deliveryLng);

        // Get zone-specific pricing or use defaults
        $baseFee = $zone?->base_fee ?? self::DEFAULT_BASE_FEE;
        $perKmFee = $zone?->per_km_fee ?? self::DEFAULT_PER_KM_FEE;
        $minFee = $zone?->min_fee ?? self::MINIMUM_FEE;
        $maxFee = $zone?->max_fee ?? self::MAXIMUM_FEE;

        // Calculate base delivery fee
        $deliveryFee = $baseFee + ($distance * $perKmFee);

        // Apply min/max constraints
        $deliveryFee = max($minFee, min($maxFee, $deliveryFee));

        // Round to nearest 50 XOF
        $deliveryFee = ceil($deliveryFee / 50) * 50;

        // Check for free delivery threshold
        if ($orderAmount >= self::FREE_DELIVERY_THRESHOLD) {
            $deliveryFee = 0;
        }

        // Calculate commissions
        $driverCommission = $deliveryFee * self::DEFAULT_DRIVER_COMMISSION_RATE;
        $platformCommission = $deliveryFee * self::DEFAULT_PLATFORM_RATE;

        return [
            'delivery_fee' => $deliveryFee,
            'driver_commission' => round($driverCommission, 0),
            'platform_commission' => round($platformCommission, 0),
            'distance_km' => round($distance, 2),
            'free_delivery' => $deliveryFee === 0,
            'free_delivery_message' => $deliveryFee === 0
                ? 'Livraison gratuite pour les commandes de '.number_format(self::FREE_DELIVERY_THRESHOLD, 0, ',', ' ').' XOF et plus'
                : null,
        ];
    }

    /**
     * Get delivery estimate without zone (for frontend preview)
     */
    public function estimateDelivery(
        float $pickupLat,
        float $pickupLng,
        float $deliveryLat,
        float $deliveryLng,
        float $orderAmount = 0
    ): array {
        $distance = $this->calculateDistance($pickupLat, $pickupLng, $deliveryLat, $deliveryLng);

        // Find appropriate zone
        $zone = $this->findZoneForCoordinates($deliveryLat, $deliveryLng);

        $pricing = $this->calculateDeliveryFee(
            $pickupLat,
            $pickupLng,
            $deliveryLat,
            $deliveryLng,
            $orderAmount,
            $zone
        );

        // Estimate delivery time (average 3 min/km + 10 min for pickup)
        $estimatedMinutes = ceil($distance * 3) + 10;

        return array_merge($pricing, [
            'zone' => $zone ? [
                'id' => $zone->id,
                'name' => $zone->name,
                'city' => $zone->city,
            ] : null,
            'estimated_time_minutes' => $estimatedMinutes,
            'estimated_time_text' => $this->formatDuration($estimatedMinutes * 60),
            'is_available' => $zone !== null,
            'unavailable_message' => $zone === null
                ? 'Désolé, cette adresse n\'est pas encore couverte par notre service de livraison'
                : null,
        ]);
    }

    /**
     * Calculate surge pricing based on demand
     */
    public function calculateSurgePricing(DeliveryZone $zone): float
    {
        // Count pending deliveries in zone
        $pendingCount = $zone->deliveries()
            ->whereIn('status', ['pending', 'searching'])
            ->count();

        // Count available drivers in zone
        $availableDrivers = $zone->drivers()
            ->where('is_available', true)
            ->where('is_verified', true)
            ->where('is_active', true)
            ->count();

        if ($availableDrivers === 0) {
            return 1.5; // 50% surge if no drivers
        }

        $ratio = $pendingCount / $availableDrivers;

        if ($ratio > 3) {
            return 1.5; // 50% surge
        } elseif ($ratio > 2) {
            return 1.3; // 30% surge
        } elseif ($ratio > 1) {
            return 1.15; // 15% surge
        }

        return 1.0; // No surge
    }

    /**
     * Find zone for coordinates
     */
    private function findZoneForCoordinates(float $lat, float $lng): ?DeliveryZone
    {
        $zones = DeliveryZone::active()->get();

        foreach ($zones as $zone) {
            $distance = $this->calculateDistance(
                $lat,
                $lng,
                $zone->center_latitude,
                $zone->center_longitude
            );

            // Assume 10km coverage per zone
            if ($distance <= 10) {
                return $zone;
            }
        }

        return null;
    }

    /**
     * Calculate distance using Haversine formula
     */
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

    /**
     * Format duration in human-readable format
     */
    private function formatDuration(int $seconds): string
    {
        $minutes = ceil($seconds / 60);

        if ($minutes < 60) {
            return $minutes.' min';
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($remainingMinutes === 0) {
            return $hours.'h';
        }

        return $hours.'h '.$remainingMinutes.'min';
    }
}
