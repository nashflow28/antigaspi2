<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryDriver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'vehicle_plate',
        'license_number',
        'is_available',
        'is_verified',
        'is_active',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'delivery_zone_id',
        'rating',
        'total_deliveries',
        'total_earnings',
        'id_card_url',
        'license_url',
        'photo_url',
        'verified_at',
        'verified_by',
        'rejection_reason',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'current_latitude' => 'decimal:8',
        'current_longitude' => 'decimal:8',
        'last_location_update' => 'datetime',
        'rating' => 'decimal:2',
        'total_deliveries' => 'integer',
        'total_earnings' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    protected $appends = ['full_name', 'is_online'];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class, 'delivery_zone_id');
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'driver_id');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(DriverEarning::class, 'driver_id');
    }

    public function trackingHistory(): HasMany
    {
        return $this->hasMany(DeliveryTracking::class, 'driver_id');
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    public function getFullNameAttribute(): string
    {
        return $this->user ? $this->user->first_name.' '.$this->user->last_name : '';
    }

    public function getIsOnlineAttribute(): bool
    {
        if (! $this->last_location_update) {
            return false;
        }

        // Consider online if location updated in last 5 minutes
        return $this->last_location_update->diffInMinutes(now()) < 5;
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->where('is_verified', true)
            ->where('is_active', true);
    }

    public function scopeOnline($query)
    {
        return $query->where('last_location_update', '>=', now()->subMinutes(5));
    }

    public function scopeInZone($query, int $zoneId)
    {
        return $query->where('delivery_zone_id', $zoneId);
    }

    public function scopeNearby($query, float $lat, float $lng, float $radiusKm = 5)
    {
        // Haversine formula for finding nearby drivers
        return $query->selectRaw('
            *,
            (6371 * acos(
                cos(radians(?)) * cos(radians(current_latitude)) *
                cos(radians(current_longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(current_latitude))
            )) AS distance
        ', [$lat, $lng, $lat])
            ->having('distance', '<', $radiusKm)
            ->orderBy('distance');
    }

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Update driver's current location
     */
    public function updateLocation(float $lat, float $lng): void
    {
        $this->update([
            'current_latitude' => $lat,
            'current_longitude' => $lng,
            'last_location_update' => now(),
        ]);
    }

    /**
     * Toggle availability
     */
    public function toggleAvailability(): bool
    {
        $this->is_available = ! $this->is_available;
        $this->save();

        return $this->is_available;
    }

    /**
     * Get active delivery if any
     */
    public function getActiveDelivery(): ?Delivery
    {
        return $this->deliveries()
            ->whereNotIn('status', ['delivered', 'cancelled', 'failed'])
            ->first();
    }

    /**
     * Check if driver can accept new deliveries
     */
    public function canAcceptDelivery(): bool
    {
        return $this->is_available
            && $this->is_verified
            && $this->is_active
            && $this->getActiveDelivery() === null;
    }

    /**
     * Calculate earnings for a period
     */
    public function getEarningsForPeriod(string $period = 'today'): float
    {
        $query = $this->earnings()->where('type', 'delivery');

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
                break;
        }

        return $query->sum('amount');
    }

    /**
     * Get delivery count for a period
     */
    public function getDeliveryCountForPeriod(string $period = 'today'): int
    {
        $query = $this->deliveries()->where('status', 'delivered');

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
                break;
        }

        return $query->count();
    }

    /**
     * Update statistics after completing a delivery
     */
    public function updateStats(float $commission): void
    {
        $this->increment('total_deliveries');
        $this->increment('total_earnings', $commission);

        // Recalculate rating
        $avgRating = $this->deliveries()
            ->whereNotNull('consumer_rating')
            ->avg('consumer_rating');

        if ($avgRating) {
            $this->update(['rating' => round($avgRating, 2)]);
        }
    }
}
