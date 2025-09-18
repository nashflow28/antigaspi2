<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'review_id',
        'reported_by',
        'reason',
        'description',
        'status',
        'reviewed_by',
        'admin_notes',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    // Relationships
    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReviewed($query)
    {
        return $query->whereIn('status', ['reviewed', 'resolved', 'dismissed']);
    }

    public function scopeByReason($query, $reason)
    {
        return $query->where('reason', $reason);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // Accessors
    public function getReasonLabelAttribute()
    {
        $reasons = [
            'inappropriate_content' => 'Contenu inapproprié',
            'spam' => 'Spam',
            'fake_review' => 'Faux avis',
            'offensive_language' => 'Langage offensant',
            'harassment' => 'Harcèlement',
            'copyright_violation' => 'Violation de droits d\'auteur',
            'other' => 'Autre'
        ];

        return $reasons[$this->reason] ?? 'Inconnu';
    }

    public function getStatusLabelAttribute()
    {
        $statuses = [
            'pending' => 'En attente',
            'reviewed' => 'Examiné',
            'resolved' => 'Résolu',
            'dismissed' => 'Rejeté'
        ];

        return $statuses[$this->status] ?? 'Inconnu';
    }

    public function getTimeAgoAttribute()
    {
        return $this->created_at->diffForHumans();
    }

    // Helper methods
    public function markAsReviewed(User $admin, string $notes = null): void
    {
        $this->update([
            'status' => 'reviewed',
            'reviewed_by' => $admin->id,
            'admin_notes' => $notes,
            'reviewed_at' => now(),
        ]);
    }

    public function markAsResolved(User $admin, string $notes = null): void
    {
        $this->update([
            'status' => 'resolved',
            'reviewed_by' => $admin->id,
            'admin_notes' => $notes,
            'reviewed_at' => now(),
        ]);
    }

    public function markAsDismissed(User $admin, string $notes = null): void
    {
        $this->update([
            'status' => 'dismissed',
            'reviewed_by' => $admin->id,
            'admin_notes' => $notes,
            'reviewed_at' => now(),
        ]);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'dismissed']);
    }
}