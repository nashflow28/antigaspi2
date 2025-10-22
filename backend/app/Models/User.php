<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'first_name',
        'last_name',
        'phone',
        'role',
        'city',
        'address',
        'photo_url',
        'is_active',
        'status',
        'last_login_at',
        'prefers_email_notifications',
        'prefers_sms_notifications',
        'prefers_push_notifications',
        'notification_settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'prefers_email_notifications' => 'boolean',
            'prefers_sms_notifications' => 'boolean',
            'prefers_push_notifications' => 'boolean',
            'notification_settings' => 'array',
        ];
    }

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
        ];
    }

    // Relationships
    public function merchant(): HasOne
    {
        return $this->hasOne(Merchant::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function loyaltyPoints(): HasMany
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function searchQueries(): HasMany
    {
        return $this->hasMany(SearchQuery::class);
    }

    public function conversationsAsConsumer(): HasMany
    {
        return $this->hasMany(Conversation::class, 'consumer_id');
    }

    public function conversationsAsMerchant(): HasMany
    {
        return $this->hasMany(Conversation::class, 'merchant_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    // Scopes
    public function scopeConsumers($query)
    {
        return $query->where('role', 'consumer');
    }

    public function scopeMerchants($query)
    {
        return $query->where('role', 'merchant');
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helper methods
    public function isConsumer(): bool
    {
        return $this->role === 'consumer';
    }

    public function isMerchant(): bool
    {
        return $this->role === 'merchant';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function prefersEmailNotifications(): bool
    {
        return (bool) $this->prefers_email_notifications;
    }

    public function prefersSmsNotifications(): bool
    {
        return (bool) $this->prefers_sms_notifications;
    }

    public function prefersPushNotifications(): bool
    {
        return (bool) $this->prefers_push_notifications;
    }

    // Wallet helper methods
    public function getOrCreateWallet(): Wallet
    {
        return $this->wallet ?: $this->wallet()->create([
            'currency' => 'XOF',
            'daily_limit' => 50000.00,
        ]);
    }

    public function hasWallet(): bool
    {
        return !is_null($this->wallet);
    }

    public function getWalletBalance(): float
    {
        return $this->wallet?->balance ?? 0.00;
    }
}
