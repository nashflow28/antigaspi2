<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reward extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'points_required',
        'type',
        'value',
        'value_type',
        'quantity_available',
        'quantity_redeemed',
        'valid_from',
        'valid_until',
        'tier_required',
        'is_active',
        'is_featured',
        'merchant_id',
    ];

    protected function casts(): array
    {
        return [
            'points_required' => 'integer',
            'value' => 'decimal:2',
            'quantity_available' => 'integer',
            'quantity_redeemed' => 'integer',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('quantity_available')
                    ->orWhereRaw('quantity_available > quantity_redeemed');
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeForTier($query, string $tier)
    {
        $tierOrder = ['bronze' => 1, 'silver' => 2, 'gold' => 3, 'platinum' => 4];
        $userTierLevel = $tierOrder[$tier] ?? 1;

        return $query->where(function ($q) use ($tierOrder, $userTierLevel) {
            $q->whereNull('tier_required');
            foreach ($tierOrder as $tierName => $level) {
                if ($level <= $userTierLevel) {
                    $q->orWhere('tier_required', $tierName);
                }
            }
        });
    }

    // Helpers
    public function isAvailable(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->valid_from && $this->valid_from->isFuture()) {
            return false;
        }
        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }
        if ($this->quantity_available !== null && $this->quantity_redeemed >= $this->quantity_available) {
            return false;
        }

        return true;
    }

    public function getRemainingQuantityAttribute(): ?int
    {
        if ($this->quantity_available === null) {
            return null;
        }

        return max(0, $this->quantity_available - $this->quantity_redeemed);
    }

    public function getFormattedValueAttribute(): string
    {
        if ($this->value_type === 'percentage') {
            return $this->value.'%';
        }

        return number_format($this->value, 0, ',', ' ').' XOF';
    }
}
