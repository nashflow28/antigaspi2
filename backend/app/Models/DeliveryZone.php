<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'city',
        'base_fee',
        'price_per_km',
        'min_order_amount',
        'max_distance_km',
        'is_active',
        'polygon',
    ];

    protected $casts = [
        'base_fee' => 'decimal:2',
        'price_per_km' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_distance_km' => 'decimal:2',
        'is_active' => 'boolean',
        'polygon' => 'array',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function drivers(): HasMany
    {
        return $this->hasMany(DeliveryDriver::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInCity($query, string $city)
    {
        return $query->where('city', $city);
    }

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Calculate delivery fee for a given distance
     */
    public function calculateFee(float $distanceKm): float
    {
        return $this->base_fee + ($distanceKm * $this->price_per_km);
    }

    /**
     * Check if distance is within zone limits
     */
    public function isWithinRange(float $distanceKm): bool
    {
        return $distanceKm <= $this->max_distance_km;
    }

    /**
     * Check if order amount meets minimum requirement
     */
    public function meetsMinimumOrder(float $amount): bool
    {
        return $amount >= $this->min_order_amount;
    }
}
