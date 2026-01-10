<?php

namespace App\Services\Payment;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Support\Facades\Log;

class WalletGateway implements PaymentGatewayInterface
{
    public function __construct(
        private WalletService $walletService
    ) {}

    public function createPayment(array $data): array
    {
        $user = User::find($data['user_id']);
        if (! $user) {
            throw new \Exception('Utilisateur non trouvé');
        }

        $wallet = $this->walletService->getOrCreateWallet($user);

        if (! $wallet->is_active) {
            throw new \Exception('Le portefeuille est désactivé');
        }

        if (! $wallet->hasBalance($data['amount'])) {
            return [
                'success' => false,
                'message' => 'Solde insuffisant dans le portefeuille',
                'payment_url' => null,
                'reference' => null,
                'status' => PaymentStatus::FAILED->value,
            ];
        }

        if (! $wallet->canSpend($data['amount'])) {
            return [
                'success' => false,
                'message' => 'Limite de dépense quotidienne dépassée',
                'payment_url' => null,
                'reference' => null,
                'status' => PaymentStatus::FAILED->value,
            ];
        }

        $reference = 'WALLET_'.strtoupper(uniqid());

        return [
            'success' => true,
            'message' => 'Paiement wallet prêt pour confirmation',
            'payment_url' => null,
            'reference' => $reference,
            'status' => PaymentStatus::PENDING->value,
            'wallet_balance' => $wallet->balance,
            'daily_remaining' => $wallet->remaining_daily_limit,
        ];
    }

