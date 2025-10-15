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

            // Validation
            $validator = Validator::make($request->all(), [
                'business_name' => 'nullable|string|max:255',
                'business_type' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'siret' => 'nullable|string|max:14|unique:merchants,siret,' . $merchant->id,
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
                    'errors' => $validator->errors()
                ], 422);
            }

            // Mise à jour du merchant
            $merchantData = [];
            if ($request->filled('business_name')) {
                $merchantData['business_name'] = $request->business_name;
            }
            if ($request->filled('business_type')) {
                $merchantData['business_type'] = $request->business_type;
            }
            if ($request->filled('description')) {
                $merchantData['description'] = $request->description;
            }
            if ($request->filled('siret')) {
                $merchantData['siret'] = $request->siret;
            }

            if (!empty($merchantData)) {
                $merchant->update($merchantData);
            }

            // Mise à jour de l'utilisateur
            $userData = [];
            if ($request->filled('phone')) {
                $userData['phone'] = $request->phone;
            }
            if ($request->filled('address')) {
                $userData['address'] = $request->address;
            }
            if ($request->filled('city')) {
                $userData['city'] = $request->city;
            }

            if (!empty($userData)) {
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
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload la photo du commerçant
     */
    public function uploadPhoto(Request $request): JsonResponse
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

            // Validation
            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,jpg,png|max:5120', // 5MB max, removed GIF for security
            ], [
                'photo.required' => 'Aucune photo fournie',
                'photo.image' => 'Le fichier doit être une image',
                'photo.mimes' => 'Formats acceptés: jpeg, jpg, png',
                'photo.max' => 'La photo ne peut pas dépasser 5MB',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier invalide',
                    'errors' => $validator->errors()
                ], 422);
            }

            $photo = $request->file('photo');

            // 🔒 SECURITY: Verify actual MIME type (not just extension)
            $mimeType = $photo->getMimeType();
            $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!in_array($mimeType, $allowedMimes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de fichier invalide',
                ], 422);
            }

            // 🔒 SECURITY: Use secure random filename with real extension
            $extension = $photo->extension(); // Uses real MIME type, not client-provided
            $filename = \Illuminate\Support\Str::random(40) . '.' . $extension;

            // 🔒 SECURITY: Delete old photo safely using Storage facade
            if ($merchant->photo_url) {
                $oldPath = str_replace('/storage/', '', $merchant->photo_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }

            // 🔒 SECURITY: Use Storage facade for secure file handling
            $path = $photo->storeAs('merchants', $filename, 'public');
            $photoUrl = '/storage/' . $path;

            // Mettre à jour la base de données
            $merchant->update(['photo_url' => $photoUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploadée avec succès',
                'data' => [
                    'photo_url' => $photoUrl,
                    'full_url' => url($photoUrl),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload de la photo',
                'error' => $e->getMessage()
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
                    'opening_hours' => $merchant->opening_hours ?? [],
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des heures d\'ouverture',
                'error' => $e->getMessage()
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

            // Validation
            $validator = Validator::make($request->all(), [
                'opening_hours' => 'required|array',
                'opening_hours.*.day' => 'required|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'opening_hours.*.is_open' => 'required|boolean',
                // 🐛 BUG FIX: Add time format validation (HH:MM)
                'opening_hours.*.morning_start' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
                'opening_hours.*.morning_end' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
                'opening_hours.*.afternoon_start' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
                'opening_hours.*.afternoon_end' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
            ], [
                'opening_hours.required' => 'Les heures d\'ouverture sont requises',
                'opening_hours.array' => 'Les heures d\'ouverture doivent être au format tableau',
                'opening_hours.*.morning_start.regex' => 'L\'heure de début du matin doit être au format HH:MM (ex: 08:00)',
                'opening_hours.*.morning_end.regex' => 'L\'heure de fin du matin doit être au format HH:MM (ex: 12:00)',
                'opening_hours.*.afternoon_start.regex' => 'L\'heure de début d\'après-midi doit être au format HH:MM (ex: 14:00)',
                'opening_hours.*.afternoon_end.regex' => 'L\'heure de fin d\'après-midi doit être au format HH:MM (ex: 18:00)',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 🐛 BUG FIX: Validate time logic (end > start)
            $openingHours = $request->opening_hours;
            foreach ($openingHours as $index => $hours) {
                if ($hours['is_open']) {
                    // Morning validation
                    if (!empty($hours['morning_start']) && !empty($hours['morning_end'])) {
                        if ($hours['morning_start'] >= $hours['morning_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.morning_end" => ["L'heure de fin doit être après l'heure de début"]
                                ]
                            ], 422);
                        }
                    }

                    // Afternoon validation
                    if (!empty($hours['afternoon_start']) && !empty($hours['afternoon_end'])) {
                        if ($hours['afternoon_start'] >= $hours['afternoon_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.afternoon_end" => ["L'heure de fin doit être après l'heure de début"]
                                ]
                            ], 422);
                        }
                    }

                    // Validate afternoon starts after morning ends
                    if (!empty($hours['morning_end']) && !empty($hours['afternoon_start'])) {
                        if ($hours['afternoon_start'] <= $hours['morning_end']) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Erreur de validation',
                                'errors' => [
                                    "opening_hours.{$index}.afternoon_start" => ["L'heure de début d'après-midi doit être après la fin du matin"]
                                ]
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
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour des heures d\'ouverture',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}