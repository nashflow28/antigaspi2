<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'payment_id',
        'type',
        'amount',
        'description',
        'reference',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    // Relationships
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    // Scopes
    public function scopeCredits($query)
    {
        return $query->where('type', 'credit');
    }

    public function scopeDebits($query)
    {
        return $query->where('type', 'debit');
    }

    public function scopeRecentFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function scopeForWallet($query, int $walletId)
    {
        return $query->where('wallet_id', $walletId);
    }

    // Attributes
    public function getIsCreditsAttribute(): bool
    {
        return $this->type === 'credit';
    }

    public function getIsDebitAttribute(): bool
    {
        return $this->type === 'debit';
    }

    public function getFormattedAmountAttribute(): string
    {
        $sign = $this->is_credit ? '+' : '-';

        return $sign.number_format($this->amount, 0, ',', ' ').' XOF';
    }

    public function getTypeIconAttribute(): string
    {
        return match ($this->type) {
            'credit' => 'arrow-up',
            'debit' => 'arrow-down',
            default => 'question-mark',
        };
    }

    public function getTypeColorAttribute(): string
    {
        return match ($this->type) {
            'credit' => 'green',
            'debit' => 'red',
            default => 'gray',
        };
    }

    // Helper methods
    public function getPreviousBalance(): ?float
    {
        return $this->metadata['previous_balance'] ?? null;
    }

    public function getNewBalance(): ?float
    {
        return $this->metadata['new_balance'] ?? null;
    }

    public function getRelatedPayment(): ?Payment
    {
        return $this->payment;
    }
}
