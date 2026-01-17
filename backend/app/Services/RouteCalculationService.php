<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RouteCalculationService
{
    // OSRM public server (for development/demo)
    // In production, host your own OSRM server or use a commercial API
    private const OSRM_BASE_URL = 'https://router.project-osrm.org';

    // Cache duration in minutes
    private const CACHE_DURATION = 60;

    /**
     * Calculate route between two points using OSRM
     */
    public function calculateRoute(
        float $startLat,
        float $startLng,
        float $endLat,
        float $endLng,
        bool $includeGeometry = false
    ): array {
        $cacheKey = "route_{$startLat}_{$startLng}_{$endLat}_{$endLng}";

        return Cache::remember($cacheKey, self::CACHE_DURATION * 60, function () use (
            $startLat,
            $startLng,
            $endLat,
            $endLng,
            $includeGeometry
        ) {
            try {
                $response = $this->callOsrmApi($startLat, $startLng, $endLat, $endLng, $includeGeometry);

                if ($response && isset($response['routes'][0])) {
                    $route = $response['routes'][0];

                    return [
                        'distance' => $route['distance'] / 1000, // Convert to km
                        'duration' => $route['duration'], // In seconds
                        'duration_text' => $this->formatDuration($route['duration']),
                        'geometry' => $includeGeometry ? ($route['geometry'] ?? null) : null,
                        'source' => 'osrm',
                    ];
                }
            } catch (\Exception $e) {
                Log::warning('OSRM API failed, using fallback', [
                    'error' => $e->getMessage(),
                ]);
            }

            // Fallback to straight-line calculation
            return $this->calculateFallbackRoute($startLat, $startLng, $endLat, $endLng);
        });
    }

    /**
     * Calculate route with multiple waypoints
     */
    public function calculateRouteWithWaypoints(array $waypoints, bool $includeGeometry = false): array
    {
        if (count($waypoints) < 2) {
            throw new \InvalidArgumentException('At least 2 waypoints required');
        }

        $coordinates = collect($waypoints)
            ->map(fn ($wp) => "{$wp['lng']},{$wp['lat']}")
            ->join(';');

        $cacheKey = 'route_multi_'.md5($coordinates);

        return Cache::remember($cacheKey, self::CACHE_DURATION * 60, function () use ($coordinates, $includeGeometry) {
            try {
                $overview = $includeGeometry ? 'full' : 'false';
                $url = self::OSRM_BASE_URL."/route/v1/driving/{$coordinates}";

                $response = Http::timeout(10)->get($url, [
                    'overview' => $overview,
                    'geometries' => 'geojson',
                    'steps' => 'false',
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (isset($data['routes'][0])) {
                        $route = $data['routes'][0];

                        return [
                            'distance' => $route['distance'] / 1000,
                            'duration' => $route['duration'],
                            'duration_text' => $this->formatDuration($route['duration']),
                            'geometry' => $includeGeometry ? ($route['geometry'] ?? null) : null,
                            'legs' => collect($route['legs'] ?? [])->map(fn ($leg) => [
                                'distance' => $leg['distance'] / 1000,
                                'duration' => $leg['duration'],
                            ])->toArray(),
                            'source' => 'osrm',
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('OSRM multi-waypoint API failed', [
                    'error' => $e->getMessage(),
                ]);
            }

            // Fallback
            return $this->calculateFallbackMultiRoute($waypoints);
        });
    }

    /**
     * Get optimal route order for multiple deliveries (TSP)
     */
    public function optimizeDeliveryRoute(array $deliveryPoints, array $startPoint): array
    {
        // Simple nearest-neighbor algorithm for small sets
        // For larger sets, use OSRM's trip service or implement proper TSP

        $optimizedOrder = [];
        $remaining = $deliveryPoints;
        $current = $startPoint;

        while (! empty($remaining)) {
            $nearestIndex = 0;
            $nearestDistance = PHP_FLOAT_MAX;

            foreach ($remaining as $index => $point) {
                $distance = $this->calculateStraightLineDistance(
                    $current['lat'],
                    $current['lng'],
                    $point['lat'],
                    $point['lng']
                );

                if ($distance < $nearestDistance) {
                    $nearestDistance = $distance;
                    $nearestIndex = $index;
                }
            }

            $current = $remaining[$nearestIndex];
            $optimizedOrder[] = $current;
            unset($remaining[$nearestIndex]);
            $remaining = array_values($remaining);
        }

        return $optimizedOrder;
    }

    /**
     * Call OSRM API
     */
    private function callOsrmApi(
        float $startLat,
        float $startLng,
        float $endLat,
        float $endLng,
        bool $includeGeometry
    ): ?array {
        $coordinates = "{$startLng},{$startLat};{$endLng},{$endLat}";
        $overview = $includeGeometry ? 'full' : 'false';

        $url = self::OSRM_BASE_URL."/route/v1/driving/{$coordinates}";

        $response = Http::timeout(10)->get($url, [
            'overview' => $overview,
            'geometries' => 'geojson',
            'steps' => 'false',
        ]);

        if ($response->successful()) {
            return $response->json();
        }

        return null;
    }

    /**
     * Fallback route calculation using straight-line distance with road factor
     */
    private function calculateFallbackRoute(
        float $startLat,
        float $startLng,
        float $endLat,
        float $endLng
    ): array {
        $straightLineDistance = $this->calculateStraightLineDistance($startLat, $startLng, $endLat, $endLng);

        // Apply road factor (roads are typically 1.3-1.5x longer than straight line)
        $roadDistance = $straightLineDistance * 1.4;

        // Estimate duration: average 25 km/h in city traffic
        $duration = ($roadDistance / 25) * 3600; // Convert to seconds

        return [
            'distance' => round($roadDistance, 2),
            'duration' => round($duration),
            'duration_text' => $this->formatDuration($duration),
            'geometry' => null,
            'source' => 'fallback',
        ];
    }

    /**
     * Fallback for multi-waypoint routes
     */
    private function calculateFallbackMultiRoute(array $waypoints): array
    {
        $totalDistance = 0;
        $totalDuration = 0;
        $legs = [];

        for ($i = 0; $i < count($waypoints) - 1; $i++) {
            $legRoute = $this->calculateFallbackRoute(
                $waypoints[$i]['lat'],
                $waypoints[$i]['lng'],
                $waypoints[$i + 1]['lat'],
                $waypoints[$i + 1]['lng']
            );

            $totalDistance += $legRoute['distance'];
            $totalDuration += $legRoute['duration'];
            $legs[] = [
                'distance' => $legRoute['distance'],
                'duration' => $legRoute['duration'],
            ];
        }

        return [
            'distance' => round($totalDistance, 2),
            'duration' => round($totalDuration),
            'duration_text' => $this->formatDuration($totalDuration),
            'geometry' => null,
            'legs' => $legs,
            'source' => 'fallback',
        ];
    }

    /**
     * Calculate straight-line distance using Haversine formula
     */
    private function calculateStraightLineDistance(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
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
    private function formatDuration(float $seconds): string
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
