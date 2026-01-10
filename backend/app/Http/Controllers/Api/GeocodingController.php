<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeocodingController extends Controller
{
    protected GeocodingService $geocodingService;

    public function __construct(GeocodingService $geocodingService)
    {
        $this->geocodingService = $geocodingService;
    }

    /**
     * Forward geocode - convert address to coordinates
     */
    public function geocode(Request $request): JsonResponse
    {
        $request->validate([
            'address' => 'required|string|min:3|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|size:2',
        ]);

        $result = $this->geocodingService->geocode(
            $request->address,
            $request->city,
            $request->country ?? 'TG'
        );

        if ($result) {
            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Adresse non trouvée',
        ], 404);
    }

    /**
     * Reverse geocode - convert coordinates to address
     */
    public function reverseGeocode(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric|min:-90|max:90',
            'longitude' => 'required|numeric|min:-180|max:180',
        ]);

        $latitude = (float) $request->latitude;
        $longitude = (float) $request->longitude;

        // Validate coordinates are in expected region
        if (! $this->geocodingService->validateCoordinates($latitude, $longitude)) {
            return response()->json([
                'success' => false,
                'message' => 'Coordonnées hors de la zone couverte',
            ], 400);
        }

        $result = $this->geocodingService->reverseGeocode($latitude, $longitude);

        if ($result) {
            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Adresse non trouvée pour ces coordonnées',
        ], 404);
    }

    /**
     * Search for address suggestions (autocomplete)
     */
    public function searchAddresses(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:3|max:255',
            'country' => 'nullable|string|size:2',
            'limit' => 'nullable|integer|min:1|max:10',
        ]);

        $results = $this->geocodingService->searchAddresses(
            $request->query('query'),
            $request->query('country', 'TG'),
            $request->query('limit', 5)
        );

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
