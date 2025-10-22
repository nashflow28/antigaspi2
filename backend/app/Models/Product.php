<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Scout\Attributes\SearchUsingPrefix;
use Laravel\Scout\Searchable;

class Product extends Model
{
    use HasFactory;
    use Searchable;

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
            'original_price' => 'decimal:2',
            'discounted_price' => 'decimal:2',
            'quantity_available' => 'integer',
            'low_stock_threshold' => 'integer',
            'last_low_stock_alert_at' => 'datetime',
            'expiration_date' => 'date',
            'is_active' => 'boolean',
            'is_surprise_basket' => 'boolean',
            'min_items' => 'integer',
            'max_items' => 'integer',
            'total_original_value' => 'decimal:2',
        ];
    }

    #[SearchUsingPrefix(['name', 'merchant_name'])]
    public function toSearchableArray(): array
    {
        $this->loadMissing(['merchant.user', 'category']);

        $reservationsCount = $this->reservations_count ?? $this->reservations()->count();
        $favoritesCount = $this->favorites_count ?? $this->favorites()->count();
        $averageRating = $this->reviews_avg_rating ?? $this->reviews()->avg('rating');

        return [
            'id' => $this->getKey(),
            'name' => $this->name,
            'description' => $this->description,
            'merchant_name' => $this->merchant?->business_name,
            'merchant_city' => $this->merchant?->user?->city,
            'category' => $this->category?->name,
            'price' => (float) $this->discounted_price,
            'is_surprise_basket' => (bool) $this->is_surprise_basket,
            'is_active' => (bool) $this->is_active,
            'expiration_date' => optional($this->expiration_date)->format('Y-m-d'),
            'popularity' => (int) ($reservationsCount + $favoritesCount),
            'rating' => $averageRating ? round((float) $averageRating, 2) : null,
        ];
    }

    public function searchableAs(): string
    {
        return config('scout.prefix').'products';
    }

    public function searchableWith(): array
    {
        return ['merchant.user', 'category'];
    }

    public function makeAllSearchableUsing($query)
    {
        return $query->with(['merchant.user', 'category'])
            ->withCount(['reservations', 'favorites'])
            ->withAvg('reviews', 'rating');
    }

    public function shouldBeSearchable(): bool
    {
        return (bool) $this->is_active && ($this->quantity_available ?? 0) > 0;
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
}