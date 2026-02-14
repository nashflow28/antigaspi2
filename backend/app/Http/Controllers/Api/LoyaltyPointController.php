<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
use App\Models\User;
use App\Services\LoyaltyTierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LoyaltyPointController extends Controller
{
    protected LoyaltyTierService $tierService;

    public function __construct(LoyaltyTierService $tierService)
    {
        $this->tierService = $tierService;
    }

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

            // Get tier info
            $tierInfo = $this->tierService->getTierInfo($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_points' => $totalPoints,
                    'expiring_soon' => $expiringPoints,
                    'breakdown' => $pointsBreakdown,
                    'recent_history' => $recentHistory,
                    'tier' => $tierInfo,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des points',
            ], 500);
        }
    }

    /**
     * Get user's loyalty tier information
     */
    public function getTierInfo(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $tierInfo = $this->tierService->getTierInfo($user);

            return response()->json([
                'success' => true,
                'data' => $tierInfo,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des informations de niveau',
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
            'expires_at' => 'nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
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
                'data' => $loyaltyPoint,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'attribution des points',
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
            'description' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
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
                    'message' => 'Points insuffisants',
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
                    'redemption' => $redemption,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'échange des points',
            ], 500);
        }
    }

    /**
     * Get all users with their loyalty points (Admin only)
     */
    public function getAllUsersPoints(Request $request): JsonResponse
    {
        try {
            $users = User::with(['loyaltyPoints' => function ($query) {
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
                        'last_activity' => $user->loyaltyPoints->max('created_at'),
                    ];
                })
                ->sortByDesc('total_points')
                ->values();

            return response()->json([
                'success' => true,
                'data' => $users,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des points',
            ], 500);
        }
    }

    /**
     * Get merchant's loyalty program stats (Merchant only)
     */
    public function getMerchantStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user || $user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants',
                ], 403);
            }

            $merchant = $user->merchant;
            if (! $merchant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil commerçant non trouvé',
                ], 404);
            }

            // Get all customers who made purchases with this merchant
            $customerIds = DB::table('reservations')
                ->join('products', 'reservations.product_id', '=', 'products.id')
                ->where('products.merchant_id', $merchant->id)
                ->where('reservations.status', 'completed')
                ->distinct()
                ->pluck('reservations.user_id');

            // Total points distributed by this merchant
            $totalPointsDistributed = LoyaltyPoint::whereIn('user_id', $customerIds)
                ->where('earned_from', 'reservation')
                ->where('points', '>', 0)
                ->sum('points');

            // Points distributed this month
            $monthlyPoints = LoyaltyPoint::whereIn('user_id', $customerIds)
                ->where('earned_from', 'reservation')
                ->where('points', '>', 0)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('points');

            // Number of customers with points
            $customersWithPoints = User::whereIn('id', $customerIds)
                ->whereHas('loyaltyPoints', function ($query) {
                    $query->where('points', '>', 0);
                })
                ->count();

            // Top 5 loyal customers
            $topCustomers = User::whereIn('id', $customerIds)
                ->with(['loyaltyPoints' => function ($query) {
                    $query->active();
                }])
                ->get()
                ->map(function ($user) {
                    $totalPoints = $user->loyaltyPoints->sum('points');

                    return [
                        'id' => $user->id,
                        'name' => $user->name ?: trim($user->first_name.' '.$user->last_name),
                        'email' => $user->email,
                        'total_points' => $totalPoints,
                    ];
                })
                ->filter(function ($customer) {
                    return $customer['total_points'] > 0;
                })
                ->sortByDesc('total_points')
                ->take(5)
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_points_distributed' => (int) $totalPointsDistributed,
                    'monthly_points_distributed' => (int) $monthlyPoints,
                    'customers_with_points' => $customersWithPoints,
                    'top_customers' => $topCustomers,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
            $customers = User::with(['loyaltyPoints' => function ($query) {
                $query->active();
            }])
                ->where('role', 'consumer')
                ->whereHas('reservations', function ($query) use ($merchant) {
                    $query->whereHas('product', function ($productQuery) use ($merchant) {
                        $productQuery->where('merchant_id', $merchant->id);
                    });
                })
                ->get()
                ->map(function ($user) {
                    $totalPoints = $user->loyaltyPoints->sum('points');
                    $name = $user->name ?: trim($user->first_name.' '.$user->last_name);

                    return [
                        'id' => $user->id,
                        'name' => $name ?: 'Utilisateur #'.$user->id,
                        'email' => $user->email,
                        'total_points' => $totalPoints,
                        'last_activity' => $user->loyaltyPoints->max('created_at'),
                    ];
                })
                ->sortByDesc('total_points')
                ->values();

            return response()->json([
                'success' => true,
                'data' => $customers,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients',
            ], 500);
        }
    }

    /**
     * Auto-award points for purchase (Internal method)
     */
    public function awardPurchasePoints($userId, $reservationId, $amount): void
    {
        $user = User::find($userId);
        if (! $user) {
            return;
        }

        // Award 1 point per 100 XOF spent (configurable)
        $basePoints = intval($amount / 100);

        if ($basePoints > 0) {
            // Apply tier bonus multiplier
            $finalPoints = $this->tierService->calculatePointsWithBonus($user, $basePoints);
            $multiplier = $this->tierService->getPointsMultiplier($user);

            $description = "Points gagnés pour achat de {$amount} XOF";
            if ($multiplier > 1) {
                $description .= " (x{$multiplier} bonus niveau)";
            }

            LoyaltyPoint::create([
                'user_id' => $userId,
                'points' => $finalPoints,
                'earned_from' => 'purchase',
                'reference_id' => $reservationId,
                'description' => $description,
                'expires_at' => now()->addYear(),
            ]);

            // Update lifetime points and check tier progression
            $this->tierService->addLifetimePoints($user, $finalPoints);
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

    /**
     * Get user's referral code and stats
     */
    public function getReferralInfo(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Count successful referrals (users who completed at least one purchase)
            $successfulReferrals = User::where('referred_by', $user->id)
                ->whereHas('reservations', function ($query) {
                    $query->where('status', 'completed');
                })
                ->count();

            // Total referrals (all users who signed up with this code)
            $totalReferrals = User::where('referred_by', $user->id)->count();

            // Total points earned from referrals
            $referralPoints = LoyaltyPoint::where('user_id', $user->id)
                ->where('earned_from', 'referral')
                ->sum('points');

            return response()->json([
                'success' => true,
                'data' => [
                    'referral_code' => $user->referral_code,
                    'referral_link' => config('app.frontend_url', 'https://antigaspi.jubtek.com').'/register?ref='.$user->referral_code,
                    'total_referrals' => $totalReferrals,
                    'successful_referrals' => $successfulReferrals,
                    'points_earned' => (int) $referralPoints,
                    'points_per_referral' => 50, // Display bonus amount
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des informations de parrainage',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Validate a referral code (used during registration)
     */
    public function validateReferralCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Code de parrainage invalide',
                'errors' => $validator->errors(),
            ], 422);
        }

        $referrer = User::where('referral_code', strtoupper($request->code))
            ->where('is_active', true)
            ->first();

        if (! $referrer) {
            return response()->json([
                'success' => false,
                'message' => 'Code de parrainage introuvable ou inactif',
                'valid' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'valid' => true,
            'data' => [
                'referrer_name' => $referrer->first_name,
                'bonus_points' => 50, // Bonus for new user
            ],
        ]);
    }

    /**
     * Award referral bonus when referred user completes first purchase
     * Called automatically when a reservation is completed
     */
    public function awardReferralBonus($userId): void
    {
        $user = User::find($userId);

        if (! $user || ! $user->referred_by || $user->referral_bonus_awarded) {
            return; // No referrer or bonus already awarded
        }

        // Check if this is the user's first completed reservation
        $completedReservationsCount = $user->reservations()
            ->where('status', 'completed')
            ->count();

        if ($completedReservationsCount !== 1) {
            return; // Not the first purchase
        }

        // Award bonus to referrer
        LoyaltyPoint::create([
            'user_id' => $user->referred_by,
            'points' => 50, // Referrer gets 50 points
            'earned_from' => 'referral',
            'reference_id' => $user->id,
            'description' => "Bonus parrainage - {$user->first_name} a effectué son premier achat",
            'expires_at' => now()->addYear(),
        ]);

        // Award welcome bonus to new user
        LoyaltyPoint::create([
            'user_id' => $user->id,
            'points' => 25, // New user gets 25 points welcome bonus
            'earned_from' => 'referral',
            'reference_id' => $user->referred_by,
            'description' => 'Bonus de bienvenue pour premier achat (parrainage)',
            'expires_at' => now()->addYear(),
        ]);

        // Mark bonus as awarded
        $user->update(['referral_bonus_awarded' => true]);

        \Log::info('Referral bonus awarded', [
            'new_user_id' => $user->id,
            'referrer_id' => $user->referred_by,
        ]);
    }
}
