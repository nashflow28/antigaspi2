<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'device_id',
        'device_name',
        'device_model',
        'device_brand',
        'device_type',
        'os_version',
        'app_version',
        'push_token',
        'otp_verified_at',
        'last_login_at',
        'is_active',
        'ip_address',
    ];

    protected $casts = [
        'otp_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns this device
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if OTP verification is still valid (within 30 days)
     */
    public function isOtpVerificationValid(): bool
    {
        if (! $this->otp_verified_at) {
            return false;
        }

        return $this->otp_verified_at->addDays(30)->isFuture();
    }

    /**
     * Check if this device requires OTP verification
     */
    public function requiresOtp(): bool
    {
        return ! $this->isOtpVerificationValid();
    }

    /**
     * Mark OTP as verified for this device
     */
    public function markOtpVerified(): void
    {
        $this->update([
            'otp_verified_at' => now(),
            'last_login_at' => now(),
            'is_active' => true,
        ]);
    }

    /**
     * Update last login timestamp
     */
    public function touchLastLogin(): void
    {
        $this->update([
            'last_login_at' => now(),
        ]);
    }

    /**
     * Deactivate this device session
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
        ]);
    }

    /**
     * Scope for active devices only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for devices belonging to a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
