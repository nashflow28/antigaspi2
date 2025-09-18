<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class RefreshToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'jti',
        'expires_at',
        'revoked',
        'device_fingerprint',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked' => 'boolean',
        ];
    }

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeValid($query)
    {
        return $query->where('revoked', false)
                    ->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeRevoked($query)
    {
        return $query->where('revoked', true);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByDevice($query, $deviceFingerprint)
    {
        return $query->where('device_fingerprint', $deviceFingerprint);
    }

    // Méthodes
    public function isValid(): bool
    {
        return !$this->revoked && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function revoke(): bool
    {
        $this->revoked = true;
        return $this->save();
    }

    public function getDeviceInfo(): array
    {
        return [
            'fingerprint' => $this->device_fingerprint,
            'ip' => $this->ip_address,
            'user_agent' => $this->user_agent,
        ];
    }

    // Méthodes statiques de nettoyage
    public static function deleteExpiredTokens(): int
    {
        return self::expired()->delete();
    }

    public static function revokeAllUserTokens(int $userId): int
    {
        return self::byUser($userId)->update(['revoked' => true]);
    }

    public static function revokeUserTokensExcept(int $userId, string $currentJti): int
    {
        return self::byUser($userId)
                  ->where('jti', '!=', $currentJti)
                  ->update(['revoked' => true]);
    }
}
