<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * SurpriseBasket Model - A Product with is_surprise_basket = true
 *
 * This model extends Product and automatically filters for surprise baskets only.
 * Used for type safety in tests and controllers that work specifically with surprise baskets.
 */
class SurpriseBasket extends Product
{
    use HasFactory;

    /**
     * The table associated with the model.
     * SurpriseBasket uses the products table.
     */
    protected $table = 'products';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // Apply global scope to only return surprise baskets
        static::addGlobalScope('surprise_basket', function (Builder $builder) {
            $builder->where('is_surprise_basket', true);
        });

        // When creating a new SurpriseBasket, ensure is_surprise_basket is true
        static::creating(function ($model) {
            $model->is_surprise_basket = true;
        });
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory()
    {
        return \Database\Factories\SurpriseBasketFactory::new();
    }

    /**
     * Get the items in this surprise basket.
     */
    public function items()
    {
        return $this->hasMany(SurpriseBasketItem::class, 'surprise_basket_id');
    }

    /**
     * Get the products in this surprise basket through the pivot table.
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'surprise_basket_items', 'surprise_basket_id', 'product_id')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    /**
     * Calculate the discount percentage.
     */
    public function getDiscountPercentageAttribute(): int
    {
        if (!$this->original_price || $this->original_price <= 0) {
            return 0;
        }

        $discount = (($this->original_price - $this->discounted_price) / $this->original_price) * 100;

        return (int) round($discount);
    }
}
