<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Payment;
use App\Models\WalletTransaction;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletService
{
    public function createWallet(User $user, array $data = []): Wallet
    {
        return $user->wallet()->create([
            'currency' => $data['currency'] ?? 'XOF',
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

        $wallet = $this->getOrCreateWallet($user);

        if (!$wallet->is_active) {
            throw new \Exception('Le portefeuille est désactivé');
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

        $wallet = $this->getOrCreateWallet($user);

        if (!$wallet->is_active) {
            throw new \Exception('Le portefeuille est désactivé');
        }

        if ($wallet->hasPin() && !$wallet->verifyPin($pin ?? '')) {
            throw new \Exception('Code PIN incorrect');
        }

        if (!$wallet->hasBalance($amount)) {
            throw new \Exception('Solde insuffisant dans le portefeuille');
        }

        if (!$wallet->canSpend($amount)) {
            throw new \Exception('Limite de dépense quotidienne dépassée');
        }

        return DB::transaction(function () use ($wallet, $amount, $description) {
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

        if (!ctype_digit($pin)) {
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

        if (!$wallet->hasPin()) {
            throw new \Exception('Aucun code PIN configuré');
        }

        if (!$wallet->verifyPin($currentPin)) {
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

    public function transferBetweenWallets(User $sender, User $receiver, float $amount, string $description = 'Transfert entre portefeuilles'): array
    {
        if ($sender->id === $receiver->id) {
            throw new \InvalidArgumentException('Impossible de transférer vers son propre portefeuille');
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Le montant de transfert doit être supérieur à zéro');
        }

        $senderWallet = $this->getOrCreateWallet($sender);
        $receiverWallet = $this->getOrCreateWallet($receiver);

        if (!$senderWallet->is_active || !$receiverWallet->is_active) {
            throw new \Exception('L\'un des portefeuilles est désactivé');
        }

        return DB::transaction(function () use ($senderWallet, $receiverWallet, $amount, $description, $sender, $receiver) {
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