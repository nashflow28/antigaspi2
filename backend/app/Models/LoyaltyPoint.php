<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPoint extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'points',
        'earned_from',
        'reference_id',
        'description',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'reference_id' => 'integer',
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($loyaltyPoint) {
            $loyaltyPoint->created_at = now();
        });
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('earned_from', $type);
    }

    // Helper methods
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at < now();
    }
}
