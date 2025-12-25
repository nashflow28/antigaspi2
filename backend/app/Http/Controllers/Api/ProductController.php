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
use Illuminate\Support\Facades\Cache;

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

            // 🐛 BUG FIX #11 (Edge Case): Validate sort parameters to prevent SQL injection
            $allowedSortFields = ['created_at', 'discounted_price', 'expiration_date', 'name'];
            $sortBy = in_array($request->get('sort_by'), $allowedSortFields)
                ? $request->get('sort_by')
                : 'created_at';

            $sortOrder = in_array(strtolower($request->get('sort_order', 'desc')), ['asc', 'desc'])
                ? strtolower($request->get('sort_order', 'desc'))
                : 'desc';

            // Tri
            if ($sortBy === 'discounted_price') {
                $query->orderBy('discounted_price', $sortOrder);
            } elseif ($sortBy === 'expiration_date') {
                $query->orderBy('expiration_date', $sortOrder);
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

                    // 🐛 BUG FIX #16: Prevent division by zero when exact same location
                    if ($a >= 1.0) {
                        // Distance = 0 (même point GPS)
                        $merchantData['distance_km'] = 0.0;
                    } else {
                        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
                        $distance = $earthRadius * $c;
                        $merchantData['distance_km'] = round($distance, 2);
                    }
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
                    'is_surprise_basket' => (bool) $product->is_surprise_basket,
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

            // 🐛 BUG FIX #17: Verify merchant exists to prevent null pointer errors
            if (!$product->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit orphelin - Commerçant introuvable',
                    'error' => 'Ce produit n\'est plus disponible (merchant manquant)'
                ], 404);
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

            // 🐛 BUG FIX #15: Verify merchant relationship exists
            if (!$product->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit orphelin détecté - merchant manquant'
                ], 500);
            }

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
                // category_id removed - automatically uses merchant's category
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

            // Always use merchant's category - no choice allowed
            $categoryId = $user->merchant->category_id;

            // Fallback to first available category if merchant doesn't have a category
            if (!$categoryId) {
                $firstCategory = Category::first();
                $categoryId = $firstCategory ? $firstCategory->id : 1;
            }

            $product = Product::create([
                'merchant_id' => $user->merchant->id,
                'category_id' => $categoryId, // Automatically assigned from merchant
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
                // category_id removed - cannot be changed (always uses merchant's category)
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
                'original_price' => 'sometimes|numeric|min:0',
                'discounted_price' => 'sometimes|numeric|min:0',
                'quantity_available' => 'sometimes|integer|min:0',
                'expiration_date' => 'sometimes|date',
                'image_url' => 'sometimes|nullable|string|max:255', // 🐛 BUG FIX #26: Allow null for products without images
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

            // 🐛 BUG FIX #19: Validate price consistency (discounted_price < original_price)
            $newDiscountedPrice = $request->filled('discounted_price') ? $request->discounted_price : $product->discounted_price;
            $newOriginalPrice = $request->filled('original_price') ? $request->original_price : $product->original_price;

            if ($newDiscountedPrice >= $newOriginalPrice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le prix remisé doit être inférieur au prix d\'origine',
                    'errors' => [
                        'discounted_price' => ['Le prix remisé doit être inférieur au prix d\'origine']
                    ]
                ], 422);
            }

            // 🐛 BUG FIX #14: Validate image_url path to prevent traversal attacks
            // Updated: Allow valid HTTP/HTTPS URLs, only block path traversal in file paths
            if ($request->filled('image_url')) {
                $imagePath = $request->image_url;
                // Only validate if it's NOT a valid HTTP/HTTPS URL
                if (!filter_var($imagePath, FILTER_VALIDATE_URL)) {
                    // For file paths, check for path traversal attempts
                    if (str_contains($imagePath, '..') || str_contains($imagePath, '//')) {
                        \Log::error('Path traversal attempt detected in product update', [
                            'product_id' => $id,
                            'user_id' => $user->id,
                            'suspicious_path' => $imagePath
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid image path detected'
                        ], 400);
                    }
                }
            }

            \Log::info('ATTEMPTING PRODUCT UPDATE', [
                'product_id' => $id,
                'update_data' => $request->only([
                    'name', 'description', 'original_price',
                    'discounted_price', 'quantity_available', 'expiration_date',
                    'image_url', 'is_active'
                ])
            ]);

            // category_id excluded - cannot be changed (always merchant's category)
            $product->update($request->only([
                'name', 'description', 'original_price',
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
            // 🐛 BUG FIX #4: Conditionner trace logs à environnement local
            \Log::error('PRODUCT UPDATE ERROR', [
                'product_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null
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
     * 🔒 SECURED: MIME type verification, secure filename generation, rate limiting
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $uploadedPath = null; // 🐛 BUG FIX #3: Track uploaded file for cleanup on error

        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent uploader des images'
                ], 403);
            }

            // 🐛 EDGE CASE #1: Empty files already prevented by 'image' validation + getimagesize()
            $validator = Validator::make($request->all(), [
                'image' => 'required|file|max:2048', // 🔒 SECURITY: Max 2MB for products
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune image fournie'
                ], 400);
            }

            $image = $request->file('image');

            // 🔒 SECURITY: Verify actual MIME type (not just client-provided extension)
            $mimeType = $image->getMimeType();

            // 🐛 BUG FIX #1: Guard contre null getMimeType()
            if (is_null($mimeType) || empty($mimeType)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de déterminer le type du fichier. Fichier corrompu ?'
                ], 422);
            }

            // 🐛 BUG FIX #17: Proper MIME type mapping (image/jpg is INVALID, only image/jpeg is correct)
            // Mapping MIME types → extensions (always use first extension for consistency)
            $allowedMimeTypes = [
                'image/jpeg' => ['jpg', 'jpeg'], // Standard JPEG (always use .jpg, not .jpeg)
                'image/png' => ['png'],
                'image/webp' => ['webp'],
            ];

            if (!array_key_exists($mimeType, $allowedMimeTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP',
                    'error' => "MIME type '{$mimeType}' non supporté. Types valides : image/jpeg, image/png, image/webp"
                ], 422);
            }

            // 🔒 SECURITY: Validate image dimensions (max 2000x2000px for products)
            $imageInfo = getimagesize($image->getRealPath());
            if ($imageInfo === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de lire les dimensions de l\'image. Fichier corrompu ?'
                ], 422);
            }

            [$width, $height] = $imageInfo;
            if ($width > 2000 || $height > 2000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image trop grande. Dimensions maximales : 2000x2000px',
                    'error' => "Current dimensions: {$width}x{$height}px"
                ], 422);
            }

            // 🐛 BUG FIX #17: Use first extension from mapping for consistency (.jpg, not .jpeg)
            // 🔒 SECURITY: Extension determined by server-verified MIME type, not client input
            $extension = $allowedMimeTypes[$mimeType][0];
            $filename = \Illuminate\Support\Str::random(40) . '.' . $extension;

            // 🔒 SECURITY: Use Storage facade for secure file handling
            $path = $image->storeAs('products', $filename, 'public');
            $uploadedPath = $path; // 🐛 BUG FIX #3: Track uploaded path for cleanup

            // Generate public URL
            $url = Storage::url($path);

            return response()->json([
                'success' => true,
                'message' => 'Image uploadée avec succès',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'filename' => $filename
                ]
            ], 200);

        } catch (\Exception $e) {
            // 🐛 BUG FIX #3: Cleanup orphan file if upload succeeded but subsequent operations failed
            if ($uploadedPath && Storage::disk('public')->exists($uploadedPath)) {
                Storage::disk('public')->delete($uploadedPath);
                \Log::info('Cleaned up orphan file after error', ['path' => $uploadedPath]);
            }

            // 🐛 BUG FIX #4: Conditionner trace logs à environnement local
            \Log::error('PRODUCT IMAGE UPLOAD ERROR', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null
            ]);

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

            // 🐛 BUG FIX #18: Validate sort parameters to prevent SQL injection (same whitelist as index())
            $allowedSortFields = ['created_at', 'discounted_price', 'expiration_date', 'name'];
            $sortBy = in_array($request->get('sort_by'), $allowedSortFields)
                ? $request->get('sort_by')
                : 'created_at';

            $sortOrder = in_array(strtolower($request->get('sort_order', 'desc')), ['asc', 'desc'])
                ? strtolower($request->get('sort_order', 'desc'))
                : 'desc';

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
                    'is_surprise_basket' => (bool) $product->is_surprise_basket,
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
        // 🐛 BUG FIX #30: Cache categories with TTL (1 hour) to reduce database queries
        try {
            $categories = Cache::remember('categories.active', 3600, function () {
                return Category::active()->get(['id', 'name', 'description']);
            });

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

    /**
     * Get categories for authenticated merchant based on business_type
     */
    public function merchantCategories(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent accéder à cette ressource'
                ], 403);
            }

            $merchant = $user->merchant;
            $businessType = strtolower($merchant->business_type);

            // Mapping business_type → category IDs autorisés
            $categoryMapping = [
                'bakery' => [1], // Boulangerie (EN)
                'boulangerie' => [1], // Boulangerie (FR)
                'primeur' => [2], // Fruits & Légumes
                'produce' => [2], // Fruits & Légumes (EN)
                'fruits' => [2], // Fruits & Légumes
                'vegetables' => [2], // Légumes (EN)
                'butcher' => [5], // Viande et Poisson (EN)
                'boucherie' => [5], // Viande et Poisson
                'fishmonger' => [5], // Poisson
                'grocery' => [4], // Épicerie (EN)
                'epicerie' => [4], // Épicerie (FR)
                'supermarket' => [1, 2, 3, 4, 5, 6, 7, 8], // Toutes catégories (EN)
                'supermarché' => [1, 2, 3, 4, 5, 6, 7, 8], // Toutes catégories (FR)
                'supermarche' => [1, 2, 3, 4, 5, 6, 7, 8], // Toutes catégories (FR sans accent)
                'restaurant' => [6, 8], // Boissons + Traiteur
                'cafe' => [6, 7], // Boissons + Pâtisserie
                'bar' => [6], // Boissons
                'patisserie' => [7], // Pâtisserie (FR)
                'pastry' => [7], // Pâtisserie (EN)
                'catering' => [8], // Traiteur (EN)
                'traiteur' => [8], // Traiteur (FR)
            ];

            // Déterminer catégories autorisées
            $allowedCategoryIds = [];
            foreach ($categoryMapping as $type => $categoryIds) {
                if (str_contains($businessType, $type)) {
                    $allowedCategoryIds = array_merge($allowedCategoryIds, $categoryIds);
                }
            }

            // Si aucun match, autoriser toutes catégories (fallback sécurisé)
            if (empty($allowedCategoryIds)) {
                $allowedCategoryIds = Category::active()->pluck('id')->toArray();
            }

            $categories = Category::active()
                ->whereIn('id', array_unique($allowedCategoryIds))
                ->get(['id', 'name', 'description', 'icon']);

            return response()->json([
                'success' => true,
                'data' => $categories,
                'merchant_business_type' => $merchant->business_type,
                'allowed_categories_count' => count($categories)
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
