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

class CinetPayGateway implements PaymentGateway
{
    public function __construct(private array $config) {}

    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $method = $payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method);

        $reference = $payment->reference ?? $this->generateReference();
        $customerPhone = $data['customer_phone'] ?? $payment->customer_phone;

        $payload = array_filter([
            'apikey' => $this->config['api_key'] ?? null,
            'site_id' => $this->config['site_id'] ?? null,
            'transaction_id' => $reference,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'description' => 'Reservation #'.$reservation->reservation_code,
            'customer_name' => $reservation->consumer?->first_name,
            'customer_surname' => $reservation->consumer?->last_name,
            'customer_email' => $data['customer_email'] ?? $reservation->consumer?->email,
            'customer_phone_number' => $customerPhone,
            'notify_url' => $this->config['notify_url'] ?? $this->config['callback_url'] ?? null,
            'return_url' => $this->config['return_url'] ?? null,
            'channels' => [$this->channelFor($method)],
            'metadata' => [
                'reservation_id' => $reservation->id,
                'payment_id' => $payment->id,
            ],
        ]);

        $response = Http::acceptJson()
            ->post(rtrim($this->config['base_url'] ?? '', '/').'/payment', $payload);

        if (! $response->successful()) {
            throw PaymentException::initializationFailed($response->body());
        }

        $body = $response->json();
        $dataBody = $body['data'] ?? $body;
        $status = $this->mapStatus($dataBody['status'] ?? 'pending');

        $payment->fill([
            'status' => $status,
            'provider' => 'cinetpay',
            'reference' => $reference,
            'transaction_id' => (string) ($dataBody['transaction_id'] ?? $payment->transaction_id ?? $reference),
            'checkout_url' => $dataBody['payment_url'] ?? $dataBody['checkout_url'] ?? null,
            'customer_phone' => $customerPhone,
            'payload' => $this->mergePayload($payment->payload, [
                'initialize' => [
                    'request' => Arr::except($payload, ['apikey']),
                    'response' => $body,
                ],
            ]),
        ])->save();

        if ($status === PaymentStatus::SUCCESS) {
            $payment->fill(['paid_at' => now()])->save();
        }

        return $payment->refresh();
    }

    public function refreshStatus(Payment $payment): Payment
    {
        $payload = array_filter([
            'apikey' => $this->config['api_key'] ?? null,
            'site_id' => $this->config['site_id'] ?? null,
            'transaction_id' => $payment->transaction_id ?? $payment->reference,
        ]);

        $response = Http::acceptJson()
            ->post(rtrim($this->config['base_url'] ?? '', '/').'/payment/check', $payload);

        if (! $response->successful()) {
            throw PaymentException::refreshFailed($response->body());
        }

        $body = $response->json();
        $dataBody = $body['data'] ?? $body;
        $status = $this->mapStatus($dataBody['status'] ?? 'pending');

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
        $transactionId = $payload['transaction_id'] ?? $payload['transactionId'] ?? null;
        $reference = $payload['reference'] ?? null;

        $payment = null;

        if ($transactionId) {
            $payment = Payment::where('transaction_id', (string) $transactionId)->first();
        }

        if (! $payment && $reference) {
            $payment = Payment::where('reference', $reference)->first();
        }

        if (! $payment) {
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
        $payload = array_filter([
            'apikey' => $this->config['api_key'] ?? null,
            'site_id' => $this->config['site_id'] ?? null,
            'transaction_id' => $payment->transaction_id ?? $payment->reference,
        ]);

        $response = Http::acceptJson()
            ->post(rtrim($this->config['base_url'] ?? '', '/').'/payment/cancel', $payload);

        if (! $response->successful()) {
            throw PaymentException::cancellationFailed($response->body());
        }

        $body = $response->json();
        $dataBody = $body['data'] ?? $body;
        $status = $this->mapStatus($dataBody['status'] ?? 'failed');

        $payment->fill([
            'status' => $status,
            'payload' => $this->mergePayload($payment->payload, [
                'cancel' => $body,
            ]),
        ])->save();

        return $payment->refresh();
    }

    private function channelFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::ORANGE_MONEY => 'ORANGE_MONEY',
            PaymentMethod::MTN_MOMO => 'MTN_MOBILE_MONEY',
            PaymentMethod::FLOOZ => 'MOOV_MONEY',
            PaymentMethod::TMONEY => 'TOGOCOM',
            default => 'MOBILE_MONEY',
        };
    }

    private function mapStatus(string $status): PaymentStatus
    {
        return match (strtoupper($status)) {
            'ACCEPTED', 'SUCCESS', 'PAID', 'COMPLETED', 'VALIDATED' => PaymentStatus::SUCCESS,
            'REFUSED', 'REJECTED', 'CANCELED', 'CANCELLED', 'FAILED', 'ERROR', 'EXPIRED' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    private function generateReference(): string
    {
        return 'CP-'.Str::upper(Str::random(10));
    }

    private function mergePayload(?array $existing, array $newPayload): array
    {
        $existing = $existing ?? [];

        return array_merge($existing, $newPayload);
    }
}
