<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class MerchantController extends Controller
{
    /**
     * Met à jour les coordonnées GPS du commerçant
     */
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.'
                ], 403);
            }

            $merchant = $user->merchant;
            if (!$merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ], [
                'latitude.required' => 'La latitude est requise',
                'latitude.between' => 'La latitude doit être entre -90 et 90',
                'longitude.required' => 'La longitude est requise',
                'longitude.between' => 'La longitude doit être entre -180 et 180',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de géolocalisation invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $merchant->update([
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Localisation mise à jour avec succès',
                'data' => [
                    'latitude' => $merchant->latitude,
                    'longitude' => $merchant->longitude,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la localisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient les coordonnées GPS du commerçant
     */
    public function getLocation(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.'
                ], 403);
            }

            $merchant = $user->merchant;
            if (!$merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'latitude' => $merchant->latitude,
                    'longitude' => $merchant->longitude,
                    'has_location' => !is_null($merchant->latitude) && !is_null($merchant->longitude),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la localisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recherche des commerçants par proximité
     */
    public function nearby(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coordonnées invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $latitude = $request->latitude;
            $longitude = $request->longitude;
            $radiusKm = $request->get('radius', 10);

            $merchants = Merchant::with(['user', 'products' => function ($query) {
                    $query->active()->available();
                }])
                ->verified()
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->nearby($latitude, $longitude, $radiusKm)
                ->limit(50)
                ->get();

            $merchants->transform(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'latitude' => $merchant->latitude,
                    'longitude' => $merchant->longitude,
                    'distance_km' => $merchant->distance ?? null,
                    'products_count' => $merchant->products->count(),
                    'is_verified' => $merchant->is_verified,
                    'user' => [
                        'city' => $merchant->user->city,
                        'address' => $merchant->user->address,
                        'phone' => $merchant->user->phone,
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $merchants,
                'search_params' => [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'radius_km' => $radiusKm,
                    'total_found' => $merchants->count()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche de commerçants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère tous les commerçants avec leurs coordonnées
     */
    public function getAllWithLocation(): JsonResponse
    {
        try {
            $merchants = Merchant::with(['user', 'products' => function ($query) {
                    $query->active()->available();
                }])
                ->verified()
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->limit(100)
                ->get();

            $merchants->transform(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'latitude' => floatval($merchant->latitude),
                    'longitude' => floatval($merchant->longitude),
                    'products_count' => $merchant->products->count(),
                    'is_verified' => $merchant->is_verified,
                    'user' => [
                        'city' => $merchant->user->city,
                        'address' => $merchant->user->address,
                        'phone' => $merchant->user->phone,
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $merchants,
                'total' => $merchants->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commerçants',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}