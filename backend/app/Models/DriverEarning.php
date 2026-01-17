<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverEarning extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'driver_id',
        'delivery_id',
        'type',
        'amount',
        'description',
        'status',
        'processed_at',
        'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // Type constants
    const TYPE_DELIVERY = 'delivery';

    const TYPE_BONUS = 'bonus';

    const TYPE_TIP = 'tip';

    const TYPE_ADJUSTMENT = 'adjustment';

    const TYPE_WITHDRAWAL = 'withdrawal';

    // Status constants
    const STATUS_PENDING = 'pending';

    const STATUS_COMPLETED = 'completed';

    const STATUS_FAILED = 'failed';

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    // =========================================================================
    // BOOT
    // =========================================================================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($earning) {
            if (empty($earning->created_at)) {
                $earning->created_at = now();
            }
        });
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeDeliveries($query)
    {
        return $query->where('type', self::TYPE_DELIVERY);
    }

    public function scopeWithdrawals($query)
    {
        return $query->where('type', self::TYPE_WITHDRAWAL);
    }

    public function scopeForPeriod($query, string $period)
    {
        switch ($period) {
            case 'today':
                return $query->whereDate('created_at', today());
            case 'week':
                return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            case 'month':
                return $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
            default:
                return $query;
        }
    }

    // =========================================================================
    // STATIC METHODS
    // =========================================================================

    /**
     * Create withdrawal request
     */
    public static function createWithdrawal(int $driverId, float $amount, ?string $description = null): self
    {
        return self::create([
            'driver_id' => $driverId,
            'type' => self::TYPE_WITHDRAWAL,
            'amount' => -abs($amount), // Negative for withdrawal
            'description' => $description ?? 'Retrait',
            'status' => self::STATUS_PENDING,
        ]);
    }

    /**
     * Add bonus to driver
     */
    public static function addBonus(int $driverId, float $amount, string $description): self
    {
        return self::create([
            'driver_id' => $driverId,
            'type' => self::TYPE_BONUS,
            'amount' => $amount,
            'description' => $description,
        ]);
    }

    /**
     * Add tip to driver
     */
    public static function addTip(int $driverId, int $deliveryId, float $amount): self
    {
        return self::create([
            'driver_id' => $driverId,
            'delivery_id' => $deliveryId,
            'type' => self::TYPE_TIP,
            'amount' => $amount,
            'description' => 'Pourboire client',
        ]);
    }
}
