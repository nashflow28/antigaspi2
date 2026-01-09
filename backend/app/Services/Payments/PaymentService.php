<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Notifications\PaymentConfirmedNotification;
use App\Notifications\PaymentReceivedNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
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

        $reservation = $payment->reservation()->firstOrFail();
        $wasNotPaid = !$payment->wasChanged('status') || $payment->getOriginal('status') !== PaymentStatus::SUCCESS->value;

        $this->syncReservation($reservation, $payment);

        // Send notifications if payment just became successful
        if ($payment->isSuccessful() && $wasNotPaid) {
            $this->sendPaymentNotifications($reservation->refresh(), $payment->refresh());
        }

        return $payment->refresh();
    }

    /**
     * Send notifications to customer and merchant after successful payment
     */
    protected function sendPaymentNotifications(Reservation $reservation, Payment $payment): void
    {
        try {
            // Notify customer
            $customer = $reservation->user;
            if ($customer) {
                $customer->notify(new PaymentConfirmedNotification($reservation, $payment));
                Log::info('PaymentService: Customer notification sent', [
                    'user_id' => $customer->id,
                    'reservation_id' => $reservation->id,
                    'payment_id' => $payment->id,
                ]);
            }

            // Notify merchant
            $merchant = $reservation->product?->merchant;
            $merchantUser = $merchant?->user;
            if ($merchantUser) {
                $merchantUser->notify(new PaymentReceivedNotification($reservation, $payment));
                Log::info('PaymentService: Merchant notification sent', [
                    'merchant_user_id' => $merchantUser->id,
                    'reservation_id' => $reservation->id,
                    'payment_id' => $payment->id,
                ]);
            }
        } catch (\Exception $e) {
            // Don't block payment processing if notifications fail
            Log::error('PaymentService: Failed to send payment notifications', [
                'reservation_id' => $reservation->id,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
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
