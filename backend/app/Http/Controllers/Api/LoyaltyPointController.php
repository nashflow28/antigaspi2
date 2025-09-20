<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class LoyaltyPointController extends Controller
{
    /**
     * Get user's loyalty points summary
     */
    public function getUserPoints(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Calculate total active points
            $totalPoints = LoyaltyPoint::where('user_id', $user->id)
                ->active()
                ->sum('points');

            // Get points breakdown by type
            $pointsBreakdown = LoyaltyPoint::where('user_id', $user->id)
                ->active()
                ->select('earned_from', DB::raw('SUM(points) as total'))
                ->groupBy('earned_from')
                ->get();

            // Get recent points history
            $recentHistory = LoyaltyPoint::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            // Get expiring points (within 30 days)
            $expiringPoints = LoyaltyPoint::where('user_id', $user->id)
                ->where('points', '>', 0)
                ->where('expires_at', '>', now())
                ->where('expires_at', '<=', now()->addDays(30))
                ->sum('points');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_points' => $totalPoints,
                    'expiring_soon' => $expiringPoints,
                    'breakdown' => $pointsBreakdown,
                    'recent_history' => $recentHistory
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des points'
            ], 500);
        }
    }

    /**
     * Award points to a user (Merchant/Admin only)
     */
    public function awardPoints(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'points' => 'required|integer|min:1|max:1000',
            'earned_from' => 'required|in:purchase,review,referral,bonus',
            'reference_id' => 'nullable|integer',
            'description' => 'required|string|max:255',
            'expires_at' => 'nullable|date|after:now'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $loyaltyPoint = LoyaltyPoint::create([
                'user_id' => $request->user_id,
                'points' => $request->points,
                'earned_from' => $request->earned_from,
                'reference_id' => $request->reference_id,
                'description' => $request->description,
                'expires_at' => $request->expires_at ?: now()->addYear(), // Default 1 year expiry
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Points attribués avec succès',
                'data' => $loyaltyPoint
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'attribution des points'
            ], 500);
        }
    }

    /**
     * Redeem points (Consumer only)
     */
    public function redeemPoints(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'points' => 'required|integer|min:1',
            'description' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            // Check if user has enough points
            $totalPoints = LoyaltyPoint::where('user_id', $user->id)
                ->active()
                ->sum('points');

            if ($totalPoints < $request->points) {
                return response()->json([
                    'success' => false,
                    'message' => 'Points insuffisants'
                ], 400);
            }

            // Create redemption record (negative points)
            $redemption = LoyaltyPoint::create([
                'user_id' => $user->id,
                'points' => -$request->points,
                'earned_from' => 'redemption',
                'description' => $request->description,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Points échangés avec succès',
                'data' => [
                    'redeemed_points' => $request->points,
                    'remaining_points' => $totalPoints - $request->points,
                    'redemption' => $redemption
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'échange des points'
            ], 500);
        }
    }

    /**
     * Get all users with their loyalty points (Admin only)
     */
    public function getAllUsersPoints(Request $request): JsonResponse
    {
        try {
            $users = User::with(['loyaltyPoints' => function($query) {
                $query->active();
            }])
            ->where('role', 'consumer')
            ->get()
            ->map(function ($user) {
                $totalPoints = $user->loyaltyPoints->sum('points');
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_points' => $totalPoints,
                    'last_activity' => $user->loyaltyPoints->max('created_at')
                ];
            })
            ->sortByDesc('total_points')
            ->values();

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des points'
            ], 500);
        }
    }

    /**
     * Get merchant's customers with their loyalty points (Merchant only)
     */
    public function getMerchantCustomers(Request $request): JsonResponse
    {
        try {
            $merchant = $request->user();

            // Get all customers who have made reservations with this merchant
            $customers = User::with(['loyaltyPoints' => function($query) {
                $query->active();
            }])
            ->where('role', 'consumer')
            ->whereHas('reservations', function($query) use ($merchant) {
                $query->whereHas('product', function($productQuery) use ($merchant) {
                    $productQuery->where('merchant_id', $merchant->id);
                });
            })
            ->get()
            ->map(function ($user) {
                $totalPoints = $user->loyaltyPoints->sum('points');
                $name = $user->name ?: trim($user->first_name . ' ' . $user->last_name);
                return [
                    'id' => $user->id,
                    'name' => $name ?: 'Utilisateur #' . $user->id,
                    'email' => $user->email,
                    'total_points' => $totalPoints,
                    'last_activity' => $user->loyaltyPoints->max('created_at')
                ];
            })
            ->sortByDesc('total_points')
            ->values();

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients'
            ], 500);
        }
    }

    /**
     * Auto-award points for purchase (Internal method)
     */
    public function awardPurchasePoints($userId, $reservationId, $amount): void
    {
        // Award 1 point per 100 XOF spent (configurable)
        $points = intval($amount / 100);

        if ($points > 0) {
            LoyaltyPoint::create([
                'user_id' => $userId,
                'points' => $points,
                'earned_from' => 'purchase',
                'reference_id' => $reservationId,
                'description' => "Points gagnés pour achat de {$amount} XOF",
                'expires_at' => now()->addYear(),
            ]);
        }
    }

    /**
     * Auto-award points for review (Internal method)
     */
    public function awardReviewPoints($userId, $reviewId): void
    {
        LoyaltyPoint::create([
            'user_id' => $userId,
            'points' => 10, // Fixed 10 points per review
            'earned_from' => 'review',
            'reference_id' => $reviewId,
            'description' => 'Points gagnés pour avis laissé',
            'expires_at' => now()->addYear(),
        ]);
    }
}