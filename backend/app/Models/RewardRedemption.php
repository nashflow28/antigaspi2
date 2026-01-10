<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RewardRedemption extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reward_id',
        'points_spent',
        'redemption_code',
        'status',
        'used_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'points_spent' => 'integer',
            'used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeUsed($query)
    {
        return $query->where('status', 'used');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    // Helpers
    public static function generateRedemptionCode(): string
    {
        do {
            $code = 'RWD-'.strtoupper(Str::random(12));
        } while (self::where('redemption_code', $code)->exists());

        return $code;
    }

    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return true;
        }

        return false;
    }

    public function isUsable(): bool
    {
        return $this->status === 'pending' && ! $this->isExpired();
    }

    public function markAsUsed(): bool
    {
        if (! $this->isUsable()) {
            return false;
        }

        $this->update([
            'status' => 'used',
            'used_at' => now(),
        ]);

        return true;
    }

    public function markAsExpired(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update(['status' => 'expired']);

        return true;
    }
}
