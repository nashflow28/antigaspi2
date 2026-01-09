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

/**
 * PayGate Global Gateway Implementation
 *
 * Handles Mobile Money payments (Flooz & TMoney) for Togo market.
 *
 * API Documentation: https://paygateglobal.com/guide
 *
 * Endpoints:
 * - POST /pay - Initialize a payment
 * - POST /status (v1) - Check status by tx_reference
 * - POST /v2/status - Check status by identifier
 *
 * Status Codes:
 * - Initialization: 0=success, 2=invalid_token, 4=invalid_params, 6=duplicate
 * - Payment: 0=success, 2=pending, 4=expired, 6=cancelled
 */
class PayGateGateway implements PaymentGateway
{
    // Initialization response codes
    private const INIT_SUCCESS = 0;
    private const INIT_INVALID_TOKEN = 2;
    private const INIT_INVALID_PARAMS = 4;
    private const INIT_DUPLICATE = 6;

    // Payment status codes
    private const PAYMENT_SUCCESS = 0;
    private const PAYMENT_PENDING = 2;
    private const PAYMENT_EXPIRED = 4;
    private const PAYMENT_CANCELLED = 6;

    public function __construct(private array $config)
    {
    }

    /**
     * Initialize a Mobile Money payment via PayGate
     *
     * @throws PaymentException
     */
    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $method = $payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method);

        // Generate unique identifier for this transaction
        $identifier = $this->generateIdentifier($reservation);

        // Format phone number for PayGate (must include country code)
        $customerPhone = $this->formatPhoneNumber($data['customer_phone'] ?? $payment->customer_phone);

        // Validate required data
        if (empty($customerPhone)) {
            throw PaymentException::initializationFailed('Le numéro de téléphone est requis pour PayGate');
        }

        if (empty($this->config['auth_token'])) {
            Log::error('PayGate: auth_token is not configured');
            throw PaymentException::initializationFailed('Configuration PayGate manquante');
        }

        // Build PayGate API payload
        $payload = [
            'auth_token' => $this->config['auth_token'],
            'phone_number' => $customerPhone,
            'amount' => (int) $payment->amount, // PayGate expects integer
            'identifier' => $identifier,
            'network' => $this->networkFor($method),
            'description' => "Paiement réservation #{$reservation->reservation_code}",
        ];

        Log::info('PayGate: Initializing payment', [
            'reservation_id' => $reservation->id,
            'reservation_code' => $reservation->reservation_code,
            'identifier' => $identifier,
            'amount' => $payload['amount'],
            'network' => $payload['network'],
            'phone' => substr($customerPhone, 0, 6) . '****', // Mask phone for logs
        ]);

        try {
            $response = Http::timeout(30)
                ->acceptJson()
                ->post($this->config['base_url'] . '/pay', $payload);

            $body = $response->json() ?? [];

            Log::info('PayGate: API response', [
                'status_code' => $response->status(),
                'body' => $body,
            ]);

            // Check initialization status
            $initStatus = $body['status'] ?? -1;

            if ($initStatus !== self::INIT_SUCCESS) {
                $errorMessage = $this->getInitErrorMessage($initStatus, $body);

                Log::error('PayGate: Initialization failed', [
                    'status' => $initStatus,
                    'response' => $body,
                    'error_message' => $errorMessage,
                ]);

                throw PaymentException::initializationFailed($errorMessage);
            }

            // Update payment record with PayGate response
            $payment->fill([
                'status' => PaymentStatus::PENDING,
                'provider' => 'paygate',
                'reference' => $identifier, // Our unique identifier
                'transaction_id' => $body['tx_reference'] ?? null, // PayGate's reference
                'customer_phone' => $customerPhone,
                'payload' => [
                    'initialized_at' => now()->toIso8601String(),
                    'request' => array_diff_key($payload, ['auth_token' => '']), // Don't store auth_token
                    'response' => $body,
                ],
            ])->save();

            Log::info('PayGate: Payment initialized successfully', [
                'payment_id' => $payment->id,
                'reference' => $identifier,
                'tx_reference' => $body['tx_reference'] ?? null,
            ]);

            return $payment->refresh();

        } catch (PaymentException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('PayGate: Unexpected error during initialization', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw PaymentException::initializationFailed(
                'Erreur de connexion à PayGate: ' . $e->getMessage()
            );
        }
    }

    /**
     * Refresh payment status from PayGate
     *
     * Uses the v2/status endpoint with our identifier
     */
    public function refreshStatus(Payment $payment): Payment
    {
        if (empty($payment->reference)) {
            Log::warning('PayGate: Cannot refresh status - no reference', [
                'payment_id' => $payment->id,
            ]);
            return $payment;
        }

        try {
            // Use v2 API with identifier (our reference)
            $response = Http::timeout(30)
                ->acceptJson()
                ->post(rtrim($this->config['base_url'], '/v1') . '/api/v2/status', [
                    'auth_token' => $this->config['auth_token'],
                    'identifier' => $payment->reference,
                ]);

            if (!$response->successful()) {
                Log::warning('PayGate: Status check failed', [
                    'payment_id' => $payment->id,
                    'status_code' => $response->status(),
                    'response' => $response->body(),
                ]);
                return $payment;
            }

            $body = $response->json() ?? [];
            $status = $this->mapPaymentStatus($body['status'] ?? self::PAYMENT_PENDING);

            Log::info('PayGate: Status refreshed', [
                'payment_id' => $payment->id,
                'paygate_status' => $body['status'] ?? 'N/A',
                'mapped_status' => $status->value,
            ]);

            $updateData = [
                'status' => $status,
            ];

            // Update paid_at if payment succeeded
            if ($status === PaymentStatus::SUCCESS && !$payment->paid_at) {
                $updateData['paid_at'] = isset($body['datetime'])
                    ? \Carbon\Carbon::parse($body['datetime'])
                    : now();
            }

            // Update transaction_id if provided
            if (!empty($body['tx_reference'])) {
                $updateData['transaction_id'] = $body['tx_reference'];
            }

            // Merge payload
            $existingPayload = $payment->payload ?? [];
            $updateData['payload'] = array_merge($existingPayload, [
                'status_check' => [
                    'checked_at' => now()->toIso8601String(),
                    'response' => $body,
                ],
            ]);

            $payment->fill($updateData)->save();

            return $payment->refresh();

        } catch (\Exception $e) {
            Log::error('PayGate: Error refreshing status', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            return $payment;
        }
    }

    /**
     * Handle webhook callback from PayGate
     *
     * PayGate sends POST with:
     * - tx_reference: PayGate's transaction ID
     * - identifier: Our unique identifier
     * - payment_reference: Flooz/TMoney reference
     * - amount: Amount paid
     * - datetime: Payment timestamp
     * - payment_method: FLOOZ or T-Money
     * - phone_number: Customer phone
     */
    public function handleCallback(array $payload): ?Payment
    {
        Log::info('PayGate: Webhook received', [
            'payload' => array_diff_key($payload, ['phone_number' => '']), // Mask phone
        ]);

        // PayGate sends 'identifier' which is our reference
        $identifier = $payload['identifier'] ?? null;

        if (!$identifier) {
            Log::warning('PayGate: Webhook missing identifier', ['payload' => $payload]);
            return null;
        }

        // Find payment by our reference
        $payment = Payment::where('reference', $identifier)
            ->where('provider', 'paygate')
            ->first();

        if (!$payment) {
            Log::warning('PayGate: Payment not found for webhook', [
                'identifier' => $identifier,
            ]);
            return null;
        }

        // Security: Only update pending payments (prevents replay attacks)
        if ($payment->status !== PaymentStatus::PENDING) {
            Log::info('PayGate: Ignoring webhook for non-pending payment', [
                'payment_id' => $payment->id,
                'current_status' => $payment->status->value ?? $payment->status,
            ]);
            return $payment; // Return existing payment without modification
        }

        // BUG-009 FIX: Validate amount matches (prevents partial payment fraud)
        // MUST check BEFORE marking as SUCCESS
        $webhookAmount = isset($payload['amount']) ? (int) $payload['amount'] : null;
        if ($webhookAmount !== null && $webhookAmount !== (int) $payment->amount) {
            Log::critical('BUG-009: PayGate amount mismatch - REJECTING payment', [
                'payment_id' => $payment->id,
                'expected_amount' => (int) $payment->amount,
                'received_amount' => $webhookAmount,
                'difference' => $webhookAmount - (int) $payment->amount,
                'identifier' => $identifier,
            ]);

            // Mark payment as failed due to amount mismatch
            $payment->fill([
                'status' => PaymentStatus::FAILED,
                'payload' => array_merge($payment->payload ?? [], [
                    'webhook_rejected' => [
                        'received_at' => now()->toIso8601String(),
                        'reason' => 'amount_mismatch',
                        'expected_amount' => (int) $payment->amount,
                        'received_amount' => $webhookAmount,
                        'original_payload' => $payload,
                    ],
                ]),
            ])->save();

            return $payment->refresh();
        }

        // Webhook from PayGate means payment is confirmed
        $previousStatus = $payment->status;

        $payment->fill([
            'status' => PaymentStatus::SUCCESS,
            'paid_at' => isset($payload['datetime'])
                ? \Carbon\Carbon::parse($payload['datetime'])
                : now(),
            'transaction_id' => $payload['tx_reference'] ?? $payment->transaction_id,
            'payload' => array_merge($payment->payload ?? [], [
                'webhook' => [
                    'received_at' => now()->toIso8601String(),
                    'payload' => $payload,
                    'payment_reference' => $payload['payment_reference'] ?? null,
                    'payment_method' => $payload['payment_method'] ?? null,
                ],
            ]),
        ])->save();

        Log::info('PayGate: Payment confirmed via webhook', [
            'payment_id' => $payment->id,
            'previous_status' => $previousStatus instanceof PaymentStatus ? $previousStatus->value : $previousStatus,
            'new_status' => PaymentStatus::SUCCESS->value,
            'amount' => $payload['amount'] ?? 'N/A',
            'payment_method' => $payload['payment_method'] ?? 'N/A',
            'payment_reference' => $payload['payment_reference'] ?? 'N/A',
        ]);

        return $payment->refresh();
    }

    /**
     * Cancel a payment
     *
     * Note: PayGate doesn't support explicit cancellation via API.
     * Payments expire automatically after timeout (~3 minutes).
     * This method marks the payment as failed locally.
     */
    public function cancel(Payment $payment, array $context = []): Payment
    {
        Log::info('PayGate: Cancelling payment locally', [
            'payment_id' => $payment->id,
            'reason' => $context['reason'] ?? 'User cancelled',
        ]);

        $payment->fill([
            'status' => PaymentStatus::FAILED,
            'payload' => array_merge($payment->payload ?? [], [
                'cancelled' => [
                    'cancelled_at' => now()->toIso8601String(),
                    'reason' => $context['reason'] ?? 'Cancelled by user',
                    'note' => 'PayGate payments expire automatically after timeout',
                ],
            ]),
        ])->save();

        return $payment->refresh();
    }

    /**
     * Map PayGate status code to PaymentStatus enum
     */
    private function mapPaymentStatus(int $status): PaymentStatus
    {
        return match ($status) {
            self::PAYMENT_SUCCESS => PaymentStatus::SUCCESS,
            self::PAYMENT_PENDING => PaymentStatus::PENDING,
            self::PAYMENT_EXPIRED, self::PAYMENT_CANCELLED => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    /**
     * Get human-readable error message for initialization failure
     */
    private function getInitErrorMessage(int $status, array $body): string
    {
        return match ($status) {
            self::INIT_INVALID_TOKEN => 'Token d\'authentification PayGate invalide',
            self::INIT_INVALID_PARAMS => 'Paramètres de paiement invalides: ' . ($body['message'] ?? 'vérifiez le numéro et le montant'),
            self::INIT_DUPLICATE => 'Une transaction avec cet identifiant existe déjà',
            default => 'Erreur PayGate inconnue (code: ' . $status . '): ' . ($body['message'] ?? 'N/A'),
        };
    }

    /**
     * Generate unique identifier for the transaction
     *
     * Format: GLD-{reservation_id}-{timestamp}
     */
    private function generateIdentifier(Reservation $reservation): string
    {
        return 'GLD-' . $reservation->id . '-' . time() . '-' . random_int(100, 999);
    }

    /**
     * Format phone number for PayGate (Togo format: 228XXXXXXXX)
     */
    private function formatPhoneNumber(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If already starts with 228, return as is
        if (str_starts_with($phone, '228')) {
            return $phone;
        }

        // If starts with +228, remove the +
        if (str_starts_with($phone, '+228')) {
            return substr($phone, 1);
        }

        // If starts with 0, replace with 228
        if (str_starts_with($phone, '0')) {
            return '228' . substr($phone, 1);
        }

        // Otherwise, prepend 228
        return '228' . $phone;
    }

    /**
     * Get PayGate network code for payment method
     *
     * @throws PaymentException
     */
    private function networkFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => $this->config['networks']['flooz'] ?? 'FLOOZ',
            PaymentMethod::TMONEY => $this->config['networks']['tmoney'] ?? 'TMONEY',
            default => throw PaymentException::initializationFailed(
                "Méthode de paiement {$method->value} non supportée par PayGate. Utilisez Flooz ou TMoney."
            ),
        };
    }
}
