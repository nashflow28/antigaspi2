<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\PaymentGateway;
use App\Services\WalletService;
use Illuminate\Support\Arr;
use InvalidArgumentException;
use Throwable;

class WalletGateway implements PaymentGateway
{
    public function __construct(private WalletService $wallets)
    {
    }

    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $user = $reservation->user()->first();

        \Illuminate\Support\Facades\Log::info('WalletGateway::initialize called', [
            'reservation_id' => $reservation->id,
            'payment_id' => $payment->id,
            'user_id' => $user?->id,
            'amount' => $payment->amount,
            'pin_present' => isset($data['pin']) && !empty($data['pin']),
            'data_keys' => array_keys($data),
        ]);

        if (!$user) {
            throw new InvalidArgumentException('Wallet payments require a reservation attached to a user.');
        }

        $description = $data['description'] ?? "Paiement réservation #{$reservation->reservation_code}";
        $pin = $data['pin'] ?? null;
        $payload = $payment->payload ?? [];

        try {
            \Illuminate\Support\Facades\Log::info('WalletGateway: calling processWalletPayment', [
                'user_id' => $user->id,
                'amount' => $payment->amount,
                'description' => $description,
            ]);

            $transaction = $this->wallets->processWalletPayment(
                $user,
                (float) $payment->amount,
                $description,
                $pin
            );

            \Illuminate\Support\Facades\Log::info('WalletGateway: payment SUCCESS', [
                'transaction_id' => $transaction->id,
                'previous_balance' => Arr::get($transaction->metadata, 'previous_balance'),
                'new_balance' => Arr::get($transaction->metadata, 'new_balance'),
            ]);

            $payment->status = PaymentStatus::SUCCESS;
            $payment->transaction_id = (string) $transaction->id;
            $payment->paid_at = now();
            $payload = $this->mergePayload($payload, [
                'wallet' => [
                    'transaction_id' => $transaction->id,
                    'previous_balance' => Arr::get($transaction->metadata, 'previous_balance'),
                    'new_balance' => Arr::get($transaction->metadata, 'new_balance'),
                    'processed_at' => now()->toISOString(),
                ],
            ]);
        } catch (Throwable $exception) {
            \Illuminate\Support\Facades\Log::error('WalletGateway: payment FAILED', [
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            $payment->status = PaymentStatus::FAILED;
            $payload = $this->mergePayload($payload, [
                'wallet' => [
                    'error' => $exception->getMessage(),
                    'failed_at' => now()->toISOString(),
                ],
            ]);
        }

        $payment->payload = $payload;
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
        $reservation = $payment->reservation()->first();
        $user = $reservation?->user()->first();
        $payload = $payment->payload ?? [];

        if ($payment->isSuccessful() && $user) {
            $reason = $context['reason'] ?? 'Remboursement paiement wallet';

            $refund = $this->wallets->rechargeWallet(
                $user,
                (float) $payment->amount,
                $reason,
                $payment
            );

            $payload = $this->mergePayload($payload, [
                'wallet' => [
                    'refund_transaction_id' => $refund->id,
                    'refund_reason' => $reason,
                    'refund_processed_at' => now()->toISOString(),
                    'refund_new_balance' => Arr::get($refund->metadata, 'new_balance'),
                ],
            ]);
        }

        $payload = $this->mergePayload($payload, [
            'wallet' => [
                'cancelled_at' => now()->toISOString(),
                'cancel_reason' => $context['reason'] ?? null,
            ],
        ]);

        $payment->status = PaymentStatus::FAILED;
        $payment->paid_at = null;
        $payment->payload = $payload;
        $payment->save();

        return $payment->refresh();
    }

    private function mergePayload(array $original, array $updates): array
    {
        $walletData = Arr::get($original, 'wallet', []);
        $walletUpdates = Arr::get($updates, 'wallet', []);

        return array_merge($original, $updates, [
            'wallet' => array_merge($walletData, array_filter($walletUpdates, fn ($value) => $value !== null)),
        ]);
    }
}
