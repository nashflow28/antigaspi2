<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function __construct(private readonly AdminAuditService $auditService) {}

    /**
     * Display a listing of the users.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::select([
                'id',
                'email',
                'first_name',
                'last_name',
                'phone',
                'role',
                'is_active',
                'created_at',
                'updated_at',
            ]);

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
            }

            // 🐛 BUG FIX #22: Handle "all" status explicitly to avoid filtering
            // Previous bug: $request->status === 'active' returns false for "all" → forces where('is_active', false)
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $isActive = $request->status === 'active';
                $query->where('is_active', $isActive);
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            // Transform data for frontend
            $transformedUsers = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name.' '.$user->last_name),
                    'email' => $user->email,
                    'phone' => $user->phone ?? 'Non renseigné',
                    'role' => $user->role,
                    'status' => $user->is_active ? 'active' : 'suspended',
                    'avatar' => 'https://ui-avatars.com/api/?name='.urlencode($user->first_name.'+'.$user->last_name).'&background=10B981&color=fff',
                    'created_at' => $user->created_at ? $user->created_at->toISOString() : now()->toISOString(),
                    'last_activity' => $user->updated_at ? $user->updated_at->toISOString() : now()->toISOString(),
                ];
            });

            // Calculate stats
            $stats = [
                'totalUsers' => $users->count(),
                'consumers' => $users->where('role', 'consumer')->count(),
                'merchants' => $users->where('role', 'merchant')->count(),
                'suspended' => $users->where('is_active', false)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $transformedUsers,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Suspend a user.
     */
    public function suspend(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ], [
            'reason.required' => 'La raison de la suspension est obligatoire',
            'reason.min' => 'La raison doit contenir au moins 10 caractères',
            'reason.max' => 'La raison ne peut pas dépasser 1000 caractères',
        ]);

        try {
            DB::beginTransaction();

            $user = User::findOrFail($id);
            $adminId = Auth::id();

            // Vérifier que l'utilisateur n'est pas un admin
            if ($user->role === 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de suspendre un administrateur',
                ], 403);
            }

            // Mettre à jour l'utilisateur
            $user->is_active = false;

            // Ajouter les champs d'audit si ils existent
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspension_reason')) {
                $user->suspension_reason = $data['reason'];
            }
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspended_at')) {
                $user->suspended_at = now();
            }
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspended_by')) {
                $user->suspended_by = $adminId;
            }

            $user->save();

            // Logger l'action dans l'audit trail
            $this->auditService->logUserSuspension($user, $data['reason']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur suspendu avec succès',
                'data' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name.' '.$user->last_name),
                    'email' => $user->email,
                    'is_active' => false,
                    'suspension_reason' => $data['reason'],
                    'suspended_at' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suspension de l\'utilisateur',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Unsuspend a user.
     */
    public function unsuspend(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = User::findOrFail($id);

            // Mettre à jour l'utilisateur
            $user->is_active = true;

            // Effacer les champs de suspension si ils existent
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspension_reason')) {
                $user->suspension_reason = null;
            }
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspended_at')) {
                $user->suspended_at = null;
            }
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspended_by')) {
                $user->suspended_by = null;
            }

            $user->save();

            // Logger l'action dans l'audit trail
            $this->auditService->logUserUnsuspension($user);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur réactivé avec succès',
                'data' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name.' '.$user->last_name),
                    'email' => $user->email,
                    'is_active' => true,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réactivation de l\'utilisateur',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Get user details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $data = [
                'id' => $user->id,
                'name' => trim($user->first_name.' '.$user->last_name),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone ?? 'Non renseigné',
                'role' => $user->role,
                'is_active' => $user->is_active,
                'status' => $user->is_active ? 'active' : 'suspended',
                'avatar' => 'https://ui-avatars.com/api/?name='.urlencode($user->first_name.'+'.$user->last_name).'&background=10B981&color=fff',
                'created_at' => $user->created_at?->toISOString(),
                'updated_at' => $user->updated_at?->toISOString(),
            ];

            // Ajouter les infos de suspension si disponibles
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspension_reason') && $user->suspension_reason) {
                $data['suspension_reason'] = $user->suspension_reason;
            }
            if ($user->getConnection()->getSchemaBuilder()->hasColumn('users', 'suspended_at') && $user->suspended_at) {
                $data['suspended_at'] = $user->suspended_at;
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 404);
        }
    }
}
