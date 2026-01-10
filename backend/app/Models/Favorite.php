<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'product_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Scopes
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    // Helper methods
    public static function toggle($userId, $productId): bool
    {
        return DB::transaction(function () use ($userId, $productId) {
            // Utilise lockForUpdate() pour éviter les race conditions
            $favorite = self::where('user_id', $userId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($favorite) {
                $favorite->delete();

                return false; // Removed from favorites
            } else {
                self::create([
                    'user_id' => $userId,
                    'product_id' => $productId,
                ]);

                return true; // Added to favorites
            }
        });
    }

    public static function isFavorite($userId, $productId): bool
    {
        return self::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }
}