    public function processPayment(Payment $payment, array $options = []): array
    {
        $user = $payment->user;
        if (! $user) {
            throw new \Exception('Utilisateur du paiement non trouvé');
        }

        $wallet = $this->walletService->getOrCreateWallet($user);

        if ($payment->status !== PaymentStatus::PENDING) {
            return [
                'success' => false,
                'message' => 'Le paiement n\'est pas en attente de traitement',
                'transaction_id' => null,
            ];
        }

        try {
            $pin = $options['pin'] ?? null;
            $description = $options['description'] ?? "Paiement commande #{$payment->id}";

            $transaction = $this->walletService->processWalletPayment(
                $user,
                $payment->amount,
                $description,
                $pin
            );

            $payment->update([
                'status' => PaymentStatus::COMPLETED,
                'provider_response' => [
                    'wallet_transaction_id' => $transaction->id,
                    'wallet_balance_before' => $transaction->metadata['previous_balance'],
                    'wallet_balance_after' => $transaction->metadata['new_balance'],
                    'processed_at' => now()->toISOString(),
                ],
            ]);

            Log::info('Wallet payment processed successfully', [
                'payment_id' => $payment->id,
                'user_id' => $user->id,
                'amount' => $payment->amount,
                'transaction_id' => $transaction->id,
            ]);

            return [
                'success' => true,
                'message' => 'Paiement effectué avec succès',
                'transaction_id' => $transaction->id,
                'wallet_balance' => $wallet->fresh()->balance,
            ];

        } catch (\Exception $e) {
            $payment->update([
                'status' => PaymentStatus::FAILED,
                'provider_response' => [
                    'error' => $e->getMessage(),
                    'failed_at' => now()->toISOString(),
                ],
            ]);

            Log::error('Wallet payment failed', [
                'payment_id' => $payment->id,
                'user_id' => $user->id,
                'amount' => $payment->amount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'transaction_id' => null,
            ];
        }
    }

    public function verifyPayment(string $reference): array
    {
        if (! str_starts_with($reference, 'WALLET_')) {
            throw new \Exception('Référence de paiement wallet invalide');
        }

        $payment = Payment::where('reference', $reference)
            ->where('method', PaymentMethod::WALLET)
            ->first();

        if (! $payment) {
            return [
                'success' => false,
                'status' => 'not_found',
                'message' => 'Paiement non trouvé',
            ];
        }

        return [
            'success' => true,
            'status' => $payment->status->value,
            'message' => $this->getStatusMessage($payment->status),
            'amount' => $payment->amount,
            'created_at' => $payment->created_at,
            'completed_at' => $payment->status === PaymentStatus::COMPLETED ?
                ($payment->provider_response['processed_at'] ?? null) : null,
        ];
    }

    public function refundPayment(Payment $payment, ?float $amount = null): array
    {
        if ($payment->method !== PaymentMethod::WALLET) {
            throw new \Exception('Ce paiement n\'est pas un paiement wallet');
        }

        if ($payment->status !== PaymentStatus::COMPLETED) {
            return [
                'success' => false,
                'message' => 'Seuls les paiements complétés peuvent être remboursés',
                'refund_id' => null,
            ];
        }

        $refundAmount = $amount ?? $payment->amount;

        if ($refundAmount > $payment->amount) {
            throw new \Exception('Le montant de remboursement ne peut pas dépasser le montant original');
        }

        try {
            $user = $payment->user;
            $description = "Remboursement paiement #{$payment->id}";

            $transaction = $this->walletService->rechargeWallet(
                $user,
                $refundAmount,
                $description,
                $payment
            );

            $payment->update([
                'status' => $refundAmount >= $payment->amount ?
                    PaymentStatus::REFUNDED : PaymentStatus::PARTIALLY_REFUNDED,
                'provider_response' => array_merge($payment->provider_response ?? [], [
                    'refund_transaction_id' => $transaction->id,
                    'refund_amount' => $refundAmount,
                    'refunded_at' => now()->toISOString(),
                ]),
            ]);

            Log::info('Wallet payment refunded', [
                'payment_id' => $payment->id,
                'user_id' => $user->id,
                'original_amount' => $payment->amount,
                'refund_amount' => $refundAmount,
                'refund_transaction_id' => $transaction->id,
            ]);

            return [
                'success' => true,
                'message' => 'Remboursement effectué avec succès',
                'refund_id' => $transaction->id,
                'refund_amount' => $refundAmount,
            ];

        } catch (\Exception $e) {
            Log::error('Wallet refund failed', [
                'payment_id' => $payment->id,
                'refund_amount' => $refundAmount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'refund_id' => null,
            ];
        }
    }

    public function getPaymentMethods(): array
    {
        return [
            PaymentMethod::WALLET->value => [
                'name' => 'Portefeuille électronique',
                'description' => 'Paiement instantané depuis votre portefeuille',
                'icon' => 'wallet',
                'instant' => true,
                'requires_pin' => true,
                'min_amount' => 50,
                'max_amount' => 500000,
                'currency' => 'XOF',
            ],
        ];
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function getRequiredFields(): array
    {
        return [
            'pin' => [
                'type' => 'password',
                'label' => 'Code PIN',
                'placeholder' => 'Entrez votre code PIN',
                'required' => true,
                'min_length' => 4,
                'max_length' => 6,
                'pattern' => '[0-9]{4,6}',
            ],
        ];
    }

    public function validatePaymentData(array $data): array
    {
        $errors = [];

        if (! isset($data['user_id']) || ! is_numeric($data['user_id'])) {
            $errors[] = 'ID utilisateur requis';
        }

        if (! isset($data['amount']) || ! is_numeric($data['amount']) || $data['amount'] <= 0) {
            $errors[] = 'Montant invalide';
        }

        if (isset($data['amount']) && $data['amount'] < 50) {
            $errors[] = 'Le montant minimum est de 50 XOF';
        }

        if (isset($data['amount']) && $data['amount'] > 500000) {
            $errors[] = 'Le montant maximum est de 500 000 XOF';
        }

        return $errors;
    }

    private function getStatusMessage(PaymentStatus $status): string
    {
        return match ($status) {
            PaymentStatus::PENDING => 'Paiement en attente de confirmation',
            PaymentStatus::PROCESSING => 'Paiement en cours de traitement',
            PaymentStatus::COMPLETED => 'Paiement effectué avec succès',
            PaymentStatus::FAILED => 'Paiement échoué',
            PaymentStatus::CANCELLED => 'Paiement annulé',
            PaymentStatus::REFUNDED => 'Paiement remboursé',
            PaymentStatus::PARTIALLY_REFUNDED => 'Paiement partiellement remboursé',
            default => 'Statut inconnu',
        };
    }
}
