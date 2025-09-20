<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurpriseBasketItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'surprise_basket_id',
        'product_id',
        'quantity',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
        ];
    }

    // Relationships
    public function surpriseBasket(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'surprise_basket_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Helper methods
    public function getTotalPriceAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}