<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Searchable;

class Merchant extends Model
{
    use HasFactory;
    use Searchable;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_type',
        'category_id',
        'photo_url',
        'description',
        'siret',
        'latitude',
        'longitude',
        'opening_hours',
        'is_verified',
        'verification_date',
        'total_sales',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'opening_hours' => 'array',
            'is_verified' => 'boolean',
            'verification_date' => 'datetime',
            'total_sales' => 'decimal:2',
        ];
    }

    #[SearchUsingFullText(['business_name', 'description'])]
    public function toSearchableArray(): array
    {
        $this->loadMissing(['user', 'category']);

        $productsCount = $this->products_count ?? $this->products()->count();
        $averageRating = $this->reviews_avg_rating ?? $this->reviews()->avg('rating');

        return [
            'id' => $this->getKey(),
            'business_name' => $this->business_name,
            'business_type' => $this->business_type,
            'description' => $this->description,
            'category' => $this->category?->name,
            'city' => $this->user?->city,
            'address' => $this->user?->address,
            'is_verified' => (bool) $this->is_verified,
            'avg_rating' => $averageRating ? round((float) $averageRating, 2) : null,
            'total_products' => $productsCount,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
        ];
    }

    public function searchableAs(): string
    {
        return config('scout.prefix').'merchants';
    }

    public function searchableWith(): array
    {
        return ['user', 'category'];
    }

    public function makeAllSearchableUsing($query)
    {
        return $query->with(['user', 'category'])
            ->withCount('products')
            ->withAvg('reviews', 'rating');
    }

    public function shouldBeSearchable(): bool
    {
        return (bool) $this->is_verified;
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function analyticsDaily(): HasMany
    {
        return $this->hasMany(AnalyticsDaily::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function lowStockProducts(): HasMany
    {
        return $this->products()->lowStock();
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeNearby($query, $latitude, $longitude, $radiusKm = 10)
    {
        return $query->selectRaw("
            merchants.*,
            (6371 * acos(cos(radians(?))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(?))
                + sin(radians(?))
                * sin(radians(latitude)))) AS distance
        ", [$latitude, $longitude, $latitude])
        ->having('distance', '<', $radiusKm)
        ->orderBy('distance');
    }

    // Helper methods
    public function getFullAddressAttribute(): string
    {
        return $this->user->address . ', ' . $this->user->city;
    }

    public function getTotalProductsAttribute(): int
    {
        return $this->products()->count();
    }

    public function getAverageRatingAttribute(): ?float
    {
        // Calculate average rating from product reviews since reviews table
        // doesn't have merchant_id in current database schema
        $productIds = $this->products()->pluck('id');
        if ($productIds->isEmpty()) {
            return null;
        }
        return \App\Models\Review::whereIn('product_id', $productIds)->avg('rating');
    }
}