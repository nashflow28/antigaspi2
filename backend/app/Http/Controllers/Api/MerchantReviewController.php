<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MerchantReviewController extends Controller
{
    /**
     * Get merchant reviews dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        // Temporary JWT validation until middleware is fixed
        try {
            $token = $request->bearerToken();
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token requis'
                ], 401);
            }

            $user = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->authenticate();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide'
                ], 401);
            }

            // Verify user is a merchant
            if ($user->role !== 'merchant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants'
                ], 403);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur d\'authentification: ' . $e->getMessage()
            ], 401);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        try {
            // Get overall statistics
            $stats = Review::selectRaw('
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
                SUM(CASE WHEN is_verified_purchase = 1 THEN 1 ELSE 0 END) as verified_reviews,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as reviews_today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as reviews_this_week,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as reviews_this_month
            ')
            ->where('merchant_id', $merchant->id)
            ->approved()
            ->first();

            // Get recent reviews
            $recentReviews = Review::with(['user:id,first_name,last_name', 'product:id,name'])
                                  ->where('merchant_id', $merchant->id)
                                  ->approved()
                                  ->recent()
                                  ->limit(5)
                                  ->get()
                                  ->map(function ($review) {
                                      return [
                                          'id' => $review->id,
                                          'rating' => $review->rating,
                                          'title' => $review->title,
                                          'comment' => $review->comment,
                                          'time_ago' => $review->time_ago,
                                          'is_verified_purchase' => $review->is_verified_purchase,
                                          'user' => [
                                              'id' => $review->user->id,
                                              'name' => $review->user->first_name . ' ' . substr($review->user->last_name, 0, 1) . '.',
                                          ],
                                          'product' => $review->product ? [
                                              'id' => $review->product->id,
                                              'name' => $review->product->name,
                                          ] : null,
                                          'created_at' => $review->created_at->toISOString(),
                                      ];
                                  });

            // Get rating distribution
            $ratingDistribution = [];
            if ($stats->total_reviews > 0) {
                for ($i = 5; $i >= 1; $i--) {
                    $count = $stats->{$i === 5 ? 'five_stars' : ($i === 4 ? 'four_stars' : ($i === 3 ? 'three_stars' : ($i === 2 ? 'two_stars' : 'one_star')))};
                    $ratingDistribution[] = [
                        'rating' => $i,
                        'count' => (int) $count,
                        'percentage' => round(($count / $stats->total_reviews) * 100, 1)
                    ];
                }
            }

            // Get monthly trend (last 6 months)
            $monthlyTrend = Review::selectRaw('
                DATE_FORMAT(created_at, "%Y-%m") as month,
                COUNT(*) as count,
                AVG(rating) as avg_rating
            ')
            ->where('merchant_id', $merchant->id)
            ->approved()
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'count' => (int) $item->count,
                    'avg_rating' => round($item->avg_rating, 1)
                ];
            });

            // Get product performance
            $productStats = Review::selectRaw('
                product_id,
                COUNT(*) as review_count,
                AVG(rating) as avg_rating
            ')
            ->with('product:id,name')
            ->where('merchant_id', $merchant->id)
            ->approved()
            ->whereNotNull('product_id')
            ->groupBy('product_id')
            ->having('review_count', '>=', 1)
            ->orderBy('review_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product ? $item->product->name : 'Produit supprimé',
                    'review_count' => (int) $item->review_count,
                    'avg_rating' => round($item->avg_rating, 1)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'merchant' => [
                        'id' => $merchant->id,
                        'business_name' => $merchant->business_name,
                        'business_type' => $merchant->business_type,
                    ],
                    'stats' => [
                        'total_reviews' => (int) $stats->total_reviews,
                        'average_rating' => $stats->average_rating ? round($stats->average_rating, 1) : 0,
                        'verified_reviews' => (int) $stats->verified_reviews,
                        'reviews_today' => (int) $stats->reviews_today,
                        'reviews_this_week' => (int) $stats->reviews_this_week,
                        'reviews_this_month' => (int) $stats->reviews_this_month,
                        'rating_distribution' => $ratingDistribution,
                    ],
                    'recent_reviews' => $recentReviews,
                    'monthly_trend' => $monthlyTrend,
                    'product_stats' => $productStats,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get merchant reviews list with filtering and pagination
     */
    public function list(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Verify user is a merchant
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants'
            ], 403);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        $request->validate([
            'rating' => 'nullable|integer|between:1,5',
            'verified_only' => 'nullable|boolean',
            'product_id' => 'nullable|exists:products,id',
            'sort' => 'nullable|in:recent,oldest,rating_high,rating_low',
            'per_page' => 'nullable|integer|max:50',
        ]);

        try {
            $query = Review::with(['user:id,first_name,last_name', 'product:id,name'])
                          ->where('merchant_id', $merchant->id)
                          ->approved();

            // Apply filters
            if ($request->rating) {
                $query->byRating($request->rating);
            }

            if ($request->verified_only) {
                $query->verified();
            }

            if ($request->product_id) {
                $query->where('product_id', $request->product_id);
            }

            // Apply sorting
            switch ($request->sort) {
                case 'oldest':
                    $query->orderBy('created_at', 'asc');
                    break;
                case 'rating_high':
                    $query->orderBy('rating', 'desc')->orderBy('created_at', 'desc');
                    break;
                case 'rating_low':
                    $query->orderBy('rating', 'asc')->orderBy('created_at', 'desc');
                    break;
                default:
                    $query->recent();
                    break;
            }

            $reviews = $query->paginate($request->per_page ?? 15);

            // Transform the data
            $reviews->getCollection()->transform(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'comment' => $review->comment,
                    'stars' => $review->stars,
                    'time_ago' => $review->time_ago,
                    'is_verified_purchase' => $review->is_verified_purchase,
                    'user' => [
                        'id' => $review->user->id,
                        'name' => $review->user->first_name . ' ' . substr($review->user->last_name, 0, 1) . '.',
                    ],
                    'product' => $review->product ? [
                        'id' => $review->product->id,
                        'name' => $review->product->name,
                    ] : null,
                    'created_at' => $review->created_at->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $reviews->items(),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page' => $reviews->lastPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                ],
                'filters' => [
                    'rating' => $request->rating,
                    'verified_only' => $request->verified_only,
                    'product_id' => $request->product_id,
                    'sort' => $request->sort ?? 'recent',
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des avis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Respond to a review
     */
    public function respond(Request $request, Review $review): JsonResponse
    {
        $user = Auth::user();

        // Verify user is a merchant
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants'
            ], 403);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        // Verify the review belongs to this merchant
        if ($review->merchant_id !== $merchant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Avis non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'response' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if already responded
            if ($review->merchant_response) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà répondu à cet avis'
                ], 409);
            }

            $review->update([
                'merchant_response' => $request->response,
                'merchant_response_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réponse ajoutée avec succès',
                'data' => [
                    'id' => $review->id,
                    'merchant_response' => $review->merchant_response,
                    'merchant_response_at' => $review->merchant_response_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de la réponse',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update merchant response to a review
     */
    public function updateResponse(Request $request, Review $review): JsonResponse
    {
        $user = Auth::user();

        // Verify user is a merchant
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants'
            ], 403);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        // Verify the review belongs to this merchant
        if ($review->merchant_id !== $merchant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Avis non trouvé'
            ], 404);
        }

        // Verify there's an existing response
        if (!$review->merchant_response) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune réponse existante à modifier'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'response' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $review->update([
                'merchant_response' => $request->response,
                'merchant_response_updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réponse mise à jour avec succès',
                'data' => [
                    'id' => $review->id,
                    'merchant_response' => $review->merchant_response,
                    'merchant_response_at' => $review->merchant_response_at->toISOString(),
                    'merchant_response_updated_at' => $review->merchant_response_updated_at ? $review->merchant_response_updated_at->toISOString() : null,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la réponse',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete merchant response to a review
     */
    public function deleteResponse(Review $review): JsonResponse
    {
        $user = Auth::user();

        // Verify user is a merchant
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants'
            ], 403);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        // Verify the review belongs to this merchant
        if ($review->merchant_id !== $merchant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Avis non trouvé'
            ], 404);
        }

        // Verify there's an existing response
        if (!$review->merchant_response) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune réponse à supprimer'
            ], 404);
        }

        try {
            $review->update([
                'merchant_response' => null,
                'merchant_response_at' => null,
                'merchant_response_updated_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réponse supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la réponse',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get merchant's products for filtering
     */
    public function products(): JsonResponse
    {
        $user = Auth::user();

        // Verify user is a merchant
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants'
            ], 403);
        }

        $merchant = $user->merchant;
        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Profil commerçant non trouvé'
            ], 404);
        }

        try {
            $products = DB::table('products')
                         ->join('reviews', 'products.id', '=', 'reviews.product_id')
                         ->where('products.merchant_id', $merchant->id)
                         ->where('reviews.is_approved', true)
                         ->select('products.id', 'products.name', DB::raw('COUNT(reviews.id) as review_count'))
                         ->groupBy('products.id', 'products.name')
                         ->orderBy('review_count', 'desc')
                         ->get();

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des produits',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}