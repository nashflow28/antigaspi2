<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ReservationResource;
use App\Models\Product;
use App\Models\Reservation;
use App\Notifications\ReservationStatusNotification;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReservationController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $query = Reservation::with(['product.category', 'product.merchant.user'])
                ->where('user_id', $user->id);

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

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = min($request->get('per_page', 15), 50);
            $reservations = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => ReservationResource::collection($reservations->items()),
                'meta' => [
                    'current_page' => $reservations->currentPage(),
                    'last_page' => $reservations->lastPage(),
                    'per_page' => $reservations->perPage(),
                    'total' => $reservations->total()
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

    public function store(StoreReservationRequest $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            return DB::transaction(function () use ($request, $user) {
                $product = Product::lockForUpdate()->findOrFail($request->product_id);

                $totalAmount = $product->discounted_price * $request->quantity;

                $reservation = Reservation::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'quantity_reserved' => $request->quantity,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'notes' => $request->notes,
                ]);

                $product->decrement('quantity_available', $request->quantity);

                // Ne créer un payment que si la table payments existe et que ce n'est pas un paiement sur place
                $payment = null;
                $paymentMethod = PaymentMethod::from($request->input('payment_method'));
                if ($paymentMethod !== PaymentMethod::ON_SITE) {
                    try {
                        $payment = $this->payments->initializePayment($reservation, $paymentMethod, [
                            'customer_phone' => $request->input('customer_phone'),
                            'customer_email' => $request->input('customer_email'),
                            'currency' => $request->input('currency', config('payments.currency', 'XOF')),
                            'notes' => $request->input('notes'),
                            'wallet_pin' => $request->input('wallet_pin'),
                        ]);
                    } catch (\Exception $e) {
                        // Continuer sans payment si la table n'existe pas
                        \Log::warning('Payment initialization failed: ' . $e->getMessage());
                    }
                }

                $reservation->load(['product.category', 'product.merchant.user']);
                $reservation->setRelation('user', $user);

                $user->notify(new ReservationStatusNotification($reservation));

                $response = [
                    'success' => true,
                    'message' => 'Réservation créée avec succès',
                    'data' => new ReservationResource($reservation),
                ];

                if ($payment) {
                    $response['payment'] = new PaymentResource($payment);
                }

                return response()->json($response, 201);
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
                    $reservation->refresh()->load('user');
                    $reservation->user->notify(new ReservationStatusNotification($reservation));

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
                ->whereHas('product', function ($q) use ($user) {
                    $q->where('merchant_id', $user->merchant->id);
                });

            if ($request->has('status')) {
                $query->whereIn('status', explode(',', $request->status));
            }

            $reservations = $query->paginate(min($request->get('per_page', 15), 50));

            return response()->json([
                'success' => true,
                'data' => ReservationResource::collection($reservations->items()),
                'meta' => [
                    'current_page' => $reservations->currentPage(),
                    'last_page' => $reservations->lastPage(),
                    'per_page' => $reservations->perPage(),
                    'total' => $reservations->total(),
                ],
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
                $reservation->refresh()->load('user');
                $reservation->user->notify(new ReservationStatusNotification($reservation));

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
            $reservation->refresh()->load('user');
            $reservation->user->notify(new ReservationStatusNotification($reservation));

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
                $reservation->markPaymentStatus(PaymentStatus::SUCCESS);
                $reservation->product->merchant->increment('total_sales', $reservation->total_amount);

                $reservation->refresh()->load('user');
                $reservation->user->notify(new ReservationStatusNotification($reservation));

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

    public function statistics(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $stats = [
                'total_reservations' => Reservation::where('user_id', $user->id)->count(),
                'pending_reservations' => Reservation::where('user_id', $user->id)->where('status', 'pending')->count(),
                'confirmed_reservations' => Reservation::where('user_id', $user->id)->where('status', 'confirmed')->count(),
                'completed_reservations' => Reservation::where('user_id', $user->id)->where('status', 'completed')->count(),
                'cancelled_reservations' => Reservation::where('user_id', $user->id)->where('status', 'cancelled')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
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
