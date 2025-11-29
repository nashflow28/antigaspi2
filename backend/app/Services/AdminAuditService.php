<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuditService
{
    /**
     * Logger une action admin
     */
    public function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?string $entityName = null,
        ?string $reason = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null
    ): AdminAuditLog {
        $request = request();
        $admin = Auth::user();

        return AdminAuditLog::create([
            'admin_id' => $admin?->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'entity_name' => $entityName,
            'reason' => $reason,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    /**
     * Logger l'approbation d'un commerçant
     */
    public function logMerchantApproval(Model $merchant, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_APPROVE_MERCHANT,
            AdminAuditLog::ENTITY_MERCHANT,
            $merchant->id,
            $merchant->business_name ?? "Merchant #{$merchant->id}",
            $reason,
            ['is_verified' => false],
            ['is_verified' => true, 'verified_at' => now()->toIso8601String()]
        );
    }

    /**
     * Logger le rejet d'un commerçant
     */
    public function logMerchantRejection(Model $merchant, string $reason): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_REJECT_MERCHANT,
            AdminAuditLog::ENTITY_MERCHANT,
            $merchant->id,
            $merchant->business_name ?? "Merchant #{$merchant->id}",
            $reason,
            ['is_verified' => $merchant->is_verified],
            ['is_verified' => false, 'rejection_reason' => $reason]
        );
    }

    /**
     * Logger l'approbation d'un produit
     */
    public function logProductApproval(Model $product, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_APPROVE_PRODUCT,
            AdminAuditLog::ENTITY_PRODUCT,
            $product->id,
            $product->name ?? "Product #{$product->id}",
            $reason,
            ['moderation_status' => $product->moderation_status ?? 'pending'],
            ['moderation_status' => 'approved', 'approved_at' => now()->toIso8601String()]
        );
    }

    /**
     * Logger le rejet d'un produit
     */
    public function logProductRejection(Model $product, string $reason): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_REJECT_PRODUCT,
            AdminAuditLog::ENTITY_PRODUCT,
            $product->id,
            $product->name ?? "Product #{$product->id}",
            $reason,
            ['moderation_status' => $product->moderation_status ?? 'pending', 'is_active' => $product->is_active],
            ['moderation_status' => 'rejected', 'is_active' => false, 'rejection_reason' => $reason]
        );
    }

    /**
     * Logger la suspension d'un utilisateur
     */
    public function logUserSuspension(User $user, string $reason): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_SUSPEND_USER,
            AdminAuditLog::ENTITY_USER,
            $user->id,
            "{$user->first_name} {$user->last_name} ({$user->email})",
            $reason,
            ['is_active' => true],
            ['is_active' => false, 'suspension_reason' => $reason, 'suspended_at' => now()->toIso8601String()]
        );
    }

    /**
     * Logger la réactivation d'un utilisateur
     */
    public function logUserUnsuspension(User $user, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_UNSUSPEND_USER,
            AdminAuditLog::ENTITY_USER,
            $user->id,
            "{$user->first_name} {$user->last_name} ({$user->email})",
            $reason,
            ['is_active' => false],
            ['is_active' => true, 'suspended_at' => null]
        );
    }

    /**
     * Logger l'approbation d'un avis
     */
    public function logReviewApproval(Model $review): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_APPROVE_REVIEW,
            AdminAuditLog::ENTITY_REVIEW,
            $review->id,
            "Review #{$review->id}",
            null,
            ['is_approved' => false],
            ['is_approved' => true]
        );
    }

    /**
     * Logger le rejet d'un avis
     */
    public function logReviewRejection(Model $review, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_REJECT_REVIEW,
            AdminAuditLog::ENTITY_REVIEW,
            $review->id,
            "Review #{$review->id}",
            $reason,
            ['id' => $review->id],
            ['deleted' => true]
        );
    }

    /**
     * Logger la résolution d'un signalement
     */
    public function logReportResolution(Model $report, string $resolution, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_RESOLVE_REPORT,
            AdminAuditLog::ENTITY_REPORT,
            $report->id,
            "Report #{$report->id}",
            $reason,
            ['status' => $report->status ?? 'pending'],
            ['status' => 'resolved', 'resolution' => $resolution],
            ['resolution_type' => $resolution]
        );
    }

    /**
     * Logger la création d'une catégorie
     */
    public function logCategoryCreation(Model $category): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_CREATE_CATEGORY,
            AdminAuditLog::ENTITY_CATEGORY,
            $category->id,
            $category->name,
            null,
            null,
            $category->toArray()
        );
    }

    /**
     * Logger la modification d'une catégorie
     */
    public function logCategoryUpdate(Model $category, array $oldValues): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_UPDATE_CATEGORY,
            AdminAuditLog::ENTITY_CATEGORY,
            $category->id,
            $category->name,
            null,
            $oldValues,
            $category->toArray()
        );
    }

    /**
     * Logger la suppression d'une catégorie
     */
    public function logCategoryDeletion(Model $category): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_DELETE_CATEGORY,
            AdminAuditLog::ENTITY_CATEGORY,
            $category->id,
            $category->name,
            null,
            $category->toArray(),
            ['deleted' => true]
        );
    }

    /**
     * Logger l'envoi d'une notification broadcast
     */
    public function logBroadcastNotification(string $title, array $channels, array $roles, int $recipientCount): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_BROADCAST_NOTIFICATION,
            AdminAuditLog::ENTITY_NOTIFICATION,
            null,
            $title,
            null,
            null,
            [
                'title' => $title,
                'channels' => $channels,
                'roles' => $roles,
                'recipient_count' => $recipientCount,
            ]
        );
    }

    /**
     * Logger la modification des paramètres système
     */
    public function logSettingsUpdate(array $oldSettings, array $newSettings): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_UPDATE_SETTINGS,
            AdminAuditLog::ENTITY_SETTINGS,
            null,
            'System Settings',
            null,
            $oldSettings,
            $newSettings
        );
    }

    /**
     * Logger l'attribution de points de fidélité
     */
    public function logPointsAward(User $user, int $points, string $reason): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_AWARD_POINTS,
            AdminAuditLog::ENTITY_LOYALTY,
            $user->id,
            "{$user->first_name} {$user->last_name}",
            $reason,
            null,
            ['points_awarded' => $points, 'reason' => $reason]
        );
    }

    /**
     * Logger la résolution d'une réservation
     */
    public function logReservationResolution(Model $reservation, string $resolution, ?string $reason = null): AdminAuditLog
    {
        return $this->log(
            AdminAuditLog::ACTION_RESOLVE_RESERVATION,
            AdminAuditLog::ENTITY_RESERVATION,
            $reservation->id,
            "Reservation #{$reservation->reservation_code ?? $reservation->id}",
            $reason,
            ['status' => $reservation->status],
            ['status' => 'resolved', 'resolution' => $resolution]
        );
    }

    /**
     * Obtenir l'historique des actions admin avec pagination
     */
    public function getHistory(array $filters = [], int $perPage = 20)
    {
        $query = AdminAuditLog::with('admin:id,first_name,last_name,email')
            ->orderByDesc('created_at');

        // Filtres
        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (!empty($filters['admin_id'])) {
            $query->where('admin_id', $filters['admin_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('entity_name', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        return $query->paginate(min($perPage, 100));
    }

    /**
     * Obtenir les statistiques d'audit
     */
    public function getStats(string $period = 'week'): array
    {
        $startDate = match($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfWeek(),
        };

        $logs = AdminAuditLog::where('created_at', '>=', $startDate)->get();

        return [
            'total_actions' => $logs->count(),
            'by_action' => $logs->groupBy('action')->map->count(),
            'by_entity' => $logs->groupBy('entity_type')->map->count(),
            'by_admin' => $logs->groupBy('admin_id')->map->count(),
            'period' => $period,
            'start_date' => $startDate->toIso8601String(),
        ];
    }
}
