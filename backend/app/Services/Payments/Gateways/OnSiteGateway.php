<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\PaymentGateway;

class OnSiteGateway implements PaymentGateway
{
    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $payment->status = PaymentStatus::ON_SITE;
        $payment->payload = array_merge($payment->payload ?? [], ['notes' => $data['notes'] ?? 'Paiement sur place']);
        $payment->save();

        return $payment->refresh();
    }

    public function refreshStatus(Payment $payment): Payment
    {
        return $payment->refresh();
    }

    public function handleCallback(array $payload): ?Payment
    {
        return null;
    }

    public function cancel(Payment $payment, array $context = []): Payment
    {
        $payment->status = PaymentStatus::FAILED;
        $payment->payload = array_merge($payment->payload ?? [], ['cancelled_at' => now()->toISOString()]);
        $payment->save();

        return $payment->refresh();
    }
}
