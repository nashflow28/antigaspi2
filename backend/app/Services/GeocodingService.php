<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    /**
     * OpenStreetMap Nominatim API endpoint
     */
    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

    /**
     * Cache duration in seconds (1 week)
     */
    const CACHE_DURATION = 604800;

    /**
     * Forward geocode: Convert address to coordinates
     *
     * @param  string  $address  The address to geocode
     * @param  string|null  $city  Optional city for better accuracy
     * @param  string  $country  Country code (default: TG for Togo)
     * @return array|null Returns ['lat' => float, 'lng' => float, 'display_name' => string] or null
     */
    public function geocode(string $address, ?string $city = null, string $country = 'TG'): ?array
    {
        $fullAddress = trim($address);
        if ($city) {
            $fullAddress .= ', '.$city;
        }

        // Check cache first
        $cacheKey = 'geocode:'.md5($fullAddress.$country);
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Antigaspi/1.0 (https://antigaspi.jubtek.com)',
                ])
                ->get(self::NOMINATIM_URL.'/search', [
                    'q' => $fullAddress,
                    'countrycodes' => $country,
                    'format' => 'json',
                    'limit' => 1,
                    'addressdetails' => 1,
                ]);

            if ($response->successful()) {
                $data = $response->json();

                if (! empty($data) && isset($data[0])) {
                    $result = [
                        'lat' => (float) $data[0]['lat'],
                        'lng' => (float) $data[0]['lon'],
                        'display_name' => $data[0]['display_name'] ?? $fullAddress,
                        'address_details' => $data[0]['address'] ?? [],
                    ];

                    // Cache the result
                    Cache::put($cacheKey, $result, self::CACHE_DURATION);

                    return $result;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Geocoding failed', [
                'address' => $address,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Reverse geocode: Convert coordinates to address
     *
     * @return array|null Returns address details or null
     */
    public function reverseGeocode(float $latitude, float $longitude): ?array
    {
        // Check cache first
        $cacheKey = 'reverse_geocode:'.md5($latitude.','.$longitude);
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Antigaspi/1.0 (https://antigaspi.jubtek.com)',
                ])
                ->get(self::NOMINATIM_URL.'/reverse', [
                    'lat' => $latitude,
                    'lon' => $longitude,
                    'format' => 'json',
                    'addressdetails' => 1,
                ]);

            if ($response->successful()) {
                $data = $response->json();

                if (! empty($data) && isset($data['display_name'])) {
                    $result = [
                        'display_name' => $data['display_name'],
                        'address' => $data['address'] ?? [],
                        'street' => $this->extractStreet($data['address'] ?? []),
                        'city' => $data['address']['city'] ?? $data['address']['town'] ?? $data['address']['village'] ?? null,
                        'country' => $data['address']['country'] ?? null,
                        'country_code' => $data['address']['country_code'] ?? null,
                    ];

                    // Cache the result
                    Cache::put($cacheKey, $result, self::CACHE_DURATION);

                    return $result;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Reverse geocoding failed', [
                'lat' => $latitude,
                'lng' => $longitude,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Search for address suggestions (autocomplete)
     *
     * @param  string  $query  The search query
     * @param  string  $country  Country code
     * @param  int  $limit  Maximum number of results
     * @return array List of suggestions
     */
    public function searchAddresses(string $query, string $country = 'TG', int $limit = 5): array
    {
        if (strlen($query) < 3) {
            return [];
        }

        // Check cache first
        $cacheKey = 'address_search:'.md5($query.$country.$limit);
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Antigaspi/1.0 (https://antigaspi.jubtek.com)',
                ])
                ->get(self::NOMINATIM_URL.'/search', [
                    'q' => $query,
                    'countrycodes' => $country,
                    'format' => 'json',
                    'limit' => $limit,
                    'addressdetails' => 1,
                ]);

            if ($response->successful()) {
                $data = $response->json();

                $results = array_map(function ($item) {
                    return [
                        'display_name' => $item['display_name'],
                        'lat' => (float) $item['lat'],
                        'lng' => (float) $item['lon'],
                        'address' => $item['address'] ?? [],
                        'type' => $item['type'] ?? 'unknown',
                    ];
                }, $data);

                // Cache for shorter duration (1 hour for search results)
                Cache::put($cacheKey, $results, 3600);

                return $results;
            }
        } catch (\Exception $e) {
            Log::warning('Address search failed', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);
        }

        return [];
    }

    /**
     * Validate coordinates are within expected bounds for West Africa
     */
    public function validateCoordinates(float $latitude, float $longitude): bool
    {
        // West Africa approximate bounds
        // Lat: -5 to 25, Lng: -20 to 15
        return $latitude >= -5 && $latitude <= 25 &&
               $longitude >= -20 && $longitude <= 15;
    }

    /**
     * Extract street name from address components
     */
    protected function extractStreet(array $address): ?string
    {
        $parts = [];

        if (! empty($address['house_number'])) {
            $parts[] = $address['house_number'];
        }

        if (! empty($address['road'])) {
            $parts[] = $address['road'];
        } elseif (! empty($address['pedestrian'])) {
            $parts[] = $address['pedestrian'];
        } elseif (! empty($address['neighbourhood'])) {
            $parts[] = $address['neighbourhood'];
        }

        return ! empty($parts) ? implode(' ', $parts) : null;
    }
}
