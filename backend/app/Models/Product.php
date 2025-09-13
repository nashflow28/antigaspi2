<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'category_id',
        'name',
        'description',
        'original_price',
        'discounted_price',
        'quantity_available',
        'expiration_date',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'original_price' => 'decimal:2',
            'discounted_price' => 'decimal:2',
            'quantity_available' => 'integer',
            'expiration_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('quantity_available', '>', 0)
                    ->where('expiration_date', '>=', now()->toDateString());
    }

    public function scopeExpiringSoon($query, $days = 2)
    {
        return $query->where('expiration_date', '<=', now()->addDays($days)->toDateString())
                    ->where('expiration_date', '>=', now()->toDateString());
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByMerchant($query, $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopePriceRange($query, $minPrice = null, $maxPrice = null)
    {
        if ($minPrice) {
            $query->where('discounted_price', '>=', $minPrice);
        }
        if ($maxPrice) {
            $query->where('discounted_price', '<=', $maxPrice);
        }
        return $query;
    }

    // Helper methods
    public function getDiscountPercentageAttribute(): int
    {
        if ($this->original_price <= 0) {
            return 0;
        }

        return round((($this->original_price - $this->discounted_price) / $this->original_price) * 100);
    }

    public function getSavingsAttribute(): float
    {
        return $this->original_price - $this->discounted_price;
    }

    public function getDaysUntilExpirationAttribute(): int
    {
        return now()->diffInDays($this->expiration_date, false);
    }

    public function isExpired(): bool
    {
        return $this->expiration_date < now()->toDateString();
    }

    public function isExpiringSoon($days = 2): bool
    {
        return $this->getDaysUntilExpirationAttribute() <= $days && !$this->isExpired();
    }

    public function decrementQuantity(int $quantity): bool
    {
        if ($this->quantity_available >= $quantity) {
            $this->decrement('quantity_available', $quantity);
            return true;
        }
        return false;
    }
}