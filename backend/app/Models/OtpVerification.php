<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone',
        'otp',
        'purpose',
        'attempts',
        'expires_at',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Scope for valid (non-expired, non-verified) OTPs
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
            ->whereNull('verified_at');
    }

    /**
     * Scope for specific phone number
     */
    public function scopeForPhone($query, string $phone)
    {
        return $query->where('phone', $phone);
    }

    /**
     * Scope for specific purpose
     */
    public function scopeForPurpose($query, string $purpose)
    {
        return $query->where('purpose', $purpose);
    }

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->lt(now());
    }

    /**
     * Check if OTP is verified
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * Check if max attempts reached
     */
    public function hasMaxAttempts(int $maxAttempts = 3): bool
    {
        return $this->attempts >= $maxAttempts;
    }
}
