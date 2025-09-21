<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(private PaymentGatewayManager $gateways)
    {
    }

    public function initializePayment(Reservation $reservation, PaymentMethod $method, array $attributes = []): Payment
    {
        if (array_key_exists('wallet_pin', $attributes)) {
            $attributes['pin'] = $attributes['wallet_pin'];
            unset($attributes['wallet_pin']);
        }

        $payment = new Payment([
            'amount' => $reservation->total_amount,
            'currency' => $attributes['currency'] ?? config('payments.currency', 'XOF'),
            'payment_method' => $method,
            'status' => $method === PaymentMethod::ON_SITE ? PaymentStatus::ON_SITE : PaymentStatus::PENDING,
            'provider' => $method->provider(),
            'customer_phone' => $attributes['customer_phone'] ?? null,
            'reference' => $attributes['reference'] ?? Str::upper(Str::random(12)),
            'payload' => [
                'context' => Arr::except($attributes, ['customer_phone', 'reference', 'pin']),
            ],
        ]);

        $payment->reservation()->associate($reservation);
        $payment->save();

        $gateway = $this->gateways->forMethod($method);
        $payment = $gateway->initialize($reservation, $payment, $attributes);

        $this->syncReservation($reservation->refresh(), $payment);

        return $payment->refresh();
    }

    public function refreshPayment(Payment $payment): Payment
    {
        $gateway = $this->gateways->forMethod($payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method));

        $payment = $gateway->refreshStatus($payment);
        $this->syncReservation($payment->reservation()->firstOrFail(), $payment);

        return $payment->refresh();
    }

    public function handleCallback(string $provider, array $payload): ?Payment
    {
        $gateway = $this->gateways->forProvider($provider);
        $payment = $gateway->handleCallback($payload);

        if (!$payment) {
            return null;
        }

        $this->syncReservation($payment->reservation()->firstOrFail(), $payment);

        return $payment->refresh();
    }

    public function cancelPayment(Payment $payment, array $context = []): Payment
    {
        $gateway = $this->gateways->forMethod($payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method));

        $payment = $gateway->cancel($payment, $context);
        $this->syncReservation($payment->reservation()->firstOrFail(), $payment);

        return $payment->refresh();
    }

    protected function syncReservation(Reservation $reservation, Payment $payment): void
    {
        $reservation->fill([
            'latest_payment_id' => $payment->id,
            'payment_status' => $payment->status,
        ])->save();

        if ($payment->isSuccessful()) {
            $reservation->confirm();
        }

        if ($payment->isFailed() && $reservation->canBeCancelled()) {
            $reservation->cancel();
        }
    }
}
