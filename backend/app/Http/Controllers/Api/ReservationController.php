<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
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

            return ReservationResource::collection($reservations);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            // Transaction pour assurer la cohérence des données
            return DB::transaction(function () use ($request, $user) {
                $product = Product::lockForUpdate()->findOrFail($request->product_id);

                // Calculer le montant total
                $totalAmount = $product->discounted_price * $request->quantity;

                // Créer la réservation
                $reservation = Reservation::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'quantity_reserved' => $request->quantity,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'notes' => $request->notes,
                    'reserved_at' => now(),
                    'expires_at' => now()->addHours(24),
                ]);

                // Décrémenter le stock
                $product->decrement('quantity_available', $request->quantity);

                $reservation->load(['product.category', 'product.merchant.user']);

                return response()->json([
                    'success' => true,
                    'message' => 'Réservation créée avec succès',
                    'data' => new ReservationResource($reservation)
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

            return response()->json([
                'success' => true,
                'data' => new ReservationResource($reservation)
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

            return ReservationResource::collection($reservations);

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

    public function markReady($id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les commerçants peuvent marquer les réservations comme prêtes'
                ], 403);
            }

            $reservation = Reservation::with(['product.merchant'])
                ->findOrFail($id);

            if ($reservation->product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez gérer que vos propres réservations'
                ], 403);
            }

            if ($reservation->status !== 'confirmed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation n\'est pas confirmée'
                ], 400);
            }

            $reservation->update(['status' => 'ready']);

            return response()->json([
                'success' => true,
                'message' => 'Réservation marquée comme prête pour le retrait'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            // Statistiques de base
            $stats = [
                'total_reservations' => Reservation::where('user_id', $user->id)->count(),
                'pending_reservations' => Reservation::where('user_id', $user->id)->where('status', 'pending')->count(),
                'confirmed_reservations' => Reservation::where('user_id', $user->id)->where('status', 'confirmed')->count(),
                'completed_reservations' => Reservation::where('user_id', $user->id)->where('status', 'completed')->count(),
                'cancelled_reservations' => Reservation::where('user_id', $user->id)->where('status', 'cancelled')->count(),
            ];

            // Impact environnemental (réservations terminées uniquement)
            $completedReservations = Reservation::with('product')
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->get();

            $totalSavings = 0;
            $totalFoodSaved = 0;

            foreach ($completedReservations as $reservation) {
                $savings = ($reservation->product->original_price - $reservation->product->discounted_price) * $reservation->quantity_reserved;
                $totalSavings += $savings;
                $totalFoodSaved += $reservation->quantity_reserved;
            }

            $stats['environmental_impact'] = [
                'total_money_saved' => round($totalSavings, 2),
                'total_food_saved_kg' => $totalFoodSaved,
                'total_co2_saved_kg' => round($totalFoodSaved * 2.5, 1), // 2.5kg CO2 par kg de nourriture
            ];

            // Statistiques mensuelles
            $thisMonth = Reservation::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);

            $stats['this_month'] = [
                'total_reservations' => $thisMonth->count(),
                'completed_reservations' => $thisMonth->where('status', 'completed')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
