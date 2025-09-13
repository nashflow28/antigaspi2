<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'quantity_reserved',
        'total_amount',
        'status',
        'reservation_code',
        'reserved_at',
        'confirmed_at',
        'expires_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_reserved' => 'integer',
            'total_amount' => 'decimal:2',
            'reserved_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($reservation) {
            if (empty($reservation->reservation_code)) {
                $reservation->reservation_code = 'RES' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
            }
            if (empty($reservation->expires_at)) {
                $reservation->expires_at = now()->addHours(24);
            }
        });
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now())
                    ->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByMerchant($query, $merchantId)
    {
        return $query->whereHas('product', function ($q) use ($merchantId) {
            $q->where('merchant_id', $merchantId);
        });
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isExpired(): bool
    {
        return $this->expires_at < now() && !in_array($this->status, ['completed', 'cancelled']);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed']) && !$this->isExpired();
    }

    public function confirm(): bool
    {
        if ($this->isPending() && !$this->isExpired()) {
            $this->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);
            return true;
        }
        return false;
    }

    public function complete(): bool
    {
        if ($this->isConfirmed()) {
            $this->update(['status' => 'completed']);
            return true;
        }
        return false;
    }

    public function cancel(): bool
    {
        if ($this->canBeCancelled()) {
            $this->update(['status' => 'cancelled']);
            $this->product->increment('quantity_available', $this->quantity_reserved);
            return true;
        }
        return false;
    }

    public function getTimeUntilExpirationAttribute(): string
    {
        if ($this->isExpired()) {
            return 'Expiré';
        }

        $diff = now()->diff($this->expires_at);

        if ($diff->h > 0) {
            return $diff->h . 'h ' . $diff->i . 'min';
        }

        return $diff->i . 'min';
    }
}