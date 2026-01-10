<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletService
{
    public function createWallet(User $user, array $data = []): Wallet
    {
        // 🐛 BUG FIX #35: Enforce XOF currency only
        if (isset($data['currency']) && $data['currency'] !== 'XOF') {
            throw new \InvalidArgumentException('Seule la devise XOF est acceptée pour les portefeuilles');
        }

        return $user->wallet()->create([
            'currency' => 'XOF', // Always XOF
            'daily_limit' => $data['daily_limit'] ?? 50000.00,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function getOrCreateWallet(User $user): Wallet
    {
        return $user->wallet ?: $this->createWallet($user);
    }

    public function rechargeWallet(User $user, float $amount, string $description = 'Recharge portefeuille', ?Payment $payment = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Le montant de recharge doit être supérieur à zéro');
        }

        // 🐛 BUG FIX #35: Validate amount is reasonable (min 100 XOF, max 1,000,000 XOF)
        if ($amount < 100) {
            throw new \InvalidArgumentException('Le montant minimum de recharge est de 100 XOF');
        }

        if ($amount > 1000000) {
            throw new \InvalidArgumentException('Le montant maximum de recharge est de 1,000,000 XOF');
        }

        $wallet = $this->getOrCreateWallet($user);

        // 🐛 BUG FIX #35: Verify wallet uses XOF currency only
        if ($wallet->currency !== 'XOF') {
            throw new \Exception('Ce portefeuille n\'utilise pas la devise XOF');
        }

        if (! $wallet->is_active) {
            throw new \Exception('Le portefeuille est désactivé');
        }

        // 🐛 BUG FIX #35: Validate payment currency if payment is provided
        if ($payment && isset($payment->currency) && $payment->currency !== 'XOF') {
            throw new \InvalidArgumentException('Seule la devise XOF est acceptée pour les recharges');
        }

        return DB::transaction(function () use ($wallet, $amount, $description, $payment) {
            $transaction = $wallet->credit($amount, $description, $payment);

            Log::info('Wallet recharged', [
                'user_id' => $wallet->user_id,
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'new_balance' => $wallet->fresh()->balance,
                'transaction_id' => $transaction->id,
            ]);

            return $transaction;
        });
    }

    public function processWalletPayment(User $user, float $amount, string $description = 'Paiement commande', ?string $pin = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Le montant de paiement doit être supérieur à zéro');
        }

        // BUG-002 FIX: All checks and debit must be in atomic transaction with lock
        return DB::transaction(function () use ($user, $amount, $description, $pin) {
            // Lock the wallet row to prevent concurrent debits (pessimistic locking)
            $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();

            if (! $wallet) {
                $wallet = $this->createWallet($user);
                // Re-fetch with lock
                $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();
            }

            if (! $wallet->is_active) {
                throw new \Exception('Le portefeuille est désactivé');
            }

            if ($wallet->hasPin() && ! $wallet->verifyPin($pin ?? '')) {
                throw new \Exception('Code PIN incorrect');
            }

            if (! $wallet->hasBalance($amount)) {
                throw new \Exception('Solde insuffisant dans le portefeuille');
            }

            if (! $wallet->canSpend($amount)) {
                throw new \Exception('Limite de dépense quotidienne dépassée');
            }

            $transaction = $wallet->debit($amount, $description);

            Log::info('Wallet payment processed', [
                'user_id' => $wallet->user_id,
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'new_balance' => $wallet->fresh()->balance,
                'transaction_id' => $transaction->id,
            ]);

            return $transaction;
        });
    }

    public function setWalletPin(User $user, string $pin): void
    {
        if (strlen($pin) < 4 || strlen($pin) > 6) {
            throw new \InvalidArgumentException('Le code PIN doit contenir entre 4 et 6 chiffres');
        }

        if (! ctype_digit($pin)) {
            throw new \InvalidArgumentException('Le code PIN ne doit contenir que des chiffres');
        }

        $wallet = $this->getOrCreateWallet($user);
        $wallet->setPin($pin);

        Log::info('Wallet PIN set', [
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
        ]);
    }

    public function changeWalletPin(User $user, string $currentPin, string $newPin): void
    {
        $wallet = $this->getOrCreateWallet($user);

        if (! $wallet->hasPin()) {
            throw new \Exception('Aucun code PIN configuré');
        }

        if (! $wallet->verifyPin($currentPin)) {
            throw new \Exception('Code PIN actuel incorrect');
        }

        $this->setWalletPin($user, $newPin);
    }

    public function toggleWalletStatus(User $user, bool $isActive): Wallet
    {
        $wallet = $this->getOrCreateWallet($user);
        $wallet->update(['is_active' => $isActive]);

        Log::info('Wallet status changed', [
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'is_active' => $isActive,
        ]);

        return $wallet->fresh();
    }

    public function updateDailyLimit(User $user, float $dailyLimit): Wallet
    {
        if ($dailyLimit < 0) {
            throw new \InvalidArgumentException('La limite quotidienne ne peut pas être négative');
        }

        $wallet = $this->getOrCreateWallet($user);
        $wallet->update(['daily_limit' => $dailyLimit]);

        Log::info('Wallet daily limit updated', [
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'daily_limit' => $dailyLimit,
        ]);

        return $wallet->fresh();
    }

    public function getWalletTransactions(User $user, array $filters = [])
    {
        $wallet = $this->getOrCreateWallet($user);

        $query = $wallet->transactions()->recentFirst();

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['amount_min'])) {
            $query->where('amount', '>=', $filters['amount_min']);
        }

        if (isset($filters['amount_max'])) {
            $query->where('amount', '<=', $filters['amount_max']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->with('payment')->paginate($perPage);
    }

    public function getWalletStats(User $user, ?string $period = 'month'): array
    {
        $wallet = $this->getOrCreateWallet($user);

        $dateFilter = match ($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $transactions = $wallet->transactions()
            ->where('created_at', '>=', $dateFilter)
            ->get();

        $credits = $transactions->where('type', 'credit');
        $debits = $transactions->where('type', 'debit');

        return [
            'current_balance' => $wallet->balance,
            'daily_limit' => $wallet->daily_limit,
            'remaining_daily_limit' => $wallet->remaining_daily_limit,
            'period' => $period,
            'period_stats' => [
                'total_credits' => $credits->sum('amount'),
                'total_debits' => $debits->sum('amount'),
                'transaction_count' => $transactions->count(),
                'credit_count' => $credits->count(),
                'debit_count' => $debits->count(),
            ],
        ];
    }

    /**
     * Transfer between wallets with proper locking and PIN verification
     * BUG-010 FIX: Added lockForUpdate() to prevent race conditions
     * BUG-011 FIX: PIN verification now happens inside the transaction (atomic)
     *
     * @param  User  $sender  The user sending the money
     * @param  User  $receiver  The user receiving the money
     * @param  float  $amount  The amount to transfer
     * @param  string  $description  Optional description
     * @param  string|null  $pin  The sender's PIN (required if wallet has PIN)
     * @return array The debit and credit transactions
     *
     * @throws \Exception If transfer fails
     */
    public function transferBetweenWallets(User $sender, User $receiver, float $amount, string $description = 'Transfert entre portefeuilles', ?string $pin = null): array
    {
        if ($sender->id === $receiver->id) {
            throw new \InvalidArgumentException('Impossible de transférer vers son propre portefeuille');
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Le montant de transfert doit être supérieur à zéro');
        }

        // BUG-010 & BUG-011 FIX: All operations must be in atomic transaction with locks
        return DB::transaction(function () use ($sender, $receiver, $amount, $description, $pin) {
            // BUG-010 FIX: Lock both wallets to prevent concurrent transfers
            $senderWallet = Wallet::where('user_id', $sender->id)->lockForUpdate()->first();
            $receiverWallet = Wallet::where('user_id', $receiver->id)->lockForUpdate()->first();

            // Create wallets if they don't exist (rare case)
            if (! $senderWallet) {
                $senderWallet = $this->createWallet($sender);
                $senderWallet = Wallet::where('user_id', $sender->id)->lockForUpdate()->first();
            }
            if (! $receiverWallet) {
                $receiverWallet = $this->createWallet($receiver);
                $receiverWallet = Wallet::where('user_id', $receiver->id)->lockForUpdate()->first();
            }

            if (! $senderWallet->is_active) {
                throw new \Exception('Votre portefeuille est désactivé');
            }

            if (! $receiverWallet->is_active) {
                throw new \Exception('Le portefeuille du destinataire est désactivé');
            }

            // BUG-011 FIX: Verify PIN inside transaction (atomic with transfer)
            if ($senderWallet->hasPin()) {
                if (empty($pin)) {
                    throw new \Exception('Le code PIN est requis pour ce transfert');
                }
                if (! $senderWallet->verifyPin($pin)) {
                    throw new \Exception('Code PIN incorrect');
                }
            }

            // Verify balance
            if (! $senderWallet->hasBalance($amount)) {
                throw new \Exception('Solde insuffisant dans le portefeuille');
            }

            if (! $senderWallet->canSpend($amount)) {
                throw new \Exception('Limite de dépense quotidienne dépassée');
            }

            $debitTransaction = $senderWallet->debit($amount, "Transfert vers {$receiver->full_name}: {$description}");
            $creditTransaction = $receiverWallet->credit($amount, "Transfert de {$sender->full_name}: {$description}");

            Log::info('Wallet transfer completed', [
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'amount' => $amount,
                'debit_transaction_id' => $debitTransaction->id,
                'credit_transaction_id' => $creditTransaction->id,
            ]);

            return [
                'debit_transaction' => $debitTransaction,
                'credit_transaction' => $creditTransaction,
            ];
        });
    }
}
