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
     * Liste publique des commerçants disponibles pour la vitrine
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Merchant::with(['user'])
                ->withCount(['products as products_count' => function ($productQuery) {
                    $productQuery->active()->available();
                }])
                ->verified();

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('business_name', 'like', "%{$search}%")
                        ->orWhere('business_type', 'like', "%{$search}%");
                });
            }

            if ($request->filled('city')) {
                $city = $request->input('city');
                $query->whereHas('user', function ($q) use ($city) {
                    $q->where('city', 'like', "%{$city}%");
                });
            }

            if ($request->filled('business_type')) {
                $query->where('business_type', $request->input('business_type'));
            }

            if ($request->boolean('has_products')) {
                $query->having('products_count', '>', 0);
            }

            $sortBy = $request->get('sort_by', 'recent');
            switch ($sortBy) {
                case 'products':
                    $query->orderByDesc('products_count');
                    break;
                case 'name':
                    $query->orderBy('business_name');
                    break;
                default:
                    $query->orderByDesc('created_at');
                    break;
            }

            $perPage = min(max((int) $request->get('per_page', 12), 1), 50);
            $merchants = $query->paginate($perPage);

            $data = $merchants->getCollection()->transform(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'is_verified' => (bool) $merchant->is_verified,
                    'latitude' => $merchant->latitude ? (float) $merchant->latitude : null,
                    'longitude' => $merchant->longitude ? (float) $merchant->longitude : null,
                    'products_count' => (int) ($merchant->products_count ?? 0),
                    'user' => [
                        'city' => optional($merchant->user)->city,
                        'address' => optional($merchant->user)->address,
                        'phone' => optional($merchant->user)->phone,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'current_page' => $merchants->currentPage(),
                    'last_page' => $merchants->lastPage(),
                    'per_page' => $merchants->perPage(),
                    'total' => $merchants->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commerçants',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

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