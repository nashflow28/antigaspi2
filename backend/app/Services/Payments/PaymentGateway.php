<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Reservation;

interface PaymentGateway
{
    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment;

    public function refreshStatus(Payment $payment): Payment;

    public function handleCallback(array $payload): ?Payment;

    public function cancel(Payment $payment, array $context = []): Payment;
}
