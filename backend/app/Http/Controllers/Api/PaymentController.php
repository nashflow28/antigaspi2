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
