<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'consumer_id',
        'merchant_id',
        'archived_by_consumer',
        'archived_by_merchant',
        'last_message_at',
        'last_message_preview',
    ];

    protected $casts = [
        'archived_by_consumer' => 'boolean',
        'archived_by_merchant' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($subQuery) use ($user) {
            $subQuery
                ->where('consumer_id', $user->id)
                ->orWhere('merchant_id', $user->id);
        });
    }
}
