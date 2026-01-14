<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
                ->withCount([
                    'products as products_count' => function ($productQuery) {
                        $productQuery->active()->available();
                    },
                    'reviews as reviews_count' => function ($reviewQuery) {
                        $reviewQuery->approved();
                    },
                ])
                ->withAvg(['reviews as average_rating' => function ($reviewQuery) {
                    $reviewQuery->approved();
                }], 'rating')
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

            // Distance-based filtering and sorting
            $userLat = $request->filled('latitude') ? (float) $request->input('latitude') : null;
            $userLng = $request->filled('longitude') ? (float) $request->input('longitude') : null;
            $radius = $request->filled('radius') ? (float) $request->input('radius') : null;

            if ($userLat !== null && $userLng !== null) {
                // Add distance calculation using Haversine formula
                // Note: Only add distance_km column, don't re-select merchants.* to avoid duplicate column error
                $query->selectRaw(
                    '(6371 * acos(cos(radians(?))
                        * cos(radians(latitude))
                        * cos(radians(longitude) - radians(?))
                        + sin(radians(?))
                        * sin(radians(latitude)))) AS distance_km',
                    [$userLat, $userLng, $userLat]
                )
                    ->whereNotNull('latitude')
                    ->whereNotNull('longitude');

                // Filter by radius if provided
                if ($radius !== null && $radius > 0) {
                    $query->having('distance_km', '<=', $radius);
                }
            }

            $sortBy = $request->get('sort_by', 'recent');
            switch ($sortBy) {
                case 'products':
                    $query->orderByDesc('products_count');
                    break;
                case 'name':
                    $query->orderBy('business_name');
                    break;
                case 'rating':
                    $query->orderByDesc('average_rating');
                    break;
                case 'distance':
                    if ($userLat !== null && $userLng !== null) {
                        $query->orderBy('distance_km');
                    } else {
                        $query->orderByDesc('created_at');
                    }
                    break;
                default:
                    $query->orderByDesc('created_at');
                    break;
            }

            $perPage = min(max((int) $request->get('per_page', 12), 1), 50);
            $merchants = $query->paginate($perPage);

            $data = $merchants->getCollection()->transform(function ($merchant) {
                $result = [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'is_verified' => (bool) $merchant->is_verified,
                    'latitude' => $merchant->latitude ? (float) $merchant->latitude : null,
                    'longitude' => $merchant->longitude ? (float) $merchant->longitude : null,
                    'products_count' => (int) ($merchant->products_count ?? 0),
                    'average_rating' => $merchant->average_rating ? round((float) $merchant->average_rating, 1) : null,
                    'reviews_count' => (int) ($merchant->reviews_count ?? 0),
                    'photo_url' => $merchant->photo_url,
                    'logo_url' => $merchant->logo_url,
                    'user' => [
                        'city' => optional($merchant->user)->city,
                        'address' => optional($merchant->user)->address,
                        'phone' => optional($merchant->user)->phone,
                        'photo_url' => optional($merchant->user)->photo_url,
                    ],
                ];

                // Add distance if calculated
                if (isset($merchant->distance_km)) {
                    $result['distance_km'] = round((float) $merchant->distance_km, 2);
                }

                return $result;
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
     * Affiche le profil public détaillé d'un commerçant.
     */
    public function show(int $merchantId): JsonResponse
    {
        try {
            $merchant = Merchant::with([
                'user',
                'products' => function ($query) {
                    $query->active()
                        ->orderByDesc('created_at')
                        ->take(4)
                        ->with(['category:id,name,icon']);
                },
                'reviews' => function ($query) {
                    $query->approved()
                        ->recent()
                        ->take(5)
                        ->with([
                            'user:id,first_name,last_name',
                            'product:id,name',
                        ]);
                },
            ])
                ->withCount([
                    'products as active_products_count' => function ($query) {
                        $query->active();
                    },
                    'reviews as approved_reviews_count' => function ($query) {
                        $query->approved();
                    },
                ])
                ->findOrFail($merchantId);

            $averageRating = Review::where('merchant_id', $merchant->id)
                ->approved()
                ->avg('rating');

            $featuredProducts = $merchant->products->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'discounted_price' => (float) $product->discounted_price,
                    'original_price' => (float) $product->original_price,
                    'quantity_available' => (int) $product->quantity_available,
                    'discount_percentage' => $product->discount_percentage,
                    'image_url' => $product->image_url,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'icon' => $product->category->icon,
                    ] : null,
                ];
            });

            $recentReviews = $merchant->reviews->map(function (Review $review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'comment' => $review->comment,
                    'is_verified_purchase' => $review->is_verified_purchase,
                    'created_at' => $review->created_at?->toISOString(),
                    'time_ago' => $review->time_ago,
                    'user' => $review->user ? [
                        'id' => $review->user->id,
                        'name' => trim($review->user->first_name.' '.substr($review->user->last_name, 0, 1).'.'),
                    ] : null,
                    'product' => $review->product ? [
                        'id' => $review->product->id,
                        'name' => $review->product->name,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'description' => $merchant->description,
                    'photo_url' => $merchant->photo_url,
                    'is_verified' => (bool) $merchant->is_verified,
                    'latitude' => $merchant->latitude ? (float) $merchant->latitude : null,
                    'longitude' => $merchant->longitude ? (float) $merchant->longitude : null,
                    'address' => optional($merchant->user)->address,
                    'city' => optional($merchant->user)->city,
                    'phone' => optional($merchant->user)->phone,
                    'opening_hours' => $this->formatOpeningHours($merchant->opening_hours),
                    'products_count' => (int) $merchant->active_products_count,
                    'rating' => $averageRating ? round((float) $averageRating, 1) : null,
                    'total_reviews' => (int) $merchant->approved_reviews_count,
                    'saved_weight' => $merchant->total_sales ? (float) $merchant->total_sales : null,
                    'featured_products' => $featuredProducts,
                    'recent_reviews' => $recentReviews,
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Commerçant introuvable',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du commerçant',
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
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
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
                    'errors' => $validator->errors(),
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
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la localisation',
                'error' => $e->getMessage(),
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
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'latitude' => $merchant->latitude,
                    'longitude' => $merchant->longitude,
                    'has_location' => ! is_null($merchant->latitude) && ! is_null($merchant->longitude),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la localisation',
                'error' => $e->getMessage(),
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
                    'errors' => $validator->errors(),
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
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $merchants,
                'search_params' => [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'radius_km' => $radiusKm,
                    'total_found' => $merchants->count(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche de commerçants',
                'error' => $e->getMessage(),
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
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $merchants,
                'total' => $merchants->count(),
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
     * Met à jour le profil du commerçant
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'business_name' => 'nullable|string|max:255',
                'business_type' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'siret' => 'nullable|string|max:14|unique:merchants,siret,'.$merchant->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
            ], [
                'business_name.max' => 'Le nom de l\'entreprise ne peut pas dépasser 255 caractères',
                'description.max' => 'La description ne peut pas dépasser 1000 caractères',
                'siret.unique' => 'Ce numéro SIRET est déjà utilisé',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Mise à jour du merchant
            $merchantData = [];
            if ($request->has('business_name')) {
                $merchantData['business_name'] = $request->business_name;
            }
            if ($request->has('business_type')) {
                $merchantData['business_type'] = $request->business_type;
            }
            if ($request->has('description')) {
                $merchantData['description'] = $request->description;
            }
            if ($request->has('siret')) {
                $merchantData['siret'] = $request->siret;
            }

            if (! empty($merchantData)) {
                $merchant->update($merchantData);
            }

            // Mise à jour de l'utilisateur
            $userData = [];
            if ($request->has('phone')) {
                $userData['phone'] = $request->phone;
            }
            if ($request->has('address')) {
                $userData['address'] = $request->address;
            }
            if ($request->has('city')) {
                $userData['city'] = $request->city;
            }

            if (! empty($userData)) {
                $user->update($userData);
            }

            // Recharger les relations
            $merchant->load('user');

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'data' => [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'description' => $merchant->description,
                    'siret' => $merchant->siret,
                    'photo_url' => $merchant->photo_url,
                    'phone' => $merchant->user->phone,
                    'address' => $merchant->user->address,
                    'city' => $merchant->user->city,
                    'user' => [
                        'id' => $merchant->user->id,
                        'role' => $merchant->user->role,
                        'email' => $merchant->user->email,
                        'first_name' => $merchant->user->first_name,
                        'last_name' => $merchant->user->last_name,
                        'prefers_email_notifications' => $merchant->user->prefers_email_notifications,
                        'prefers_sms_notifications' => $merchant->user->prefers_sms_notifications,
                        'prefers_push_notifications' => $merchant->user->prefers_push_notifications,
                        'created_at' => $merchant->user->created_at,
                        'updated_at' => $merchant->user->updated_at,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload la photo du commerçant
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $uploadedPath = null; // 🐛 BUG FIX #3: Track uploaded file for cleanup on error

        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
                ], 404);
            }

            // 🐛 EDGE CASE #1: Empty files already prevented by 'image' validation + getimagesize()
            // Validation
            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,jpg,png|max:1024', // 🔒 SECURITY: Max 1MB for merchants
            ], [
                'photo.required' => 'Aucune photo fournie',
                'photo.image' => 'Le fichier doit être une image',
                'photo.mimes' => 'Formats acceptés: jpeg, jpg, png',
                'photo.max' => 'La photo ne peut pas dépasser 1MB',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier invalide',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $photo = $request->file('photo');

            // 🔒 SECURITY: Verify actual MIME type (not just extension)
            $mimeType = $photo->getMimeType();

            // 🐛 BUG FIX #1: Guard contre null getMimeType()
            if (is_null($mimeType) || empty($mimeType)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de déterminer le type du fichier. Fichier corrompu ?',
                ], 422);
            }

            // 🐛 BUG FIX #17: Proper MIME type mapping (image/jpg is INVALID, only image/jpeg is correct)
            // Mapping MIME types → extensions (always use first extension for consistency)
            $allowedMimeTypes = [
                'image/jpeg' => ['jpg', 'jpeg'], // Standard JPEG (always use .jpg, not .jpeg)
                'image/png' => ['png'],
            ];

            if (! array_key_exists($mimeType, $allowedMimeTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG',
                    'error' => "MIME type '{$mimeType}' non supporté. Types valides : image/jpeg, image/png",
                ], 422);
            }

            // 🔒 SECURITY: Validate image dimensions (max 1000x1000px for merchant photos)
            $imageInfo = getimagesize($photo->getRealPath());
            if ($imageInfo === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de lire les dimensions de l\'image. Fichier corrompu ?',
                ], 422);
            }

            [$width, $height] = $imageInfo;
            if ($width > 1000 || $height > 1000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image trop grande. Dimensions maximales : 1000x1000px',
                    'error' => "Current dimensions: {$width}x{$height}px",
                ], 422);
            }

            // 🐛 BUG FIX #17: Use first extension from mapping for consistency (.jpg, not .jpeg)
            // 🔒 SECURITY: Extension determined by server-verified MIME type, not client input
            $extension = $allowedMimeTypes[$mimeType][0];
            $filename = \Illuminate\Support\Str::random(40).'.'.$extension;

            // 🔒 SECURITY: Delete old photo safely using Storage facade
            if ($merchant->photo_url) {
                $oldPath = str_replace('/storage/', '', $merchant->photo_url);

                // 🐛 BUG FIX #6: Validate path to prevent traversal attacks
                if (str_contains($oldPath, '..') || str_contains($oldPath, '//')) {
                    \Log::error('Path traversal attempt detected in merchant photo deletion', [
                        'merchant_id' => $merchant->id,
                        'suspicious_path' => $oldPath,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid file path detected',
                    ], 400);
                }

                // 🐛 BUG FIX #5: Verify deletion success
                // 🐛 BUG FIX #13: Standardize Storage facade usage
                if (! Storage::disk('public')->delete($oldPath)) {
                    \Log::warning('Failed to delete old merchant photo', [
                        'merchant_id' => $merchant->id,
                        'path' => $oldPath,
                        'exists' => Storage::disk('public')->exists($oldPath),
                    ]);
                }
            }

            // 🐛 BUG FIX #12: Wrapper upload + DB update dans transaction atomique
            // 🐛 BUG FIX #13: Standardize DB facade usage
            DB::beginTransaction();

            try {
                // 🔒 SECURITY: Use Storage facade for secure file handling
                $path = $photo->storeAs('merchants', $filename, 'public');
                $uploadedPath = $path; // Track uploaded path for cleanup
                $photoUrl = '/storage/'.$path;

                // Mettre à jour la base de données (dans transaction)
                $merchant->update(['photo_url' => $photoUrl]);

                // Commit transaction si tout réussit
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Photo uploadée avec succès',
                    'data' => [
                        'photo_url' => $photoUrl,
                        'full_url' => url($photoUrl),
                    ],
                ]);

            } catch (\Exception $dbException) {
                // Rollback transaction DB
                // 🐛 BUG FIX #13: Standardize DB facade usage
                DB::rollBack();

                // Cleanup fichier uploadé car DB update a échoué
                if ($uploadedPath && Storage::disk('public')->exists($uploadedPath)) {
                    Storage::disk('public')->delete($uploadedPath);
                    \Log::warning('Cleaned up orphan file after DB transaction failure', [
                        'path' => $uploadedPath,
                        'merchant_id' => $merchant->id,
                    ]);
                }

                // Re-throw pour être capturé par catch externe
                throw $dbException;
            }

        } catch (\Exception $e) {
            // 🐛 BUG FIX #12: Cleanup déjà géré par catch interne (transaction)
            // Pas de double cleanup ici pour éviter suppression erronée

            // 🐛 BUG FIX #4: Conditionner trace logs à environnement local
            \Log::error('MERCHANT PHOTO UPLOAD ERROR', [
                'merchant_id' => $merchant->id ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload de la photo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtient les heures d'ouverture du commerçant
     */
    public function getOpeningHours(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'opening_hours' => $merchant->opening_hours ?? [],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des heures d\'ouverture',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Met à jour les heures d'ouverture du commerçant
     */
    public function updateOpeningHours(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte commerçant requis.',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé.',
                ], 404);
            }

            // 🐛 EDGE CASE #2: Prevent empty arrays with min:1 (at least 1 day required)
            // Validation
            $validator = Validator::make($request->all(), [
                'opening_hours' => 'required|array|min:1',
                'opening_hours.*.day' => 'required|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'opening_hours.*.is_open' => 'required|boolean',
                // 🐛 BUG FIX: Add time format validation (HH:MM)
                // ⚠️ CRITICAL: Array syntax required for regex with | alternation (otherwise Laravel treats | as rule separator)
                'opening_hours.*.morning_start' => ['nullable', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
                'opening_hours.*.morning_end' => ['nullable', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
                'opening_hours.*.afternoon_start' => ['nullable', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
                'opening_hours.*.afternoon_end' => ['nullable', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
            ], [
                'opening_hours.required' => 'Les heures d\'ouverture sont requises',
                'opening_hours.array' => 'Les heures d\'ouverture doivent être au format tableau',
                'opening_hours.min' => 'Au moins un jour doit être défini',
                'opening_hours.*.morning_start.regex' => 'L\'heure de début du matin doit être au format HH:MM (ex: 08:00)',
                'opening_hours.*.morning_end.regex' => 'L\'heure de fin du matin doit être au format HH:MM (ex: 12:00)',
                'opening_hours.*.afternoon_start.regex' => 'L\'heure de début d\'après-midi doit être au format HH:MM (ex: 14:00)',
                'opening_hours.*.afternoon_end.regex' => 'L\'heure de fin d\'après-midi doit être au format HH:MM (ex: 18:00)',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 🐛 BUG FIX: Validate time logic (end > start)
            $openingHours = $request->opening_hours;

            // 🐛 BUG FIX #9: Validate no duplicate days
            $days = array_column($openingHours, 'day');
            if (count($days) !== count(array_unique($days))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => ['opening_hours' => ['Chaque jour ne peut apparaître qu\'une seule fois']],
                ], 422);
            }

            foreach ($openingHours as $index => $hours) {
                if ($hours['is_open']) {
                    // Morning validation
                    if (! empty($hours['morning_start']) && ! empty($hours['morning_end'])) {
                        if ($hours['morning_start'] >= $hours['morning_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.morning_end" => ["L'heure de fin doit être après l'heure de début"],
                                ],
                            ], 422);
                        }
                    }

                    // Afternoon validation
                    if (! empty($hours['afternoon_start']) && ! empty($hours['afternoon_end'])) {
                        if ($hours['afternoon_start'] >= $hours['afternoon_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.afternoon_end" => ["L'heure de fin doit être après l'heure de début"],
                                ],
                            ], 422);
                        }
                    }

                    // 🐛 BUG FIX #8: Allow continuous opening (changed <= to <)
                    // Validate afternoon starts after morning ends
                    if (! empty($hours['morning_end']) && ! empty($hours['afternoon_start'])) {
                        if ($hours['afternoon_start'] < $hours['morning_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.afternoon_start" => ["L'heure de début d'après-midi doit être après la fin du matin"],
                                ],
                            ], 422);
                        }
                    }
                }
            }

            // Mettre à jour les heures d'ouverture
            $merchant->update([
                'opening_hours' => $openingHours,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Heures d\'ouverture mises à jour avec succès',
                'data' => [
                    'opening_hours' => $merchant->opening_hours,
                ],
            ]);

        } catch (\Exception $e) {
            // 🐛 BUG FIX #4: Conditionner trace logs à environnement local
            \Log::error('MERCHANT OPENING HOURS UPDATE ERROR', [
                'merchant_id' => $merchant->id ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour des heures d\'ouverture',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function formatOpeningHours($openingHours): array
    {
        if (empty($openingHours)) {
            return [];
        }

        if (is_array($openingHours)) {
            $formatted = [];

            foreach ($openingHours as $key => $value) {
                $dayKey = is_array($value) ? ($value['day'] ?? $key) : $key;
                $dayLabel = $this->formatDayLabel(is_string($dayKey) ? $dayKey : (string) $dayKey);

                if (is_array($value)) {
                    if (($value['is_open'] ?? true) === false) {
                        $hours = 'Fermé';
                    } else {
                        $segments = [];

                        if (! empty($value['morning_start']) && ! empty($value['morning_end'])) {
                            $segments[] = $value['morning_start'].' - '.$value['morning_end'];
                        }

                        if (! empty($value['afternoon_start']) && ! empty($value['afternoon_end'])) {
                            $segments[] = $value['afternoon_start'].' - '.$value['afternoon_end'];
                        }

                        $hours = $value['hours'] ?? ($segments ? implode(' / ', $segments) : 'Horaires non renseignés');
                    }
                } else {
                    $hours = is_string($value) ? $value : 'Horaires non renseignés';
                }

                $formatted[] = [
                    'day' => $dayLabel,
                    'hours' => $hours ?: 'Horaires non renseignés',
                ];
            }

            return $formatted;
        }

        if (is_string($openingHours)) {
            return collect(explode("\n", $openingHours))
                ->map(function ($line, $index) {
                    $line = trim($line);
                    if ($line === '') {
                        return null;
                    }

                    return [
                        'day' => 'Jour '.($index + 1),
                        'hours' => $line,
                    ];
                })
                ->filter()
                ->values()
                ->toArray();
        }

        return [];
    }

    private function formatDayLabel(string $day): string
    {
        $daysMap = [
            'monday' => 'Lundi',
            'tuesday' => 'Mardi',
            'wednesday' => 'Mercredi',
            'thursday' => 'Jeudi',
            'friday' => 'Vendredi',
            'saturday' => 'Samedi',
            'sunday' => 'Dimanche',
        ];

        $normalized = strtolower(trim($day));

        return $daysMap[$normalized] ?? ucfirst($day);
    }
}
