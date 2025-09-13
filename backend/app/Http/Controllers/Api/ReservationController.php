<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReservationController extends Controller
{
    public function __construct()
    {
        // Middleware is handled in routes, not controller for Laravel 11
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $query = Reservation::with(['product.category', 'product.merchant.user'])
                ->where('user_id', $user->id);

            // Filtres
            if ($request->has('status')) {
                $statuses = explode(',', $request->status);
                $query->whereIn('status', $statuses);
            }

            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 15), 50);
            $reservations = $query->paginate($perPage);

            // Formater les données
            $reservations->getCollection()->transform(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'reservation_code' => $reservation->reservation_code,
                    'quantity_reserved' => $reservation->quantity_reserved,
                    'total_amount' => $reservation->total_amount,
                    'status' => $reservation->status,
                    'expires_at' => $reservation->expires_at,
                    'time_until_expiration' => $reservation->time_until_expiration,
                    'is_expired' => $reservation->isExpired(),
                    'can_be_cancelled' => $reservation->canBeCancelled(),
                    'notes' => $reservation->notes,
                    'product' => [
                        'id' => $reservation->product->id,
                        'name' => $reservation->product->name,
                        'discounted_price' => $reservation->product->discounted_price,
                        'expiration_date' => $reservation->product->expiration_date,
                        'image_url' => $reservation->product->image_url,
                        'category' => $reservation->product->category->name,
                    ],
                    'merchant' => [
                        'business_name' => $reservation->product->merchant->business_name,
                        'city' => $reservation->product->merchant->user->city,
                        'address' => $reservation->product->merchant->user->address,
                        'phone' => $reservation->product->merchant->user->phone,
                    ],
                    'created_at' => $reservation->created_at,
                    'confirmed_at' => $reservation->confirmed_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $reservations->items(),
                'pagination' => [
                    'current_page' => $reservations->currentPage(),
                    'last_page' => $reservations->lastPage(),
                    'per_page' => $reservations->perPage(),
                    'total' => $reservations->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isConsumer()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les consommateurs peuvent faire des réservations'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'product_id' => 'required|exists:products,id',
                'quantity_reserved' => 'required|integer|min:1',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Transaction pour assurer la cohérence des données
            return DB::transaction(function () use ($request, $user) {
                $product = Product::lockForUpdate()->findOrFail($request->product_id);

                // Vérifications
                if (!$product->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ce produit n\'est plus disponible'
                    ], 400);
                }

                if ($product->isExpired()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ce produit est expiré'
                    ], 400);
                }

                if ($product->quantity_available < $request->quantity_reserved) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock insuffisant. Quantité disponible: ' . $product->quantity_available
                    ], 400);
                }

                // Vérifier si l'utilisateur a déjà une réservation active pour ce produit
                $existingReservation = Reservation::where('user_id', $user->id)
                    ->where('product_id', $product->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->exists();

                if ($existingReservation) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous avez déjà une réservation active pour ce produit'
                    ], 400);
                }

                // Calculer le montant total
                $totalAmount = $product->discounted_price * $request->quantity_reserved;

                // Créer la réservation
                $reservation = Reservation::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'quantity_reserved' => $request->quantity_reserved,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'notes' => $request->notes,
                    'expires_at' => now()->addHours(24), // 24h pour récupérer
                ]);

                // Décrémenter le stock
                $product->decrement('quantity_available', $request->quantity_reserved);

                $reservation->load(['product.category', 'product.merchant.user']);

                return response()->json([
                    'success' => true,
                    'message' => 'Réservation créée avec succès',
                    'data' => [
                        'id' => $reservation->id,
                        'reservation_code' => $reservation->reservation_code,
                        'quantity_reserved' => $reservation->quantity_reserved,
                        'total_amount' => $reservation->total_amount,
                        'status' => $reservation->status,
                        'expires_at' => $reservation->expires_at,
                        'product_name' => $reservation->product->name,
                        'merchant_name' => $reservation->product->merchant->business_name,
                        'merchant_phone' => $reservation->product->merchant->user->phone,
                    ]
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la réservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $reservation = Reservation::with(['product.category', 'product.merchant.user'])
                ->where('user_id', $user->id)
                ->findOrFail($id);

            $reservationData = [
                'id' => $reservation->id,
                'reservation_code' => $reservation->reservation_code,
                'quantity_reserved' => $reservation->quantity_reserved,
                'total_amount' => $reservation->total_amount,
                'status' => $reservation->status,
                'expires_at' => $reservation->expires_at,
                'time_until_expiration' => $reservation->time_until_expiration,
                'is_expired' => $reservation->isExpired(),
                'can_be_cancelled' => $reservation->canBeCancelled(),
                'notes' => $reservation->notes,
                'product' => [
                    'id' => $reservation->product->id,
                    'name' => $reservation->product->name,
                    'description' => $reservation->product->description,
                    'original_price' => $reservation->product->original_price,
                    'discounted_price' => $reservation->product->discounted_price,
                    'expiration_date' => $reservation->product->expiration_date,
                    'image_url' => $reservation->product->image_url,
                    'category' => [
                        'id' => $reservation->product->category->id,
                        'name' => $reservation->product->category->name,
                        'icon' => $reservation->product->category->icon,
                    ],
                ],
                'merchant' => [
                    'id' => $reservation->product->merchant->id,
                    'business_name' => $reservation->product->merchant->business_name,
                    'business_type' => $reservation->product->merchant->business_type,
                    'city' => $reservation->product->merchant->user->city,
                    'address' => $reservation->product->merchant->user->address,
                    'phone' => $reservation->product->merchant->user->phone,
                ],
                'created_at' => $reservation->created_at,
                'confirmed_at' => $reservation->confirmed_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $reservationData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Réservation non trouvée',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            return DB::transaction(function () use ($id, $user) {
                $reservation = Reservation::lockForUpdate()
                    ->where('user_id', $user->id)
                    ->findOrFail($id);

                if (!$reservation->canBeCancelled()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cette réservation ne peut plus être annulée'
                    ], 400);
                }

                if ($reservation->cancel()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Réservation annulée avec succès'
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'annulation de la réservation'
                ], 500);
            });

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function merchantReservations(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants'
                ], 403);
            }

            $query = Reservation::with(['user', 'product.category'])
                ->byMerchant($user->merchant->id);

            // Filtres
            if ($request->has('status')) {
                $statuses = explode(',', $request->status);
                $query->whereIn('status', $statuses);
            }

            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 15), 50);
            $reservations = $query->paginate($perPage);

            // Formater les données
            $reservations->getCollection()->transform(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'reservation_code' => $reservation->reservation_code,
                    'quantity_reserved' => $reservation->quantity_reserved,
                    'total_amount' => $reservation->total_amount,
                    'status' => $reservation->status,
                    'expires_at' => $reservation->expires_at,
                    'is_expired' => $reservation->isExpired(),
                    'notes' => $reservation->notes,
                    'customer' => [
                        'name' => $reservation->user->full_name,
                        'phone' => $reservation->user->phone,
                        'city' => $reservation->user->city,
                    ],
                    'product' => [
                        'id' => $reservation->product->id,
                        'name' => $reservation->product->name,
                        'category' => $reservation->product->category->name,
                    ],
                    'created_at' => $reservation->created_at,
                    'confirmed_at' => $reservation->confirmed_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $reservations->items(),
                'pagination' => [
                    'current_page' => $reservations->currentPage(),
                    'last_page' => $reservations->lastPage(),
                    'per_page' => $reservations->perPage(),
                    'total' => $reservations->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirm($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent confirmer les réservations'
                ], 403);
            }

            $reservation = Reservation::with(['product.merchant'])
                ->findOrFail($id);

            if ($reservation->product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez confirmer que vos propres réservations'
                ], 403);
            }

            if ($reservation->confirm()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Réservation confirmée avec succès'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être confirmée'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function complete($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent marquer les réservations comme terminées'
                ], 403);
            }

            $reservation = Reservation::with(['product.merchant'])
                ->findOrFail($id);

            if ($reservation->product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez finaliser que vos propres réservations'
                ], 403);
            }

            if ($reservation->complete()) {
                // Mettre à jour les ventes du commerçant
                $reservation->product->merchant->increment('total_sales', $reservation->total_amount);

                return response()->json([
                    'success' => true,
                    'message' => 'Réservation finalisée avec succès'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être finalisée'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la finalisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
