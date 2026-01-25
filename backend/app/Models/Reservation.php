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
        'order_id',
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

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
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

    /**
     * Cancel the reservation and refund wallet if applicable
     * BUG-008 FIX: Throws exception if wallet refund fails (instead of silent failure)
     *
     * @throws \Exception If wallet refund fails
     */
    public function cancel(): bool
    {
        if ($this->canBeCancelled()) {
            // BUG-008 FIX: Refund wallet payment - now throws exception on failure
            $this->refundWalletPaymentIfApplicable();

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

    /**
     * Refund payment to wallet if applicable
     * Handles: wallet payments (direct refund) and Mobile Money payments (credit to wallet)
     * BUG-008 FIX: Now throws exception on refund failure instead of silent logging
     *
     * @throws \Exception If refund fails for any reason
     */
    protected function refundWalletPaymentIfApplicable(): void
    {
        // Get the latest successful payment for this reservation (wallet, flooz, or tmoney)
        $successfulPayment = $this->payments()
            ->whereIn('payment_method', ['wallet', 'flooz', 'tmoney'])
            ->where('status', PaymentStatus::SUCCESS)
            ->latest()
            ->first();

        if (! $successfulPayment) {
            return; // No refundable payment - OK to proceed (on_site payments are not refunded)
        }

        $user = $this->user;
        if (! $user) {
            \Log::error('BUG-008: Cannot refund - user not found', ['reservation_id' => $this->id]);
            throw new \Exception('Impossible de rembourser: utilisateur non trouvé. Contactez le support.');
        }

        try {
            $walletService = app(\App\Services\WalletService::class);
            $refundAmount = (float) $successfulPayment->amount;
            $paymentMethod = $successfulPayment->payment_method->value ?? $successfulPayment->payment_method;

            // Different description based on original payment method
            if ($paymentMethod === 'wallet') {
                $description = "Remboursement réservation #{$this->reservation_code}";
            } else {
                // For Mobile Money (flooz/tmoney), credit to wallet with clear description
                $methodName = strtoupper($paymentMethod);
                $description = "Remboursement {$methodName} → Wallet - Réservation #{$this->reservation_code}";
            }

            $walletService->refundWallet($user, $refundAmount, $description);

            // Mark the original payment as refunded
            $successfulPayment->update(['status' => PaymentStatus::REFUNDED]);

            \Log::info('Payment refund processed successfully', [
                'reservation_id' => $this->id,
                'user_id' => $user->id,
                'amount' => $refundAmount,
                'original_payment_method' => $paymentMethod,
                'payment_id' => $successfulPayment->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('BUG-008: Payment refund failed - blocking cancellation', [
                'reservation_id' => $this->id,
                'user_id' => $user->id,
                'amount' => $successfulPayment->amount,
                'payment_method' => $successfulPayment->payment_method,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception(
                'Échec du remboursement: '.$e->getMessage().
                '. L\'annulation a été bloquée. Contactez le support.'
            );
        }
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
