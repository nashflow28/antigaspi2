<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    /**
     * Retourne la liste des paiements du commerçant connecté avec filtres et export.
     */
    public function index(Request $request): JsonResponse|StreamedResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user->isMerchant() && ! $user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les commerçants peuvent consulter ce module de paiements.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(PaymentStatus::values())],
            'method' => ['nullable', Rule::in(PaymentMethod::values())],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'min_amount' => ['nullable', 'numeric'],
            'max_amount' => ['nullable', 'numeric'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'export' => ['nullable', Rule::in(['csv'])],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);
        $perPage = max(5, min(100, $perPage));
        $page = (int) ($validated['page'] ?? 1);

        $paymentsQuery = Payment::query()
            ->with([
                'reservation' => function ($query) {
                    $query->select([
                        'id',
                        'reservation_code',
                        'status',
                        'payment_status',
                        'total_amount',
                        'pickup_date',
                        'user_id',
                        'product_id',
                        'created_at',
                    ]);
                },
                'reservation.product:id,name,merchant_id',
                'reservation.user:id,first_name,last_name,name,email,phone',
            ]);

        if ($user->isMerchant()) {
            $merchant = $user->merchant;

            if (! $merchant) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0,
                    ],
                    'meta' => [
                        'summary' => null,
                        'applied_filters' => [],
                    ],
                ]);
            }

            $paymentsQuery->whereHas('reservation.product', function ($productQuery) use ($merchant) {
                $productQuery->where('merchant_id', $merchant->id);
            });
        }

        if (! empty($validated['status'])) {
            $paymentsQuery->where('status', $validated['status']);
        }

        if (! empty($validated['method'])) {
            $paymentsQuery->where('payment_method', $validated['method']);
        }

        if (! empty($validated['date_from'])) {
            $paymentsQuery->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $paymentsQuery->whereDate('created_at', '<=', $validated['date_to']);
        }

        if (isset($validated['min_amount'])) {
            $paymentsQuery->where('amount', '>=', $validated['min_amount']);
        }

        if (isset($validated['max_amount'])) {
            $paymentsQuery->where('amount', '<=', $validated['max_amount']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];

            $paymentsQuery->where(function ($query) use ($search) {
                $query
                    ->where('reference', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('reservation', function ($reservationQuery) use ($search) {
                        $reservationQuery->where('reservation_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('reservation.user', function ($userQuery) use ($search) {
                        $userQuery->where(function ($nested) use ($search) {
                            $nested
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                    });
            });
        }

        $statusBreakdownCollection = (clone $paymentsQuery)
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('status')
            ->get();

        $statusBreakdown = $statusBreakdownCollection
            ->mapWithKeys(function ($row) {
                return [
                    $row->status => [
                        'count' => (int) $row->count,
                        'total_amount' => $row->total_amount !== null ? (float) $row->total_amount : 0.0,
                    ],
                ];
            })
            ->toArray();

        $methodBreakdownCollection = (clone $paymentsQuery)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('payment_method')
            ->get();

        $methodBreakdown = $methodBreakdownCollection
            ->mapWithKeys(function ($row) {
                return [
                    $row->payment_method => [
                        'count' => (int) $row->count,
                        'total_amount' => $row->total_amount !== null ? (float) $row->total_amount : 0.0,
                    ],
                ];
            })
            ->toArray();

        $summaryTotalAmount = array_reduce($statusBreakdown, function ($carry, $item) {
            return $carry + ($item['total_amount'] ?? 0.0);
        }, 0.0);

        $summaryTotalCount = array_reduce($statusBreakdown, function ($carry, $item) {
            return $carry + ($item['count'] ?? 0);
        }, 0);

        $summary = [
            'total_amount' => $summaryTotalAmount,
            'total_count' => $summaryTotalCount,
            'status_breakdown' => $statusBreakdown,
            'method_breakdown' => $methodBreakdown,
        ];

        if (($validated['export'] ?? null) === 'csv') {
            $exportQuery = (clone $paymentsQuery)->orderByDesc('created_at');

            $fileName = 'paiements-'.now()->format('Ymd_His').'.csv';

            return response()->streamDownload(function () use ($exportQuery) {
                $handle = fopen('php://output', 'w');

                if (! $handle) {
                    return;
                }

                fputcsv($handle, [
                    'Référence',
                    'Réservation',
                    'Client',
                    'Téléphone',
                    'Produit',
                    'Montant',
                    'Devise',
                    'Statut',
                    'Méthode',
                    'Créé le',
                    'Payé le',
                ], ';');

                $exportQuery->chunk(200, function ($payments) use ($handle) {
                    foreach ($payments as $payment) {
                        $reservation = $payment->reservation;
                        $consumer = $reservation?->user;
                        $product = $reservation?->product;

                        fputcsv($handle, [
                            $payment->reference,
                            $reservation?->reservation_code,
                            $consumer ? trim(($consumer->first_name ?? '').' '.($consumer->last_name ?? '')) ?: ($consumer->name ?? '') : null,
                            $consumer?->phone,
                            $product?->name,
                            number_format((float) $payment->amount, 2, ',', ' '),
                            $payment->currency,
                            $payment->status?->value ?? $payment->status,
                            $payment->payment_method?->value ?? $payment->payment_method,
                            optional($payment->created_at)?->format('Y-m-d H:i:s'),
                            optional($payment->paid_at)?->format('Y-m-d H:i:s'),
                        ], ';');
                    }
                });

                fclose($handle);
            }, $fileName, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $payments = (clone $paymentsQuery)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = PaymentResource::collection($payments->getCollection())->toArray($request);

        $appliedFilters = collect($validated)
            ->only(['status', 'method', 'date_from', 'date_to', 'min_amount', 'max_amount', 'search'])
            ->filter(static fn ($value) => $value !== null && $value !== '');

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
            'meta' => [
                'summary' => $summary,
                'applied_filters' => $appliedFilters,
            ],
        ]);
    }

    public function methods(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $wallet = $user->wallet;
        $methods = collect(PaymentMethod::cases())->map(function (PaymentMethod $method) use ($wallet) {
            $isWallet = $method->isWallet();
            $walletAvailable = $isWallet && $wallet ? (bool) $wallet->is_active : false;

            return [
                'value' => $method->value,
                'label' => $this->labelForMethod($method),
                'description' => $this->descriptionForMethod($method),
                'instructions' => $this->instructionsForMethod($method),
                'provider' => $method->provider(),
                'requires_phone' => $method->requiresPhone(),
                'requires_pin' => $isWallet,
                'is_wallet' => $isWallet,
                'is_instant' => $method->isInstantPayment(),
                'is_available' => $isWallet ? $walletAvailable : true,
                'wallet_balance' => $isWallet && $wallet ? (float) $wallet->balance : null,
                'wallet_currency' => $isWallet && $wallet ? $wallet->currency : null,
                'wallet_has_pin' => $isWallet && $wallet ? $wallet->hasPin() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    public function initiate(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $validated = $request->validate([
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'customer_phone' => ['nullable', 'string', 'regex:/^\+?[0-9]{8,15}$/'],
            'customer_email' => ['nullable', 'email'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $reservation = Reservation::where('user_id', $user->id)->findOrFail($validated['reservation_id']);

        $method = PaymentMethod::from($validated['payment_method']);

        if ($method->requiresPhone() && empty($validated['customer_phone'])) {
            return response()->json([
                'success' => false,
                'message' => 'Le numéro de téléphone est requis pour ce moyen de paiement.',
            ], 422);
        }

        $payment = $this->payments->initializePayment($reservation, $method, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Paiement initialisé avec succès.',
            'data' => new PaymentResource($payment),
        ], 201);
    }

    public function initiateMobileMoney(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $validated = $request->validate([
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'provider' => ['required', 'string', Rule::in(['flooz', 'tmoney', 'orange_money', 'mtn_momo'])],
            'customer_phone' => ['required', 'string', 'regex:/^\+?[0-9]{8,15}$/'],
            'customer_email' => ['nullable', 'email'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:500'],
            'reference' => ['nullable', 'string', 'max:100'],
        ]);

        $reservation = Reservation::where('user_id', $user->id)->findOrFail($validated['reservation_id']);

        $method = $this->resolveMobileMoneyMethod($validated['provider']);

        $payment = $this->payments->initializePayment($reservation, $method, [
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'currency' => $validated['currency'] ?? config('payments.currency', 'XOF'),
            'notes' => $validated['notes'] ?? null,
            'reference' => $validated['reference'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paiement Mobile Money initialisé avec succès.',
            'data' => new PaymentResource($payment),
        ], 201);
    }

    public function status(Payment $payment): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($payment->reservation->user_id !== $user->id) {
            abort(403, 'Accès non autorisé à ce paiement.');
        }

        $payment = $this->payments->refreshPayment($payment);

        return response()->json([
            'success' => true,
            'data' => new PaymentResource($payment),
        ]);
    }

    public function cancel(Request $request, Payment $payment): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($payment->reservation->user_id !== $user->id) {
            abort(403, 'Accès non autorisé à ce paiement.');
        }

        $payment = $this->payments->cancelPayment($payment, [
            'reason' => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paiement annulé avec succès.',
            'data' => new PaymentResource($payment),
        ]);
    }

    public function paygateCallback(Request $request): JsonResponse
    {
        // SEC-003 FIX: Pass raw body and signature header for verification
        $rawBody = $request->getContent();
        $signatureHeader = $request->header('X-PayGate-Signature')
            ?? $request->header('X-Signature')
            ?? $request->header('Signature')
            ?? null;

        $payment = $this->payments->handleCallback('paygate', $request->all(), [
            'raw_body' => $rawBody,
            'signature_header' => $signatureHeader,
        ]);

        return response()->json([
            'success' => (bool) $payment,
            'data' => $payment ? new PaymentResource($payment) : null,
        ]);
    }

    public function paystackCallback(Request $request): JsonResponse
    {
        $payment = $this->payments->handleCallback('paystack', $request->all());

        return response()->json([
            'success' => (bool) $payment,
            'data' => $payment ? new PaymentResource($payment) : null,
        ]);
    }

    public function fedapayCallback(Request $request): JsonResponse
    {
        $payment = $this->payments->handleCallback('fedapay', $request->all());

        return response()->json([
            'success' => (bool) $payment,
            'data' => $payment ? new PaymentResource($payment) : null,
        ]);
    }

    public function cinetpayCallback(Request $request): JsonResponse
    {
        $payment = $this->payments->handleCallback('cinetpay', $request->all());

        return response()->json([
            'success' => (bool) $payment,
            'data' => $payment ? new PaymentResource($payment) : null,
        ]);
    }

    private function labelForMethod(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => 'Flooz (Moov Togo)',
            PaymentMethod::TMONEY => 'Mixx by Yas (Tmoney)',
            PaymentMethod::ORANGE_MONEY => 'Orange Money',
            PaymentMethod::MTN_MOMO => 'MTN MoMo',
            PaymentMethod::PAYSTACK => 'Paystack',
            PaymentMethod::ON_SITE => 'Paiement sur place',
            PaymentMethod::WALLET => 'Portefeuille AntiGaspi',
        };
    }

    private function descriptionForMethod(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ, PaymentMethod::TMONEY => 'PayGate - Mobile Money',
            PaymentMethod::ORANGE_MONEY, PaymentMethod::MTN_MOMO => 'CinetPay - Mobile Money',
            PaymentMethod::PAYSTACK => 'Cartes bancaires & Mobile Money',
            PaymentMethod::ON_SITE => 'Régler lors du retrait',
            PaymentMethod::WALLET => 'Utilisez votre solde AntiGaspi pour un paiement instantané',
        };
    }

    private function instructionsForMethod(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => 'Assurez-vous que votre numéro Flooz est actif et dispose des fonds nécessaires.',
            PaymentMethod::TMONEY => 'Le numéro Mixx by Yas doit être au format international (+228...).',
            PaymentMethod::ORANGE_MONEY => 'Utilisez votre numéro Orange Money au format international.',
            PaymentMethod::MTN_MOMO => 'Le numéro MTN MoMo doit être saisi au format international.',
            PaymentMethod::PAYSTACK => 'Vous serez redirigé vers Paystack pour finaliser le paiement de façon sécurisée.',
            PaymentMethod::ON_SITE => 'Préparez le montant exact et réglez directement auprès du commerçant.',
            PaymentMethod::WALLET => 'Paiement instantané depuis votre portefeuille AntiGaspi.',
        };
    }

    private function resolveMobileMoneyMethod(string $provider): PaymentMethod
    {
        return match ($provider) {
            'flooz' => PaymentMethod::FLOOZ,
            'tmoney' => PaymentMethod::TMONEY,
            'orange_money' => PaymentMethod::ORANGE_MONEY,
            'mtn_momo' => PaymentMethod::MTN_MOMO,
            default => throw new \InvalidArgumentException("Unsupported mobile money provider [{$provider}]."),
        };
    }
}
