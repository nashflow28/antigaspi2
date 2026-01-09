<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'currency',
        'is_active',
        'pin_hash',
        'daily_limit',
        'daily_spent',
        'daily_spent_date',
        'last_transaction_at',
        'pin_attempts',
        'pin_locked_until',
    ];

    const MAX_PIN_ATTEMPTS = 5;
    const PIN_LOCK_MINUTES = 30;

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'daily_limit' => 'decimal:2',
            'daily_spent' => 'decimal:2',
            'daily_spent_date' => 'date',
            'last_transaction_at' => 'datetime',
            'is_active' => 'boolean',
            'pin_attempts' => 'integer',
            'pin_locked_until' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function creditTransactions(): HasMany
    {
        return $this->transactions()->where('type', 'credit');
    }

    public function debitTransactions(): HasMany
    {
        return $this->transactions()->where('type', 'debit');
    }

    // Wallet operations
    public function credit(float $amount, string $description, ?Payment $payment = null): WalletTransaction
    {
        $this->increment('balance', $amount);
        $this->update(['last_transaction_at' => now()]);

        return $this->transactions()->create([
            'payment_id' => $payment?->id,
            'type' => 'credit',
            'amount' => $amount,
            'description' => $description,
            'reference' => 'CR_' . Str::upper(Str::random(10)),
            'metadata' => [
                'payment_id' => $payment?->id,
                'previous_balance' => $this->balance - $amount,
                'new_balance' => $this->balance,
            ],
        ]);
    }

    public function debit(float $amount, string $description, ?Payment $payment = null): WalletTransaction
    {
        if (!$this->hasBalance($amount)) {
            throw new \Exception('Insufficient wallet balance');
        }

        if (!$this->canSpend($amount)) {
            throw new \Exception('Daily spending limit exceeded');
        }

        $this->decrement('balance', $amount);
        $this->updateDailySpent($amount);
        $this->update(['last_transaction_at' => now()]);

        return $this->transactions()->create([
            'payment_id' => $payment?->id,
            'type' => 'debit',
            'amount' => $amount,
            'description' => $description,
            'reference' => 'DB_' . Str::upper(Str::random(10)),
            'metadata' => [
                'payment_id' => $payment?->id,
                'previous_balance' => $this->balance + $amount,
                'new_balance' => $this->balance,
            ],
        ]);
    }

    // Balance checks
    public function hasBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    public function canSpend(float $amount): bool
    {
        $this->resetDailySpentIfNeeded();
        return ($this->daily_spent + $amount) <= $this->daily_limit;
    }

    // PIN management
    public function setPin(string $pin): void
    {
        $this->update(['pin_hash' => Hash::make($pin)]);
    }

    public function verifyPin(string $pin): bool
    {
        // SEC-002 FIX: Rate limiting on PIN attempts
        if ($this->isPinLocked()) {
            throw new \Exception('Wallet PIN is locked. Try again later.');
        }

        if (!$this->pin_hash) {
            return false;
        }

        if (Hash::check($pin, $this->pin_hash)) {
            // Reset attempts on success
            $this->update(['pin_attempts' => 0, 'pin_locked_until' => null]);
            return true;
        }

        // Increment failed attempts
        $attempts = ($this->pin_attempts ?? 0) + 1;
        $updateData = ['pin_attempts' => $attempts];

        if ($attempts >= self::MAX_PIN_ATTEMPTS) {
            $updateData['pin_locked_until'] = now()->addMinutes(self::PIN_LOCK_MINUTES);
        }

        $this->update($updateData);
        return false;
    }

    public function isPinLocked(): bool
    {
        return $this->pin_locked_until && $this->pin_locked_until->isFuture();
    }

    public function getRemainingLockMinutes(): ?int
    {
        if (!$this->isPinLocked()) {
            return null;
        }
        return (int) now()->diffInMinutes($this->pin_locked_until, false);
    }

    public function hasPin(): bool
    {
        return !is_null($this->pin_hash);
    }

    // Daily spending management
    private function updateDailySpent(float $amount): void
    {
        $this->resetDailySpentIfNeeded();
        $this->increment('daily_spent', $amount);
        $this->update(['daily_spent_date' => now()->toDateString()]);
    }

    private function resetDailySpentIfNeeded(): void
    {
        // BUG-001 FIX: Reset if date is any day before today (not just yesterday)
        if (!$this->daily_spent_date || $this->daily_spent_date->lt(now()->startOfDay())) {
            $this->update([
                'daily_spent' => 0,
                'daily_spent_date' => now()->toDateString(),
            ]);
        }
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithPositiveBalance($query)
    {
        return $query->where('balance', '>', 0);
    }

    // Attributes
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->balance, 0, ',', ' ') . ' ' . $this->currency;
    }

    public function getRemainingDailyLimitAttribute(): float
    {
        $this->resetDailySpentIfNeeded();
        return max(0, $this->daily_limit - $this->daily_spent);
    }
}