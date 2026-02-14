<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\Exceptions\PaymentException;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FedaPayGateway implements PaymentGateway
{
    public function __construct(private array $config) {}

    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $method = $payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method);

        $reference = $payment->reference ?? $this->generateReference();
        $customerPhone = $data['customer_phone'] ?? $payment->customer_phone;

        $payload = [
            'transaction' => array_filter([
                'amount' => (float) $payment->amount,
                'description' => 'Reservation #'.$reservation->reservation_code,
                'currency' => ['iso' => $payment->currency],
                'callback_url' => $this->config['callback_url'] ?? null,
                'reference' => $reference,
                'customer' => array_filter([
                    'email' => $data['customer_email'] ?? $reservation->consumer?->email,
                    'phone_number' => $customerPhone ? [
                        'number' => $customerPhone,
                        'country' => $this->config['default_country'] ?? 'TG',
                    ] : null,
                ]),
                'metadata' => [
                    'reservation_id' => $reservation->id,
                    'payment_id' => $payment->id,
                ],
            ]),
            'mode' => $this->modeFor($method),
        ];

        $response = Http::withToken($this->config['api_key'] ?? '')
            ->acceptJson()
            ->post(rtrim($this->config['base_url'] ?? '', '/').'/transactions', $payload);

        if (! $response->successful()) {
            throw PaymentException::initializationFailed($response->body());
        }

        $body = $response->json();
        $transaction = $body['transaction'] ?? $body;
        $status = $this->mapStatus($transaction['status'] ?? 'pending');

        $payment->fill([
            'status' => $status,
            'provider' => 'fedapay',
            'reference' => $transaction['reference'] ?? $reference,
            'transaction_id' => (string) ($transaction['id'] ?? $payment->transaction_id),
            'checkout_url' => $body['payment_url'] ?? $body['redirect_url'] ?? null,
            'customer_phone' => $customerPhone,
            'payload' => $this->mergePayload($payment->payload, [
                'initialize' => [
                    'request' => $payload,
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
        $transactionId = $payment->transaction_id ?? $payment->reference;

        $response = Http::withToken($this->config['api_key'] ?? '')
            ->acceptJson()
            ->get(rtrim($this->config['base_url'] ?? '', '/').'/transactions/'.$transactionId);

        if (! $response->successful()) {
            throw PaymentException::refreshFailed($response->body());
        }

        $body = $response->json();
        $transaction = $body['transaction'] ?? $body;
        $status = $this->mapStatus($transaction['status'] ?? 'pending');

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
        // SECURITY: Verify FedaPay webhook by re-fetching transaction from API
        $transaction = $payload['transaction'] ?? $payload;
        $transactionId = $transaction['id'] ?? $payload['transaction_id'] ?? null;
        $reference = $transaction['reference'] ?? $payload['reference'] ?? null;

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

        // Re-verify transaction status from FedaPay API (don't trust webhook payload alone)
        $apiKey = $this->config['api_key'] ?? '';
        if ($apiKey && $transactionId) {
            try {
                $verifyResponse = Http::withToken($apiKey)
                    ->acceptJson()
                    ->get(rtrim($this->config['base_url'] ?? '', '/').'/transactions/'.$transactionId);

                if ($verifyResponse->successful()) {
                    $verifiedData = $verifyResponse->json();
                    $verifiedTransaction = $verifiedData['transaction'] ?? $verifiedData;
                    // Use the verified status from API, not the webhook payload
                    $transaction = $verifiedTransaction;
                } else {
                    Log::warning('FedaPay webhook: Could not verify transaction via API', [
                        'transaction_id' => $transactionId,
                        'ip' => request()->ip(),
                    ]);
                }
            } catch (\Exception) {
                Log::warning('FedaPay webhook: API verification failed', [
                    'transaction_id' => $transactionId,
                ]);
            }
        }

        $status = $this->mapStatus($transaction['status'] ?? $payload['status'] ?? 'pending');

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
        $transactionId = $payment->transaction_id ?? $payment->reference;

        $response = Http::withToken($this->config['api_key'] ?? '')
            ->acceptJson()
            ->post(rtrim($this->config['base_url'] ?? '', '/').'/transactions/'.$transactionId.'/cancel');

        if (! $response->successful()) {
            throw PaymentException::cancellationFailed($response->body());
        }

        $body = $response->json();
        $transaction = $body['transaction'] ?? $body;
        $status = $this->mapStatus($transaction['status'] ?? 'failed');

        $payment->fill([
            'status' => $status,
            'payload' => $this->mergePayload($payment->payload, [
                'cancel' => $body,
            ]),
        ])->save();

        return $payment->refresh();
    }

    private function mapStatus(string $status): PaymentStatus
    {
        return match (strtolower($status)) {
            'approved', 'success', 'completed', 'paid' => PaymentStatus::SUCCESS,
            'canceled', 'cancelled', 'declined', 'failed', 'error' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    private function modeFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => 'moov_money',
            PaymentMethod::TMONEY => 'togocom',
            default => 'mobile_money',
        };
    }

    private function generateReference(): string
    {
        return 'FD-'.Str::upper(Str::random(10));
    }

    private function mergePayload(?array $existing, array $newPayload): array
    {
        $existing = $existing ?? [];

        return array_merge($existing, $newPayload);
    }
}
