<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Services\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    public function __construct(private readonly AdminAuditService $auditService)
    {
    }

    /**
     * Obtenir l'historique des actions admin
     * GET /api/admin/audit
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ], 403);
        }

        $filters = [
            'action' => $request->input('action'),
            'entity_type' => $request->input('entity_type'),
            'admin_id' => $request->input('admin_id'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'search' => $request->input('search'),
        ];

        $perPage = $request->integer('per_page', 20);
        $logs = $this->auditService->getHistory($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Obtenir les statistiques d'audit
     * GET /api/admin/audit/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ], 403);
        }

        $period = $request->input('period', 'week');
        $stats = $this->auditService->getStats($period);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Obtenir le détail d'une action
     * GET /api/admin/audit/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ], 403);
        }

        $log = AdminAuditLog::with('admin:id,first_name,last_name,email')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Action non trouvée',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }

    /**
     * Obtenir les actions disponibles pour les filtres
     * GET /api/admin/audit/actions
     */
    public function getAvailableActions(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ], 403);
        }

        $actions = [
            ['value' => AdminAuditLog::ACTION_APPROVE_MERCHANT, 'label' => 'Approbation commerçant'],
            ['value' => AdminAuditLog::ACTION_REJECT_MERCHANT, 'label' => 'Rejet commerçant'],
            ['value' => AdminAuditLog::ACTION_APPROVE_PRODUCT, 'label' => 'Approbation produit'],
            ['value' => AdminAuditLog::ACTION_REJECT_PRODUCT, 'label' => 'Rejet produit'],
            ['value' => AdminAuditLog::ACTION_SUSPEND_USER, 'label' => 'Suspension utilisateur'],
            ['value' => AdminAuditLog::ACTION_UNSUSPEND_USER, 'label' => 'Réactivation utilisateur'],
            ['value' => AdminAuditLog::ACTION_APPROVE_REVIEW, 'label' => 'Approbation avis'],
            ['value' => AdminAuditLog::ACTION_REJECT_REVIEW, 'label' => 'Rejet avis'],
            ['value' => AdminAuditLog::ACTION_RESOLVE_REPORT, 'label' => 'Résolution signalement'],
            ['value' => AdminAuditLog::ACTION_CREATE_CATEGORY, 'label' => 'Création catégorie'],
            ['value' => AdminAuditLog::ACTION_UPDATE_CATEGORY, 'label' => 'Modification catégorie'],
            ['value' => AdminAuditLog::ACTION_DELETE_CATEGORY, 'label' => 'Suppression catégorie'],
            ['value' => AdminAuditLog::ACTION_BROADCAST_NOTIFICATION, 'label' => 'Envoi notification'],
            ['value' => AdminAuditLog::ACTION_UPDATE_SETTINGS, 'label' => 'Modification paramètres'],
            ['value' => AdminAuditLog::ACTION_AWARD_POINTS, 'label' => 'Attribution points'],
        ];

        $entityTypes = [
            ['value' => AdminAuditLog::ENTITY_MERCHANT, 'label' => 'Commerçant'],
            ['value' => AdminAuditLog::ENTITY_PRODUCT, 'label' => 'Produit'],
            ['value' => AdminAuditLog::ENTITY_USER, 'label' => 'Utilisateur'],
            ['value' => AdminAuditLog::ENTITY_REVIEW, 'label' => 'Avis'],
            ['value' => AdminAuditLog::ENTITY_REPORT, 'label' => 'Signalement'],
            ['value' => AdminAuditLog::ENTITY_CATEGORY, 'label' => 'Catégorie'],
            ['value' => AdminAuditLog::ENTITY_NOTIFICATION, 'label' => 'Notification'],
            ['value' => AdminAuditLog::ENTITY_SETTINGS, 'label' => 'Paramètres'],
            ['value' => AdminAuditLog::ENTITY_LOYALTY, 'label' => 'Points fidélité'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'actions' => $actions,
                'entity_types' => $entityTypes,
            ],
        ]);
    }
}
