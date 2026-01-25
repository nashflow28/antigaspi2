<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'amount',
        'currency',
        'payment_method',
        'transaction_id',
        'status',
        'provider',
        'checkout_url',
        'customer_phone',
        'customer_email',
        'reference',
        'payload',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_method' => PaymentMethod::class,
        'status' => PaymentStatus::class,
        'payload' => 'array',
        'paid_at' => 'datetime',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', PaymentStatus::PENDING->value);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', PaymentStatus::SUCCESS->value);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', PaymentStatus::FAILED->value);
    }

    public function isPending(): bool
    {
        return $this->status === PaymentStatus::PENDING;
    }

    public function isSuccessful(): bool
    {
        return $this->status === PaymentStatus::SUCCESS;
    }

    public function isCompleted(): bool
    {
        return $this->isSuccessful();
    }

    public function isFailed(): bool
    {
        return $this->status === PaymentStatus::FAILED;
    }

    public function isOnSite(): bool
    {
        return $this->status === PaymentStatus::ON_SITE;
    }

    public function isRefunded(): bool
    {
        return $this->status === PaymentStatus::REFUNDED;
    }

    /**
     * Check if this payment is a wallet recharge (no associated reservation).
     */
    public function isWalletRecharge(): bool
    {
        return $this->reservation_id === null
            && isset($this->payload['type'])
            && $this->payload['type'] === 'wallet_recharge';
    }

    /**
     * Get the wallet ID for wallet recharge payments.
     */
    public function getWalletId(): ?int
    {
        if (! $this->isWalletRecharge()) {
            return null;
        }

        return $this->payload['wallet_id'] ?? null;
    }

    protected function provider(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ?? $this->payment_method?->provider(),
        );
    }
}
