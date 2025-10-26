<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'quantity_reserved',
        'total_amount',
        'status',
        'payment_status',
        'latest_payment_id',
        'reservation_code',
        'reserved_at',
        'expires_at',
        'pickup_date',
        'pickup_time',
        'notes',
        'merchant_notes',
        'confirmed_at',
        'ready_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_reserved' => 'integer',
            'total_amount' => 'decimal:2',
            'payment_status' => PaymentStatus::class,
            'latest_payment_id' => 'integer',
            'reserved_at' => 'datetime',
            'expires_at' => 'datetime',
            'pickup_date' => 'date',
            'pickup_time' => 'datetime:H:i',
            'confirmed_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($reservation) {
            // 🐛 BUG FIX #30: Auto-generate reservation_code if not set
            if (empty($reservation->reservation_code)) {
                $reservation->reservation_code = self::generateReservationCode();
            }

            if (empty($reservation->payment_status)) {
                $reservation->payment_status = PaymentStatus::PENDING;
            }
        });
    }

    /**
     * Generate a unique reservation code
     * Format: RES-YYYYMMDD-XXXXX
     */
    private static function generateReservationCode(): string
    {
        do {
            $date = now()->format('Ymd');
            $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));
            $code = "RES-{$date}-{$random}";
        } while (self::where('reservation_code', $code)->exists());

        return $code;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'latest_payment_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByMerchant($query, $merchantId)
    {
        return $query->whereHas('product', function ($q) use ($merchantId) {
            $q->where('merchant_id', $merchantId);
        });
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed']);
    }

    public function confirm(): bool
    {
        if ($this->isPending()) {
            $this->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'payment_status' => $this->payment_status ?? PaymentStatus::SUCCESS,
            ]);
            return true;
        }
        return false;
    }

    public function complete(): bool
    {
        if ($this->isConfirmed() || $this->isReady()) {
            $this->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            return true;
        }
        return false;
    }

    public function cancel(): bool
    {
        if ($this->canBeCancelled()) {
            $this->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'payment_status' => PaymentStatus::FAILED,
            ]);
            $this->product->increment('quantity_available', $this->quantity_reserved);
            return true;
        }
        return false;
    }

    public function markPaymentStatus(PaymentStatus $status): void
    {
        $attributes = ['payment_status' => $status];

        if ($status === PaymentStatus::SUCCESS && $this->isPending()) {
            $attributes['status'] = 'confirmed';
            $attributes['confirmed_at'] = now();
        }

        if ($status === PaymentStatus::FAILED && $this->canBeCancelled()) {
            $attributes['status'] = 'cancelled';
            $attributes['cancelled_at'] = now();
        }

        $this->fill($attributes)->save();
    }
}
