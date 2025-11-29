<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'action',
        'entity_type',
        'entity_id',
        'entity_name',
        'reason',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Actions disponibles pour l'audit
     */
    public const ACTION_APPROVE_MERCHANT = 'approve_merchant';
    public const ACTION_REJECT_MERCHANT = 'reject_merchant';
    public const ACTION_APPROVE_PRODUCT = 'approve_product';
    public const ACTION_REJECT_PRODUCT = 'reject_product';
    public const ACTION_SUSPEND_USER = 'suspend_user';
    public const ACTION_UNSUSPEND_USER = 'unsuspend_user';
    public const ACTION_APPROVE_REVIEW = 'approve_review';
    public const ACTION_REJECT_REVIEW = 'reject_review';
    public const ACTION_RESOLVE_REPORT = 'resolve_report';
    public const ACTION_CREATE_CATEGORY = 'create_category';
    public const ACTION_UPDATE_CATEGORY = 'update_category';
    public const ACTION_DELETE_CATEGORY = 'delete_category';
    public const ACTION_BROADCAST_NOTIFICATION = 'broadcast_notification';
    public const ACTION_UPDATE_SETTINGS = 'update_settings';
    public const ACTION_AWARD_POINTS = 'award_points';
    public const ACTION_RESOLVE_RESERVATION = 'resolve_reservation';

    /**
     * Types d'entités
     */
    public const ENTITY_MERCHANT = 'merchant';
    public const ENTITY_PRODUCT = 'product';
    public const ENTITY_USER = 'user';
    public const ENTITY_REVIEW = 'review';
    public const ENTITY_REPORT = 'report';
    public const ENTITY_CATEGORY = 'category';
    public const ENTITY_NOTIFICATION = 'notification';
    public const ENTITY_SETTINGS = 'settings';
    public const ENTITY_LOYALTY = 'loyalty';
    public const ENTITY_RESERVATION = 'reservation';

    /**
     * Relation avec l'admin qui a effectué l'action
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Scope pour filtrer par action
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope pour filtrer par type d'entité
     */
    public function scopeEntityType($query, string $type)
    {
        return $query->where('entity_type', $type);
    }

    /**
     * Scope pour filtrer par admin
     */
    public function scopeByAdmin($query, int $adminId)
    {
        return $query->where('admin_id', $adminId);
    }

    /**
     * Scope pour filtrer par période
     */
    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Obtenir le libellé de l'action en français
     */
    public function getActionLabelAttribute(): string
    {
        return match($this->action) {
            self::ACTION_APPROVE_MERCHANT => 'Approbation commerçant',
            self::ACTION_REJECT_MERCHANT => 'Rejet commerçant',
            self::ACTION_APPROVE_PRODUCT => 'Approbation produit',
            self::ACTION_REJECT_PRODUCT => 'Rejet produit',
            self::ACTION_SUSPEND_USER => 'Suspension utilisateur',
            self::ACTION_UNSUSPEND_USER => 'Réactivation utilisateur',
            self::ACTION_APPROVE_REVIEW => 'Approbation avis',
            self::ACTION_REJECT_REVIEW => 'Rejet avis',
            self::ACTION_RESOLVE_REPORT => 'Résolution signalement',
            self::ACTION_CREATE_CATEGORY => 'Création catégorie',
            self::ACTION_UPDATE_CATEGORY => 'Modification catégorie',
            self::ACTION_DELETE_CATEGORY => 'Suppression catégorie',
            self::ACTION_BROADCAST_NOTIFICATION => 'Envoi notification',
            self::ACTION_UPDATE_SETTINGS => 'Modification paramètres',
            self::ACTION_AWARD_POINTS => 'Attribution points fidélité',
            self::ACTION_RESOLVE_RESERVATION => 'Résolution réservation',
            default => $this->action,
        };
    }

    /**
     * Obtenir le libellé du type d'entité en français
     */
    public function getEntityTypeLabelAttribute(): string
    {
        return match($this->entity_type) {
            self::ENTITY_MERCHANT => 'Commerçant',
            self::ENTITY_PRODUCT => 'Produit',
            self::ENTITY_USER => 'Utilisateur',
            self::ENTITY_REVIEW => 'Avis',
            self::ENTITY_REPORT => 'Signalement',
            self::ENTITY_CATEGORY => 'Catégorie',
            self::ENTITY_NOTIFICATION => 'Notification',
            self::ENTITY_SETTINGS => 'Paramètres',
            self::ENTITY_LOYALTY => 'Points fidélité',
            self::ENTITY_RESERVATION => 'Réservation',
            default => $this->entity_type,
        };
    }
}
