<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Scout\Searchable;

class Product extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'merchant_id',
        'category_id',
        'name',
        'description',
        'original_price',
        'discounted_price',
        'quantity_available',
        'low_stock_threshold',
        'last_low_stock_alert_at',
        'expiration_date',
        'image_url',
        'is_active',
        'is_surprise_basket',
        'min_items',
        'max_items',
        'total_original_value',
        'surprise_description',
    ];

    protected function casts(): array
    {
        return [
            'merchant_id' => 'integer',
            'category_id' => 'integer',
            'original_price' => 'float',
            'discounted_price' => 'float',
            'quantity_available' => 'integer',
            'low_stock_threshold' => 'integer',
            'last_low_stock_alert_at' => 'datetime',
            'expiration_date' => 'date',
            'is_active' => 'boolean',
            'is_surprise_basket' => 'boolean',
            'min_items' => 'integer',
            'max_items' => 'integer',
            'total_original_value' => 'float',
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

    public function surpriseBasketItems(): HasMany
    {
        return $this->hasMany(SurpriseBasketItem::class, 'surprise_basket_id');
    }

    public function basketItems(): HasMany
    {
        return $this->hasMany(SurpriseBasketItem::class, 'product_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('quantity_available', '>', 0)
                    ->where(function ($q) {
                        $q->where('expiration_date', '>=', now()->toDateString())
                          ->orWhereNull('expiration_date');
                    });
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

    public function scopeSurpriseBaskets($query)
    {
        return $query->where('is_surprise_basket', true);
    }

    public function scopeRegularProducts($query)
    {
        return $query->where('is_surprise_basket', false);
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
        // 🐛 BUG FIX #66: Products without expiration_date (surprise baskets) never expire
        // Without this check, PHP treats null < 'YYYY-MM-DD' as true, incorrectly marking them as expired
        if ($this->expiration_date === null) {
            return false;
        }

        // Compare Carbon dates properly instead of comparing object with string
        // Use startOfDay() to ignore time component and only compare dates
        return $this->expiration_date->startOfDay()->lt(now()->startOfDay());
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

    public function isLowStock(): bool
    {
        $threshold = $this->low_stock_threshold ?? 0;

        if ($threshold <= 0) {
            return false;
        }

        return $this->quantity_available <= $threshold;
    }

    public function scopeLowStock($query)
    {
        return $query->where('low_stock_threshold', '>', 0)
            ->whereColumn('quantity_available', '<=', 'low_stock_threshold');
    }

    // Surprise Basket helper methods
    public function getBasketItemsCountAttribute(): int
    {
        return $this->surpriseBasketItems()->count();
    }

    public function getBasketTotalValueAttribute(): float
    {
        return $this->surpriseBasketItems()->sum('unit_price');
    }

    public function getBasketSavingsAttribute(): float
    {
        return $this->total_original_value - $this->discounted_price;
    }

    public function getBasketDiscountPercentageAttribute(): int
    {
        if ($this->total_original_value <= 0) {
            return 0;
        }
        return round((($this->total_original_value - $this->discounted_price) / $this->total_original_value) * 100);
    }

    public function addItemToBasket(Product $product, int $quantity = 1): bool
    {
        if (!$this->is_surprise_basket) {
            return false;
        }

        $basketItem = $this->surpriseBasketItems()->where('product_id', $product->id)->first();

        if ($basketItem) {
            $basketItem->increment('quantity', $quantity);
        } else {
            $this->surpriseBasketItems()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price' => $product->discounted_price,
            ]);
        }

        $this->updateBasketTotalValue();
        return true;
    }

    public function removeItemFromBasket(Product $product): bool
    {
        if (!$this->is_surprise_basket) {
            return false;
        }

        $this->surpriseBasketItems()->where('product_id', $product->id)->delete();
        $this->updateBasketTotalValue();
        return true;
    }

    private function updateBasketTotalValue(): void
    {
        $totalValue = $this->surpriseBasketItems()
            ->with('product')
            ->get()
            ->sum(function ($item) {
                return $item->quantity * $item->product->original_price;
            });

        $this->update(['total_original_value' => $totalValue]);
    }

    // BUG FIX #28: Use null-safe operator to prevent errors if merchant relation not loaded
    // Scout Search Methods
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'merchant_name' => $this->merchant?->business_name ?? '',
            'category' => $this->category->name ?? '',
            'merchant_city' => $this->merchant?->user?->city ?? '',
            'price' => (float) $this->discounted_price,
            'is_active' => $this->is_active,
            'is_surprise_basket' => $this->is_surprise_basket,
        ];
    }

    public function searchableAs(): string
    {
        return 'products_index';
    }

    public function shouldBeSearchable(): bool
    {
        return $this->is_active && $this->quantity_available > 0 && !$this->isExpired();
    }
}
