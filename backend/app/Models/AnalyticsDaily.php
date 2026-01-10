<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsDaily extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'analytics_daily';

    protected $fillable = [
        'date',
        'merchant_id',
        'total_reservations',
        'total_revenue',
        'products_saved_from_waste',
        'new_users',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_reservations' => 'integer',
            'total_revenue' => 'decimal:2',
            'products_saved_from_waste' => 'integer',
            'new_users' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($analytics) {
            $analytics->created_at = now();
        });
    }

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    // Scopes
    public function scopeGlobal($query)
    {
        return $query->whereNull('merchant_id');
    }

    public function scopeForMerchant($query, $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeLastDays($query, $days = 7)
    {
        return $query->where('date', '>=', now()->subDays($days)->toDateString());
    }
}
