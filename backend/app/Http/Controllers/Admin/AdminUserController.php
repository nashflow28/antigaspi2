<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
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
                'updated_at'
            ]);

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
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
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'phone' => $user->phone ?? 'Non renseigné',
                    'role' => $user->role,
                    'status' => $user->is_active ? 'active' : 'suspended',
                    'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($user->first_name . '+' . $user->last_name) . "&background=10B981&color=fff",
                    'created_at' => $user->created_at ? $user->created_at->toISOString() : now()->toISOString(),
                    'last_activity' => $user->updated_at ? $user->updated_at->toISOString() : now()->toISOString()
                ];
            });

            // Calculate stats
            $stats = [
                'totalUsers' => $users->count(),
                'consumers' => $users->where('role', 'consumer')->count(),
                'merchants' => $users->where('role', 'merchant')->count(),
                'suspended' => $users->where('is_active', false)->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $transformedUsers,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Suspend a user.
     */
    public function suspend(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->is_active = false;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur suspendu avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suspension de l\'utilisateur'
            ], 500);
        }
    }

    /**
     * Unsuspend a user.
     */
    public function unsuspend(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->is_active = true;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur réactivé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réactivation de l\'utilisateur'
            ], 500);
        }
    }
}