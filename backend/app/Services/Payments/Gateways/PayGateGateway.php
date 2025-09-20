<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\Exceptions\PaymentException;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PayGateGateway implements PaymentGateway
{
    public function __construct(private array $config)
    {
    }

    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $method = $payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method);

        $reference = $payment->reference ?? $this->generateReference();
        $customerPhone = $data['customer_phone'] ?? $payment->customer_phone;
        $payload = [
            'service' => $this->serviceFor($method),
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'customer_phone_number' => $customerPhone,
            'description' => 'Reservation #' . $reservation->reservation_code,
            'merchant_id' => $this->config['merchant_id'] ?? null,
            'callback_url' => $this->config['callback_url'] ?? null,
            'reference' => $reference,
        ];

        $response = Http::withBasicAuth(
            $this->config['merchant_id'] ?? '',
            $this->config['merchant_password'] ?? ''
        )->post(rtrim($this->config['base_url'] ?? '', '/') . '/transactions', $payload);

        if (!$response->successful()) {
            throw PaymentException::initializationFailed($response->body());
        }

        $body = $response->json();

        $payment->fill([
            'status' => PaymentStatus::PENDING,
            'provider' => 'paygate',
            'reference' => $body['reference'] ?? $reference,
            'customer_phone' => $customerPhone,
            'transaction_id' => $body['transaction_id'] ?? $payment->transaction_id,
            'checkout_url' => $body['checkout_url'] ?? $body['payment_url'] ?? null,
            'payload' => $this->mergePayload($payment->payload, [
                'initialize' => [
                    'request' => Arr::except($payload, ['merchant_password']),
                    'response' => $body,
                ],
            ]),
        ])->save();

        return $payment->refresh();
    }

    public function refreshStatus(Payment $payment): Payment
    {
        $response = Http::withBasicAuth(
            $this->config['merchant_id'] ?? '',
            $this->config['merchant_password'] ?? ''
        )->get(rtrim($this->config['base_url'] ?? '', '/') . '/transactions/' . $payment->reference);

        if (!$response->successful()) {
            throw PaymentException::refreshFailed($response->body());
        }

        $body = $response->json();
        $status = $this->mapStatus($body['status'] ?? 'pending');

        $payment->fill([
            'status' => $status,
            'paid_at' => $status === PaymentStatus::SUCCESS ? now() : $payment->paid_at,
            'payload' => $this->mergePayload($payment->payload, [
                'refresh' => $body,
            ]),
        ])->save();

        return $payment->refresh();
    }

    public function handleCallback(array $payload): ?Payment
    {
        if (!isset($payload['reference'])) {
            return null;
        }

        $payment = Payment::where('reference', $payload['reference'])->first();

        if (!$payment) {
            return null;
        }

        $status = $this->mapStatus($payload['status'] ?? 'pending');

        $payment->fill([
            'status' => $status,
            'paid_at' => $status === PaymentStatus::SUCCESS ? now() : $payment->paid_at,
            'payload' => $this->mergePayload($payment->payload, [
                'callback' => $payload,
            ]),
        ])->save();

        return $payment->refresh();
    }

    public function cancel(Payment $payment, array $context = []): Payment
    {
        $response = Http::withBasicAuth(
            $this->config['merchant_id'] ?? '',
            $this->config['merchant_password'] ?? ''
        )->post(rtrim($this->config['base_url'] ?? '', '/') . '/transactions/' . $payment->reference . '/cancel');

        if (!$response->successful()) {
            throw PaymentException::cancellationFailed($response->body());
        }

        $body = $response->json();
        $status = $this->mapStatus($body['status'] ?? 'failed');

        $payment->fill([
            'status' => $status,
            'payload' => $this->mergePayload($payment->payload, [
                'cancel' => $body,
            ]),
        ])->save();

        return $payment->refresh();
    }

    protected function mapStatus(string $status): PaymentStatus
    {
        return match (strtolower($status)) {
            'success', 'successful', 'paid' => PaymentStatus::SUCCESS,
            'failed', 'error', 'declined' => PaymentStatus::FAILED,
            'on_site' => PaymentStatus::ON_SITE,
            'refunded' => PaymentStatus::REFUNDED,
            default => PaymentStatus::PENDING,
        };
    }

    protected function generateReference(): string
    {
        return 'PG-' . Str::upper(Str::random(10));
    }

    protected function serviceFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => $this->config['services']['flooz'] ?? 'FLOOZ',
            PaymentMethod::TMONEY => $this->config['services']['tmoney'] ?? 'TMONEY',
            default => 'MOBILE',
        };
    }

    protected function mergePayload(?array $existing, array $newPayload): array
    {
        $existing = $existing ?? [];

        return array_merge($existing, $newPayload);
    }
}
