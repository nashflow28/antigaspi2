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
use App\Services\ReservationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservations)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            \Log::info('Fetching reservations for user', [
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);

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

            // 🐛 BUG FIX #15: Whitelist sort parameters to prevent SQL injection
            $allowedSortFields = ['created_at', 'pickup_date', 'total_amount', 'status'];
            $sortBy = in_array($request->get('sort_by'), $allowedSortFields, true)
                ? $request->get('sort_by')
                : 'created_at';

            $sortOrder = in_array(strtolower($request->get('sort_order', 'desc')), ['asc', 'desc'], true)
                ? strtolower($request->get('sort_order', 'desc'))
                : 'desc';

            $query->orderBy($sortBy, $sortOrder);

            // 🐛 BUG FIX #16: Add minimum limit to pagination to prevent per_page=0
            $perPage = max(1, min($request->get('per_page', 15), 50));
            $reservations = $query->paginate($perPage);

            \Log::info('Reservations found', [
                'count' => $reservations->total(),
                'current_page' => $reservations->currentPage(),
                'items' => collect($reservations->items())->pluck('id', 'reservation_code')->toArray()
            ]);

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
                $paymentMethod = PaymentMethod::from($request->input('payment_method'));

                $pickupDate = $request->input('pickup_date') ?? Carbon::now()->toDateString();
                $pickupTime = $request->input('pickup_time') ?? Carbon::now()->addHour()->format('H:i');

                [$reservation, $payment] = $this->reservations->createReservation(
                    $user,
                    $product,
                    $request->quantity,
                    $paymentMethod,
                    [
                        'notes' => $request->notes,
                        'pickup_date' => $pickupDate,
                        'pickup_time' => $pickupTime,
                        'customer_phone' => $request->input('customer_phone'),
                        'customer_email' => $request->input('customer_email'),
                        'currency' => $request->input('currency', config('payments.currency', 'XOF')),
                        'wallet_pin' => $request->input('wallet_pin'),
                    ]
                );

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
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Reservation creation error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            $response = [
                'success' => false,
                'message' => 'Erreur lors de la création de la réservation',
            ];

            // Only expose debug info in development environment
            if (config('app.debug')) {
                $response['error'] = $e->getMessage();
                $response['debug'] = [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ];
            }

            return response()->json($response, 500);
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
                    $reservation->refresh()->load(['product.category', 'product.merchant.user', 'user']);

                    // Notification non-bloquante
                    try {
                        $reservation->user->notify(new ReservationStatusNotification($reservation));
                    } catch (\Exception $e) {
                        \Log::warning('Notification failed but cancellation succeeded', [
                            'reservation_id' => $reservation->id,
                            'error' => $e->getMessage()
                        ]);
                    }

                    return response()->json([
                        'success' => true,
                        'message' => 'Réservation annulée avec succès',
                        'data' => new ReservationResource($reservation),
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

            // 🐛 BUG FIX: Verify merchant exists before accessing
            if (!$user->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant introuvable'
                ], 404);
            }

            $query = Reservation::with(['user', 'product.category'])
                ->whereHas('product', function ($q) use ($user) {
                    $q->where('merchant_id', $user->merchant->id);
                });

            if ($request->has('status')) {
                $query->whereIn('status', explode(',', $request->status));
            }

            // 🐛 BUG FIX: Add max(1, ...) to prevent per_page=0 crash
            $perPage = max(1, min($request->get('per_page', 15), 50));
            $reservations = $query->paginate($perPage);

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

            // 🐛 BUG FIX #5: Check product and merchant exist before accessing
            if (!$reservation->product || !$reservation->product->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit ou commerçant associé introuvable'
                ], 404);
            }

            // 🔒 SECURITY FIX: Verify merchant ownership
            if ($reservation->product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez confirmer que vos propres réservations'
                ], 403);
            }

            if ($reservation->confirm()) {
                $reservation->refresh()->load(['product.category', 'product.merchant.user', 'user']);

                // Notification non-bloquante
                try {
                    $reservation->user->notify(new ReservationStatusNotification($reservation));
                } catch (\Exception $e) {
                    \Log::warning('Notification failed but confirmation succeeded', [
                        'reservation_id' => $reservation->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Réservation confirmée avec succès',
                    'data' => new ReservationResource($reservation),
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

            // 🐛 BUG FIX #5: Check product and merchant exist before accessing
            if (!$reservation->product || !$reservation->product->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit ou commerçant associé introuvable'
                ], 404);
            }

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
            $reservation->refresh()->load(['product.category', 'product.merchant.user', 'user']);

            // Notification non-bloquante
            try {
                $reservation->user->notify(new ReservationStatusNotification($reservation));
            } catch (\Exception $e) {
                \Log::warning('Notification failed but ready status set', [
                    'reservation_id' => $reservation->id,
                    'error' => $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Réservation marquée comme prête pour le retrait',
                'data' => new ReservationResource($reservation),
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

            // 🐛 BUG FIX #5: Check product and merchant exist before accessing
            if (!$reservation->product || !$reservation->product->merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit ou commerçant associé introuvable'
                ], 404);
            }

            if ($reservation->product->merchant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez finaliser que vos propres réservations'
                ], 403);
            }

            if ($reservation->complete()) {
                $reservation->markPaymentStatus(PaymentStatus::SUCCESS);
                $reservation->product->merchant->increment('total_sales', $reservation->total_amount);

                $reservation->refresh()->load(['product.category', 'product.merchant.user', 'user']);

                // Notification non-bloquante
                try {
                    $reservation->user->notify(new ReservationStatusNotification($reservation));
                } catch (\Exception $e) {
                    \Log::warning('Notification failed but completion succeeded', [
                        'reservation_id' => $reservation->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Réservation finalisée avec succès',
                    'data' => new ReservationResource($reservation),
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

    /**
     * Modifier la quantité d'une réservation (uniquement si status = pending)
     */
    public function updateQuantity(Request $request, $id): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $request->validate([
                'quantity' => 'required|integer|min:1|max:100',
            ], [
                'quantity.required' => 'La quantité est requise',
                'quantity.integer' => 'La quantité doit être un nombre entier',
                'quantity.min' => 'La quantité minimum est 1',
                'quantity.max' => 'La quantité maximum est 100',
            ]);

            return DB::transaction(function () use ($request, $id, $user) {
                $reservation = Reservation::lockForUpdate()
                    ->with(['product'])
                    ->where('user_id', $user->id)
                    ->findOrFail($id);

                // 🔒 BUSINESS RULE: Only pending reservations can be modified
                if ($reservation->status !== 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Seules les réservations en attente peuvent être modifiées',
                        'error' => 'La réservation a le statut: ' . $reservation->status
                    ], 400);
                }

                $newQuantity = $request->quantity;
                $oldQuantity = $reservation->quantity;
                $quantityDiff = $newQuantity - $oldQuantity;

                // Check stock availability if increasing quantity
                if ($quantityDiff > 0) {
                    $product = $reservation->product;
                    if ($product->quantity_available < $quantityDiff) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Stock insuffisant',
                            'error' => "Seulement {$product->quantity_available} unités disponibles"
                        ], 400);
                    }
                    // Decrease available stock
                    $product->decrement('quantity_available', $quantityDiff);
                } elseif ($quantityDiff < 0) {
                    // Restore stock when decreasing quantity
                    $reservation->product->increment('quantity_available', abs($quantityDiff));
                }

                // Update reservation
                $unitPrice = $reservation->total_amount / $oldQuantity;
                $reservation->update([
                    'quantity' => $newQuantity,
                    'total_amount' => $unitPrice * $newQuantity,
                ]);

                $reservation->refresh()->load(['product.category', 'product.merchant.user']);

                return response()->json([
                    'success' => true,
                    'message' => 'Quantité mise à jour avec succès',
                    'data' => new ReservationResource($reservation),
                ]);
            });
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de la quantité',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            // 🐛 PERFORMANCE FIX: Use single query instead of 5 separate queries
            $statusCounts = Reservation::where('user_id', $user->id)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status');

            $stats = [
                'total_reservations' => $statusCounts->sum(),
                'pending_reservations' => $statusCounts->get('pending', 0),
                'confirmed_reservations' => $statusCounts->get('confirmed', 0),
                'completed_reservations' => $statusCounts->get('completed', 0),
                'cancelled_reservations' => $statusCounts->get('cancelled', 0),
                'ready_reservations' => $statusCounts->get('ready', 0),
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
