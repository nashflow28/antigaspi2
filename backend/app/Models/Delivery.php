<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'driver_id',
        'delivery_zone_id',
        'delivery_code',
        'status',
        'pickup_address',
        'pickup_latitude',
        'pickup_longitude',
        'pickup_instructions',
        'delivery_address',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_instructions',
        'recipient_name',
        'recipient_phone',
        'delivery_fee',
        'driver_commission',
        'platform_commission',
        'distance_km',
        'estimated_duration_min',
        'assigned_at',
        'picked_up_at',
        'delivered_at',
        'cancelled_at',
        'estimated_pickup_at',
        'estimated_delivery_at',
        'cancellation_reason',
        'cancelled_by',
        'failure_reason',
        'driver_notes',
        'consumer_rating',
        'consumer_feedback',
        'merchant_rating',
        'delivery_photo_url',
        'signature_url',
    ];

    protected $casts = [
        'pickup_latitude' => 'decimal:8',
        'pickup_longitude' => 'decimal:8',
        'delivery_latitude' => 'decimal:8',
        'delivery_longitude' => 'decimal:8',
        'delivery_fee' => 'decimal:2',
        'driver_commission' => 'decimal:2',
        'platform_commission' => 'decimal:2',
        'distance_km' => 'decimal:2',
        'estimated_duration_min' => 'integer',
        'assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'estimated_pickup_at' => 'datetime',
        'estimated_delivery_at' => 'datetime',
        'consumer_rating' => 'integer',
        'merchant_rating' => 'integer',
    ];

    protected $appends = ['status_label', 'can_cancel'];

    // Status constants
    const STATUS_PENDING = 'pending';

    const STATUS_SEARCHING = 'searching';

    const STATUS_ASSIGNED = 'assigned';

    const STATUS_PICKING_UP = 'picking_up';

    const STATUS_PICKED_UP = 'picked_up';

    const STATUS_DELIVERING = 'delivering';

    const STATUS_DELIVERED = 'delivered';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_FAILED = 'failed';

    const STATUS_LABELS = [
        'pending' => 'En attente',
        'searching' => 'Recherche livreur',
        'assigned' => 'Livreur assigné',
        'picking_up' => 'Récupération en cours',
        'picked_up' => 'Colis récupéré',
        'delivering' => 'Livraison en cours',
        'delivered' => 'Livré',
        'cancelled' => 'Annulé',
        'failed' => 'Échec',
    ];

    // =========================================================================
    // BOOT
    // =========================================================================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($delivery) {
            if (empty($delivery->delivery_code)) {
                $delivery->delivery_code = self::generateDeliveryCode();
            }
        });
    }

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class, 'delivery_zone_id');
    }

    public function trackingHistory(): HasMany
    {
        return $this->hasMany(DeliveryTracking::class)->orderBy('recorded_at', 'desc');
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function getCanCancelAttribute(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_SEARCHING,
            self::STATUS_ASSIGNED,
        ]);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [
            self::STATUS_DELIVERED,
            self::STATUS_CANCELLED,
            self::STATUS_FAILED,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    public function scopeForDriver($query, int $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    public function scopeAvailableForDrivers($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_SEARCHING])
            ->whereNull('driver_id');
    }

    // =========================================================================
    // STATIC METHODS
    // =========================================================================

    public static function generateDeliveryCode(): string
    {
        do {
            $code = 'DL'.strtoupper(Str::random(8));
        } while (self::where('delivery_code', $code)->exists());

        return $code;
    }

    // =========================================================================
    // STATUS METHODS
    // =========================================================================

    public function assignDriver(DeliveryDriver $driver): bool
    {
        if (! in_array($this->status, [self::STATUS_PENDING, self::STATUS_SEARCHING])) {
            return false;
        }

        $this->update([
            'driver_id' => $driver->id,
            'status' => self::STATUS_ASSIGNED,
            'assigned_at' => now(),
        ]);

        return true;
    }

    public function markAsPickingUp(): bool
    {
        if ($this->status !== self::STATUS_ASSIGNED) {
            return false;
        }

        $this->update(['status' => self::STATUS_PICKING_UP]);

        return true;
    }

    public function markAsPickedUp(): bool
    {
        if ($this->status !== self::STATUS_PICKING_UP) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_PICKED_UP,
            'picked_up_at' => now(),
        ]);

        return true;
    }

    public function markAsDelivering(): bool
    {
        if ($this->status !== self::STATUS_PICKED_UP) {
            return false;
        }

        $this->update(['status' => self::STATUS_DELIVERING]);

        return true;
    }

    public function markAsDelivered(?string $photoUrl = null, ?string $signatureUrl = null): bool
    {
        if (! in_array($this->status, [self::STATUS_PICKED_UP, self::STATUS_DELIVERING])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
            'delivery_photo_url' => $photoUrl,
            'signature_url' => $signatureUrl,
        ]);

        // Update driver stats
        if ($this->driver) {
            $this->driver->updateStats($this->driver_commission);

            // Record earning
            DriverEarning::create([
                'driver_id' => $this->driver_id,
                'delivery_id' => $this->id,
                'type' => 'delivery',
                'amount' => $this->driver_commission,
                'description' => "Livraison {$this->delivery_code}",
            ]);
        }

        return true;
    }

    public function cancel(string $reason, string $cancelledBy): bool
    {
        if (! $this->can_cancel) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
            'cancelled_by' => $cancelledBy,
        ]);

        // Make driver available again
        if ($this->driver) {
            $this->driver->update(['is_available' => true]);
        }

        return true;
    }

    public function markAsFailed(string $reason): bool
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
        ]);

        // Make driver available again
        if ($this->driver) {
            $this->driver->update(['is_available' => true]);
        }

        return true;
    }

    // =========================================================================
    // RATING METHODS
    // =========================================================================

    public function rateByConsumer(int $rating, ?string $feedback = null): void
    {
        $this->update([
            'consumer_rating' => $rating,
            'consumer_feedback' => $feedback,
        ]);

        // Update driver's average rating
        if ($this->driver) {
            $avgRating = Delivery::where('driver_id', $this->driver_id)
                ->whereNotNull('consumer_rating')
                ->avg('consumer_rating');

            $this->driver->update(['rating' => round($avgRating, 2)]);
        }
    }

    // =========================================================================
    // TRACKING METHODS
    // =========================================================================

    public function getLatestPosition(): ?DeliveryTracking
    {
        return $this->trackingHistory()->first();
    }

    public function recordPosition(float $lat, float $lng, ?float $speed = null, ?float $heading = null): DeliveryTracking
    {
        return DeliveryTracking::create([
            'delivery_id' => $this->id,
            'driver_id' => $this->driver_id,
            'latitude' => $lat,
            'longitude' => $lng,
            'speed' => $speed,
            'heading' => $heading,
        ]);
    }
}
