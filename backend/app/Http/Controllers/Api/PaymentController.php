<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
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
        $payment = $this->payments->handleCallback('paygate', $request->all());

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
