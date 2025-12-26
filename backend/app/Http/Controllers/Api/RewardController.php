<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\LoyaltyPoint;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RewardController extends Controller
{
    /**
     * Get available rewards for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tier = $user->loyalty_tier ?? 'bronze';

        $query = Reward::available()
            ->forTier($tier)
            ->with('merchant:id,business_name');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by merchant
        if ($request->has('merchant_id')) {
            $query->where('merchant_id', $request->merchant_id);
        }

        // Filter by affordability
        if ($request->boolean('affordable_only')) {
            $userPoints = $user->loyaltyPoints()->sum('points');
            $query->where('points_required', '<=', $userPoints);
        }

        // Featured first
        if ($request->boolean('featured_first', true)) {
            $query->orderByDesc('is_featured');
        }

        $query->orderBy('points_required');

        $rewards = $query->paginate($request->get('per_page', 20));

        // Add user context
        $userPoints = $user->loyaltyPoints()->sum('points');

        return response()->json([
            'success' => true,
            'data' => $rewards->items(),
            'meta' => [
                'current_page' => $rewards->currentPage(),
                'last_page' => $rewards->lastPage(),
                'per_page' => $rewards->perPage(),
                'total' => $rewards->total(),
            ],
            'user_context' => [
                'current_points' => $userPoints,
                'loyalty_tier' => $tier,
            ],
        ]);
    }

    /**
     * Get featured rewards
     */
    public function featured(Request $request): JsonResponse
    {
        $user = $request->user();
        $tier = $user->loyalty_tier ?? 'bronze';

        $rewards = Reward::available()
            ->forTier($tier)
            ->featured()
            ->with('merchant:id,business_name')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rewards,
        ]);
    }

    /**
     * Get a single reward
     */
    public function show(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        if (!$reward->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette récompense n\'est plus disponible',
            ], 404);
        }

        $reward->load('merchant:id,business_name,business_type');

        $userPoints = $user->loyaltyPoints()->sum('points');
        $canRedeem = $userPoints >= $reward->points_required;

        return response()->json([
            'success' => true,
            'data' => array_merge($reward->toArray(), [
                'can_redeem' => $canRedeem,
                'points_needed' => max(0, $reward->points_required - $userPoints),
            ]),
        ]);
    }

    /**
     * Redeem a reward
     */
    public function redeem(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        // Check availability
        if (!$reward->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette récompense n\'est plus disponible',
            ], 400);
        }

        // Check tier requirement
        if ($reward->tier_required) {
            $tierOrder = ['bronze' => 1, 'silver' => 2, 'gold' => 3, 'platinum' => 4];
            $userTierLevel = $tierOrder[$user->loyalty_tier ?? 'bronze'] ?? 1;
            $requiredLevel = $tierOrder[$reward->tier_required] ?? 1;

            if ($userTierLevel < $requiredLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre niveau de fidélité est insuffisant pour cette récompense',
                ], 400);
            }
        }

        // Check points
        $userPoints = $user->loyaltyPoints()->sum('points');
        if ($userPoints < $reward->points_required) {
            return response()->json([
                'success' => false,
                'message' => 'Points insuffisants. Vous avez ' . $userPoints . ' points, il en faut ' . $reward->points_required,
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Deduct points
            LoyaltyPoint::create([
                'user_id' => $user->id,
                'points' => -$reward->points_required,
                'type' => 'redemption',
                'description' => 'Échange contre: ' . $reward->name,
                'reference_type' => Reward::class,
                'reference_id' => $reward->id,
            ]);

            // Create redemption
            $redemption = RewardRedemption::create([
                'user_id' => $user->id,
                'reward_id' => $reward->id,
                'points_spent' => $reward->points_required,
                'redemption_code' => RewardRedemption::generateRedemptionCode(),
                'status' => 'pending',
                'expires_at' => now()->addDays(30), // Valid for 30 days
            ]);

            // Update reward quantity
            if ($reward->quantity_available !== null) {
                $reward->increment('quantity_redeemed');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Récompense échangée avec succès!',
                'data' => [
                    'redemption' => $redemption->load('reward'),
                    'remaining_points' => $userPoints - $reward->points_required,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'échange: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's redemptions
     */
    public function myRedemptions(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->rewardRedemptions()
            ->with('reward:id,name,type,value,value_type,image_url');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $redemptions = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $redemptions->items(),
            'meta' => [
                'current_page' => $redemptions->currentPage(),
                'last_page' => $redemptions->lastPage(),
                'per_page' => $redemptions->perPage(),
                'total' => $redemptions->total(),
            ],
        ]);
    }

    /**
     * Get a specific redemption
     */
    public function showRedemption(Request $request, RewardRedemption $redemption): JsonResponse
    {
        $user = $request->user();

        if ($redemption->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $redemption->load('reward');

        return response()->json([
            'success' => true,
            'data' => $redemption,
        ]);
    }

    /**
     * Use a redemption (for merchants)
     */
    public function useRedemption(Request $request, string $code): JsonResponse
    {
        $user = $request->user();

        // Only merchants can use redemption codes
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les commerçants peuvent valider les codes',
            ], 403);
        }

        $redemption = RewardRedemption::where('redemption_code', $code)
            ->with('reward', 'user')
            ->first();

        if (!$redemption) {
            return response()->json([
                'success' => false,
                'message' => 'Code de récompense invalide',
            ], 404);
        }

        // Check if the reward belongs to this merchant
        if ($redemption->reward->merchant_id && $redemption->reward->merchant_id !== $user->merchant?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cette récompense n\'appartient pas à votre commerce',
            ], 403);
        }

        if (!$redemption->isUsable()) {
            return response()->json([
                'success' => false,
                'message' => $redemption->isExpired() ? 'Ce code a expiré' : 'Ce code a déjà été utilisé',
            ], 400);
        }

        $redemption->markAsUsed();

        return response()->json([
            'success' => true,
            'message' => 'Récompense validée avec succès!',
            'data' => [
                'redemption' => $redemption,
                'customer_name' => $redemption->user->name,
                'reward_name' => $redemption->reward->name,
                'reward_value' => $redemption->reward->formatted_value,
            ],
        ]);
    }

    // =====================
    // ADMIN METHODS
    // =====================

    /**
     * Create a new reward (admin)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'image_url' => 'nullable|url',
            'points_required' => 'required|integer|min:1',
            'type' => 'required|in:discount,product,voucher,experience',
            'value' => 'nullable|numeric|min:0',
            'value_type' => 'nullable|in:fixed,percentage',
            'quantity_available' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'tier_required' => 'nullable|in:bronze,silver,gold,platinum',
            'is_featured' => 'nullable|boolean',
        ]);

        // Merchants can only create rewards for their own shop
        if ($user->role === 'merchant') {
            $validated['merchant_id'] = $user->merchant->id;
        } else {
            $validated['merchant_id'] = $request->merchant_id;
        }

        $reward = Reward::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Récompense créée avec succès',
            'data' => $reward,
        ], 201);
    }

    /**
     * Update a reward (admin)
     */
    public function update(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin' && ($user->role !== 'merchant' || $reward->merchant_id !== $user->merchant?->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'image_url' => 'nullable|url',
            'points_required' => 'sometimes|integer|min:1',
            'type' => 'sometimes|in:discount,product,voucher,experience',
            'value' => 'nullable|numeric|min:0',
            'value_type' => 'nullable|in:fixed,percentage',
            'quantity_available' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'tier_required' => 'nullable|in:bronze,silver,gold,platinum',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
        ]);

        $reward->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Récompense mise à jour avec succès',
            'data' => $reward->fresh(),
        ]);
    }

    /**
     * Delete a reward (admin)
     */
    public function destroy(Request $request, Reward $reward): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin' && ($user->role !== 'merchant' || $reward->merchant_id !== $user->merchant?->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Don't delete if there are pending redemptions
        if ($reward->redemptions()->where('status', 'pending')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer: des rédemptions sont en attente',
            ], 400);
        }

        $reward->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Récompense désactivée avec succès',
        ]);
    }
}
