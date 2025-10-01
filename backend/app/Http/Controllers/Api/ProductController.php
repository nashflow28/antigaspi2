<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProductController extends Controller
{
    public function __construct()
    {
        // Middleware is handled in routes, not controller for Laravel 11
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['merchant.user', 'category'])
                ->active()
                ->available();

            // Filtres
            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            if ($request->has('merchant_id')) {
                $query->byMerchant($request->merchant_id);
            }

            if ($request->has('city')) {
                $query->whereHas('merchant.user', function ($q) use ($request) {
                    $q->where('city', 'like', '%' . $request->city . '%');
                });
            }

            if ($request->has('min_price') || $request->has('max_price')) {
                $query->priceRange($request->min_price, $request->max_price);
            }

            if ($request->has('expiring_soon')) {
                $query->expiringSoon($request->expiring_soon ?: 2);
            }

            // Filtre géographique "Près de moi"
            if ($request->has('latitude') && $request->has('longitude')) {
                $latitude = $request->latitude;
                $longitude = $request->longitude;
                $radiusKm = $request->get('radius', 10); // Rayon par défaut : 10km

                $query->whereHas('merchant', function ($q) use ($latitude, $longitude, $radiusKm) {
                    $q->whereNotNull('latitude')
                      ->whereNotNull('longitude')
                      ->selectRaw("
                          merchants.*,
                          (6371 * acos(cos(radians(?))
                              * cos(radians(latitude))
                              * cos(radians(longitude) - radians(?))
                              + sin(radians(?))
                              * sin(radians(latitude)))) AS distance
                      ", [$latitude, $longitude, $latitude])
                      ->having('distance', '<', $radiusKm);
                });
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            if ($sortBy === 'price') {
                $query->orderBy('discounted_price', $sortOrder);
            } elseif ($sortBy === 'expiration') {
                $query->orderBy('expiration_date', 'asc');
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = min($request->get('per_page', 12), 50);
            $products = $query->paginate($perPage);

            // Formater les données
            $products->getCollection()->transform(function ($product) use ($request) {
                $merchantData = [
                    'id' => $product->merchant->id,
                    'business_name' => $product->merchant->business_name,
                    'business_type' => $product->merchant->business_type,
                    'city' => $product->merchant->user->city,
                    'address' => $product->merchant->user->address,
                    'phone' => $product->merchant->user->phone,
                    'is_verified' => $product->merchant->is_verified,
                    'latitude' => $product->merchant->latitude,
                    'longitude' => $product->merchant->longitude,
                ];

                // Ajouter la distance si géolocalisation demandée
                if ($request->has('latitude') && $request->has('longitude') &&
                    $product->merchant->latitude && $product->merchant->longitude) {

                    $userLat = $request->latitude;
                    $userLng = $request->longitude;
                    $merchantLat = $product->merchant->latitude;
                    $merchantLng = $product->merchant->longitude;

                    // Calcul distance avec formule haversine
                    $earthRadius = 6371; // Rayon de la Terre en km
                    $dLat = deg2rad($merchantLat - $userLat);
                    $dLng = deg2rad($merchantLng - $userLng);
                    $a = sin($dLat/2) * sin($dLat/2) +
                         cos(deg2rad($userLat)) * cos(deg2rad($merchantLat)) *
                         sin($dLng/2) * sin($dLng/2);
                    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
                    $distance = $earthRadius * $c;

                    $merchantData['distance_km'] = round($distance, 2);
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'original_price' => $product->original_price,
                    'discounted_price' => $product->discounted_price,
                    'quantity_available' => $product->quantity_available,
                    'expiration_date' => $product->expiration_date,
                    'image_url' => $product->image_url,
                    'discount_percentage' => $product->discount_percentage,
                    'savings' => $product->savings,
                    'days_until_expiration' => $product->days_until_expiration,
                    'category' => [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'icon' => $product->category->icon,
                    ],
                    'merchant' => $merchantData,
                    'created_at' => $product->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $product = Product::with(['merchant.user', 'category', 'reviews.user'])
                ->active()
                ->findOrFail($id);

            $productData = [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'original_price' => $product->original_price,
                'discounted_price' => $product->discounted_price,
                'quantity_available' => $product->quantity_available,
                'expiration_date' => $product->expiration_date,
                'image_url' => $product->image_url,
                'discount_percentage' => $product->discount_percentage,
                'savings' => $product->savings,
                'days_until_expiration' => $product->days_until_expiration,
                'is_expired' => $product->isExpired(),
                'is_expiring_soon' => $product->isExpiringSoon(),
                'category' => [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'icon' => $product->category->icon,
                ],
                'merchant' => [
                    'id' => $product->merchant->id,
                    'business_name' => $product->merchant->business_name,
                    'business_type' => $product->merchant->business_type,
                    'city' => $product->merchant->user->city,
                    'address' => $product->merchant->user->address,
                    'phone' => $product->merchant->user->phone,
                    'is_verified' => $product->merchant->is_verified,
                    'average_rating' => $product->merchant->average_rating,
                ],
                'reviews' => $product->reviews->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'title' => $review->title,
                        'comment' => $review->comment,
                        'user_name' => $review->user->first_name,
                        'created_at' => $review->created_at,
                    ];
                }),
                'created_at' => $product->created_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $productData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Show merchant's own product (without active filter)
     */
    public function showOwn($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent accéder à cette ressource'
                ], 403);
            }

            $product = Product::with(['merchant.user', 'category'])
                ->findOrFail($id);

            // Verify product belongs to this merchant
            if ($product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez accéder qu\'à vos propres produits'
                ], 403);
            }

            $productData = [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'original_price' => $product->original_price,
                'discounted_price' => $product->discounted_price,
                'quantity_available' => $product->quantity_available,
                'expiration_date' => $product->expiration_date,
                'image_url' => $product->image_url,
                'is_active' => $product->is_active,
                'discount_percentage' => $product->discount_percentage,
                'savings' => $product->savings,
                'days_until_expiration' => $product->days_until_expiration,
                'is_expired' => $product->isExpired(),
                'is_expiring_soon' => $product->isExpiringSoon(),
                'category' => [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'icon' => $product->category->icon,
                ],
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $productData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent ajouter des produits'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'category_id' => 'required|exists:categories,id',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'original_price' => 'required|numeric|min:0',
                'discounted_price' => 'required|numeric|min:0|lt:original_price',
                'quantity_available' => 'required|integer|min:1',
                'expiration_date' => 'required|date|after:today',
                'image_url' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product = Product::create([
                'merchant_id' => $user->merchant->id,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'description' => $request->description,
                'original_price' => $request->original_price,
                'discounted_price' => $request->discounted_price,
                'quantity_available' => $request->quantity_available,
                'expiration_date' => $request->expiration_date,
                'image_url' => $request->image_url,
                'is_active' => true,
            ]);

            $product->load(['category', 'merchant.user']);

            return response()->json([
                'success' => true,
                'message' => 'Produit ajouté avec succès',
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'discounted_price' => $product->discounted_price,
                    'quantity_available' => $product->quantity_available,
                    'category' => $product->category->name,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $product = Product::findOrFail($id);

            // Debug logging
            \Log::info('UPDATE PRODUCT DEBUG', [
                'product_id' => $id,
                'authenticated_user_id' => $user->id,
                'authenticated_user_email' => $user->email,
                'product_merchant_id' => $product->merchant->id,
                'product_merchant_user_id' => $product->merchant->user_id,
                'user_merchant_id' => $user->merchant ? $user->merchant->id : 'null'
            ]);

            if ($product->merchant->user_id !== $user->id) {
                \Log::warning('UNAUTHORIZED UPDATE ATTEMPT', [
                    'product_merchant_user_id' => $product->merchant->user_id,
                    'authenticated_user_id' => $user->id
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que vos propres produits'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'category_id' => 'sometimes|exists:categories,id',
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'original_price' => 'sometimes|numeric|min:0',
                'discounted_price' => 'sometimes|numeric|min:0',
                'quantity_available' => 'sometimes|integer|min:0',
                'expiration_date' => 'sometimes|date',
                'image_url' => 'sometimes|string|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            \Log::info('VALIDATION ATTEMPT', [
                'request_data' => $request->all(),
                'validation_passed' => !$validator->fails()
            ]);

            if ($validator->fails()) {
                \Log::error('VALIDATION FAILED', [
                    'errors' => $validator->errors()->toArray()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            \Log::info('ATTEMPTING PRODUCT UPDATE', [
                'product_id' => $id,
                'update_data' => $request->only([
                    'category_id', 'name', 'description', 'original_price',
                    'discounted_price', 'quantity_available', 'expiration_date',
                    'image_url', 'is_active'
                ])
            ]);

            $product->update($request->only([
                'category_id', 'name', 'description', 'original_price',
                'discounted_price', 'quantity_available', 'expiration_date',
                'image_url', 'is_active'
            ]));

            \Log::info('PRODUCT UPDATED SUCCESSFULLY', ['product_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Produit mis à jour avec succès',
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'discounted_price' => $product->discounted_price,
                    'quantity_available' => $product->quantity_available,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('PRODUCT UPDATE ERROR', [
                'product_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $product = Product::findOrFail($id);

            if ($product->merchant->user_id !== $user->id && !$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez supprimer que vos propres produits'
                ], 403);
            }

            // Vérifier s'il y a des réservations actives
            $activeReservations = $product->reservations()
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();

            if ($activeReservations > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un produit avec des réservations actives'
                ], 400);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produit supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload product image
     */
    public function uploadImage(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent uploader des images'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();

                // Store in public/products directory
                $path = $image->storeAs('products', $filename, 'public');

                // Generate public URL
                $url = Storage::url($path);

                return response()->json([
                    'success' => true,
                    'message' => 'Image uploadée avec succès',
                    'data' => [
                        'url' => $url,
                        'path' => $path
                    ]
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Aucune image fournie'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function merchantProducts(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent accéder à cette ressource'
                ], 403);
            }

            $query = Product::with(['category'])
                ->where('merchant_id', $user->merchant->id);

            // Filtres
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 12), 50);
            $products = $query->paginate($perPage);

            // Formater les données
            $products->getCollection()->transform(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'original_price' => $product->original_price,
                    'discounted_price' => $product->discounted_price,
                    'quantity_available' => $product->quantity_available,
                    'expiration_date' => $product->expiration_date,
                    'image_url' => $product->image_url,
                    'discount_percentage' => $product->discount_percentage,
                    'is_active' => $product->is_active,
                    'category' => [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'icon' => $product->category->icon,
                    ],
                    'created_at' => $product->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function categories(): JsonResponse
    {
        try {
            $categories = Category::active()->get(['id', 'name', 'description']);

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
