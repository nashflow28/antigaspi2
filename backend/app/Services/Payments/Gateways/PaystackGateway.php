<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\Exceptions\PaymentException;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackGateway implements PaymentGateway
{
    public function __construct(private array $config) {}

    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $payload = [
            'amount' => (int) round($payment->amount * 100),
            'email' => $data['email'] ?? $reservation->user->email ?? $data['customer_email'] ?? 'customer@example.com',
            'currency' => $payment->currency,
            'reference' => $payment->reference ?? null,
            'callback_url' => $this->config['callback_url'] ?? null,
        ];

        $response = Http::withToken($this->config['secret_key'] ?? '')->post(
            rtrim($this->config['base_url'] ?? 'https://api.paystack.co', '/').'/transaction/initialize',
            array_filter($payload)
        );

        if (! $response->successful()) {
            throw PaymentException::initializationFailed($response->body());
        }

        $body = $response->json('data', []);

        $payment->fill([
            'status' => PaymentStatus::PENDING,
            'provider' => 'paystack',
            'reference' => $body['reference'] ?? $payment->reference,
            'transaction_id' => $body['reference'] ?? $payment->transaction_id,
            'checkout_url' => $body['authorization_url'] ?? null,
            'payload' => $this->mergePayload($payment->payload, [
                'initialize' => [
                    'request' => $payload,
                    'response' => $response->json(),
                ],
            ]),
        ])->save();

        return $payment->refresh();
    }

    public function refreshStatus(Payment $payment): Payment
    {
        $response = Http::withToken($this->config['secret_key'] ?? '')->get(
            rtrim($this->config['base_url'] ?? 'https://api.paystack.co', '/').'/transaction/verify/'.$payment->reference
        );

        if (! $response->successful()) {
            throw PaymentException::refreshFailed($response->body());
        }

        $body = $response->json('data', []);
        $status = $this->mapStatus($body['status'] ?? 'pending');

        $payment->fill([
            'status' => $status,
            'paid_at' => $status === PaymentStatus::SUCCESS ? now() : $payment->paid_at,
            'payload' => $this->mergePayload($payment->payload, [
                'refresh' => $response->json(),
            ]),
        ])->save();

        return $payment->refresh();
    }

    public function handleCallback(array $payload): ?Payment
    {
        // SECURITY: Verify Paystack webhook signature (HMAC-SHA512) — fail closed
        $secret = $this->config['secret_key'] ?? '';
        if ($secret) {
            $signature = request()->header('X-Paystack-Signature');
            $rawBody = request()->getContent();

            if (! $signature || ! $rawBody) {
                Log::warning('Paystack webhook: Missing signature header — rejected', [
                    'ip' => request()->ip(),
                ]);

                return null;
            }

            $computed = hash_hmac('sha512', $rawBody, $secret);
            if (! hash_equals($computed, $signature)) {
                Log::warning('Paystack webhook: Invalid signature', [
                    'ip' => request()->ip(),
                ]);

                return null;
            }
        }

        $reference = Arr::get($payload, 'data.reference', Arr::get($payload, 'reference'));

        if (! $reference) {
            return null;
        }

        $payment = Payment::where('reference', $reference)->first();

        if (! $payment) {
            return null;
        }

        $status = $this->mapStatus(Arr::get($payload, 'data.status', Arr::get($payload, 'status', 'pending')));

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
        $payment->fill([
            'status' => PaymentStatus::FAILED,
            'payload' => $this->mergePayload($payment->payload, [
                'cancel' => ['reason' => $context['reason'] ?? 'user_cancelled'],
            ]),
        ])->save();

        return $payment->refresh();
    }

    protected function mapStatus(string $status): PaymentStatus
    {
        return match (strtolower($status)) {
            'success', 'successful', 'paid' => PaymentStatus::SUCCESS,
            'failed', 'cancelled', 'error' => PaymentStatus::FAILED,
            'abandoned' => PaymentStatus::FAILED,
            'refund', 'refunded' => PaymentStatus::REFUNDED,
            default => PaymentStatus::PENDING,
        };
    }

    protected function mergePayload(?array $existing, array $newPayload): array
    {
        $existing = $existing ?? [];

        return array_merge($existing, $newPayload);
    }
}
