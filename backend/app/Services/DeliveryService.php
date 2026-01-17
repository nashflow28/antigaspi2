<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\DeliveryDriver;
use App\Models\DeliveryZone;
use App\Models\DriverEarning;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class DeliveryService
{
    public function __construct(
        private DeliveryPricingService $pricingService,
        private RouteCalculationService $routeService
    ) {}

    /**
     * Create a delivery request for a reservation
     */
    public function createDelivery(Reservation $reservation, array $data): Delivery
    {
        // Get merchant (pickup) location
        $merchant = $reservation->product->merchant;

        // Determine zone
        $zone = $this->findZoneForCoordinates(
            $data['delivery_latitude'],
            $data['delivery_longitude']
        );

        if (! $zone) {
            throw new \Exception('Cette adresse n\'est pas dans une zone de livraison couverte');
        }

        // Calculate pricing
        $pricing = $this->pricingService->calculateDeliveryFee(
            $merchant->latitude ?? 6.1725,
            $merchant->longitude ?? 1.2314,
            $data['delivery_latitude'],
            $data['delivery_longitude'],
            $reservation->total_price,
            $zone
        );

        // Calculate route info
        $routeInfo = $this->routeService->calculateRoute(
            $merchant->latitude ?? 6.1725,
            $merchant->longitude ?? 1.2314,
            $data['delivery_latitude'],
            $data['delivery_longitude']
        );

        DB::beginTransaction();
        try {
            $delivery = Delivery::create([
                'reservation_id' => $reservation->id,
                'delivery_zone_id' => $zone->id,
                'status' => Delivery::STATUS_PENDING,

                // Pickup (merchant) location
                'pickup_address' => $merchant->address ?? 'Adresse du commerçant',
                'pickup_latitude' => $merchant->latitude ?? 6.1725,
                'pickup_longitude' => $merchant->longitude ?? 1.2314,

                // Delivery (consumer) location
                'delivery_address' => $data['delivery_address'],
                'delivery_latitude' => $data['delivery_latitude'],
                'delivery_longitude' => $data['delivery_longitude'],
                'delivery_instructions' => $data['delivery_instructions'] ?? null,

                // Recipient info
                'recipient_name' => $data['recipient_name'],
                'recipient_phone' => $data['recipient_phone'],

                // Pricing
                'delivery_fee' => $pricing['delivery_fee'],
                'driver_commission' => $pricing['driver_commission'],
                'platform_commission' => $pricing['platform_commission'],

                // Route info
                'estimated_distance' => $routeInfo['distance'],
                'estimated_duration' => $routeInfo['duration'],
            ]);

            // Update reservation with delivery info
            $reservation->update([
                'delivery_requested' => true,
                'delivery_fee' => $pricing['delivery_fee'],
                'total_price' => $reservation->total_price + $pricing['delivery_fee'],
            ]);

            DB::commit();

            // Start searching for drivers
            $this->searchForDrivers($delivery);

            return $delivery;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Find the delivery zone for given coordinates
     */
    public function findZoneForCoordinates(float $lat, float $lng): ?DeliveryZone
    {
        // For now, simple check - return the zone with smallest distance to center
        // In production, use polygon containment
        $zones = DeliveryZone::active()->get();

        $nearestZone = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($zones as $zone) {
            $distance = $this->calculateDistance(
                $lat,
                $lng,
                $zone->center_latitude,
                $zone->center_longitude
            );

            // Check if within zone radius (assuming 10km max per zone)
            if ($distance < 10 && $distance < $minDistance) {
                $minDistance = $distance;
                $nearestZone = $zone;
            }
        }

        return $nearestZone;
    }

    /**
     * Search for available drivers for a delivery
     */
    public function searchForDrivers(Delivery $delivery): void
    {
        $delivery->update(['status' => Delivery::STATUS_SEARCHING]);

        // Find available drivers near pickup location
        $drivers = DeliveryDriver::available()
            ->nearby($delivery->pickup_latitude, $delivery->pickup_longitude, 5)
            ->limit(10)
            ->get();

        if ($drivers->isEmpty()) {
            // No drivers available right now, will be picked up when drivers come online
            return;
        }

        // In a real app, you would:
        // 1. Send push notifications to nearby drivers
        // 2. Use WebSocket to broadcast delivery offer
        // 3. Set a timeout for auto-reassignment

        // For now, just log the available drivers
        // event(new DeliverySearchStarted($delivery, $drivers));
    }

    /**
     * Assign a driver to a delivery
     */
    public function assignDriver(Delivery $delivery, DeliveryDriver $driver): void
    {
        if (! $driver->canAcceptDelivery()) {
            throw new \Exception('Ce livreur ne peut pas accepter de livraisons');
        }

        if (! in_array($delivery->status, [Delivery::STATUS_PENDING, Delivery::STATUS_SEARCHING])) {
            throw new \Exception('Cette livraison ne peut pas être assignée');
        }

        $delivery->assignDriver($driver);

        // Notify consumer
        // event(new DriverAssigned($delivery));
    }

    /**
     * Complete a delivery and process payment
     */
    public function completeDelivery(Delivery $delivery): void
    {
        if ($delivery->status !== Delivery::STATUS_DELIVERING) {
            throw new \Exception('Cette livraison ne peut pas être complétée');
        }

        DB::beginTransaction();
        try {
            $delivery->markAsDelivered();

            // Record driver earning
            DriverEarning::create([
                'driver_id' => $delivery->driver_id,
                'delivery_id' => $delivery->id,
                'type' => DriverEarning::TYPE_DELIVERY,
                'amount' => $delivery->driver_commission,
                'description' => 'Commission livraison #'.$delivery->delivery_code,
            ]);

            // Update driver stats
            $delivery->driver->updateStats($delivery);

            // Update reservation status
            $delivery->reservation->update(['status' => 'completed']);

            DB::commit();

            // Send notifications
            // event(new DeliveryCompleted($delivery));
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel a delivery
     */
    public function cancelDelivery(Delivery $delivery, string $reason, string $cancelledBy): void
    {
        DB::beginTransaction();
        try {
            $previousStatus = $delivery->status;
            $previousDriverId = $delivery->driver_id;

            $delivery->cancel($reason, $cancelledBy);

            // If driver was assigned, reset their availability
            if ($previousDriverId) {
                $driver = DeliveryDriver::find($previousDriverId);
                // Driver can take other deliveries now
            }

            // Refund delivery fee if already paid
            if ($delivery->reservation->delivery_fee > 0) {
                $delivery->reservation->update([
                    'total_price' => $delivery->reservation->total_price - $delivery->reservation->delivery_fee,
                    'delivery_fee' => 0,
                ]);
                // Process refund through payment service
            }

            DB::commit();

            // Send notifications
            // event(new DeliveryCancelled($delivery));
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get estimated delivery time
     */
    public function getEstimatedDeliveryTime(Delivery $delivery): ?string
    {
        if (! $delivery->driver) {
            return null;
        }

        // Get real-time route calculation
        $routeInfo = $this->routeService->calculateRoute(
            $delivery->driver->current_latitude,
            $delivery->driver->current_longitude,
            $delivery->status === Delivery::STATUS_PICKING_UP
                ? $delivery->pickup_latitude
                : $delivery->delivery_latitude,
            $delivery->status === Delivery::STATUS_PICKING_UP
                ? $delivery->pickup_longitude
                : $delivery->delivery_longitude
        );

        $minutes = ceil($routeInfo['duration'] / 60);

        if ($delivery->status === Delivery::STATUS_PICKING_UP) {
            $minutes += 5; // Add estimated pickup time
        }

        return now()->addMinutes($minutes)->format('H:i');
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
}
