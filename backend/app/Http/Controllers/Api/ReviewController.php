<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Get reviews for a merchant
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'merchant_id' => 'nullable|exists:merchants,id',
            'product_id' => 'nullable|exists:products,id',
            'rating' => 'nullable|integer|between:1,5',
            'per_page' => 'nullable|integer|max:50',
        ]);

        $query = Review::with(['user:id,first_name,last_name', 'product:id,name', 'merchant:id,business_name'])
            ->approved()
            ->recent();

        // Filter by merchant
        if ($request->merchant_id) {
            $query->byMerchant($request->merchant_id);
        }

        // Filter by product
        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        // Filter by rating
        if ($request->rating) {
            $query->byRating($request->rating);
        }

        $reviews = $query->paginate($request->per_page ?? 15);

        // Transform the data
        $reviews->getCollection()->transform(function ($review) {
            return [
                'id' => $review->id,
                'merchant_id' => $review->merchant_id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment,
                'stars' => $review->stars,
                'time_ago' => $review->time_ago,
                'is_verified_purchase' => $review->is_verified_purchase,
                'merchant' => $review->merchant ? [
                    'id' => $review->merchant->id,
                    'business_name' => $review->merchant->business_name,
                ] : null,
                'user' => [
                    'id' => $review->user->id,
                    'name' => $review->user->first_name.' '.substr($review->user->last_name, 0, 1).'.',
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
        ]);
    }

    /**
     * Store a new review
     */
    public function store(Request $request): JsonResponse
    {
        // Handle JSON input properly
        $data = $request->all();
        if (empty($data) && $request->getContent()) {
            $data = json_decode($request->getContent(), true) ?: [];
        }

        $mediaFields = ['media', 'media_urls', 'photos', 'images', 'attachments'];

        $rules = [
            'merchant_id' => 'required|exists:merchants,id',
            'product_id' => 'nullable|exists:products,id',
            'rating' => 'required|integer|between:1,5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:1000',
        ];

        foreach ($mediaFields as $field) {
            $rules[$field] = 'prohibited';
        }

        $messages = [];
        foreach ($mediaFields as $field) {
            $messages[$field.'.prohibited'] = "L'ajout de médias pour les avis n'est pas encore pris en charge.";
        }

        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            $errorMessage = 'Données invalides';

            foreach ($mediaFields as $field) {
                if ($validator->errors()->has($field)) {
                    $errorMessage = "L'ajout de médias pour les avis n'est pas encore pris en charge.";
                    break;
                }
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        // Check if user already reviewed this merchant/product combination
        // Un utilisateur ne peut avoir qu'UN SEUL avis par produit (ou par commerçant si pas de produit)
        $existingReviewQuery = Review::where('user_id', $user->id)
            ->where('merchant_id', $data['merchant_id']);

        $productId = $data['product_id'] ?? null;

        if ($productId !== null) {
            // Si product_id fourni, vérifier si avis existe pour CE produit spécifique
            $existingReviewQuery->where('product_id', $productId);
        } else {
            // Si pas de product_id, vérifier si avis existe sans product_id
            $existingReviewQuery->whereNull('product_id');
        }

        $existingReview = $existingReviewQuery->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => $productId
                    ? 'Vous avez déjà donné un avis pour ce produit'
                    : 'Vous avez déjà donné un avis pour ce commerçant',
            ], 409);
        }

        // Check if it's a verified purchase (user has a completed reservation)
        $isVerified = $user->reservations()
            ->whereHas('product', function ($query) use ($data) {
                $query->where('merchant_id', $data['merchant_id']);
            })
            ->when($data['product_id'] ?? null, function ($query) use ($data) {
                return $query->where('product_id', $data['product_id']);
            })
            ->where('status', 'completed')
            ->exists();

        $review = Review::create([
            'user_id' => $user->id,
            'merchant_id' => $data['merchant_id'],
            'product_id' => $data['product_id'] ?? null,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'] ?? null,
            'is_verified_purchase' => $isVerified,
            'is_approved' => true, // Auto-approve for now
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Avis ajouté avec succès',
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment,
                'is_verified_purchase' => $review->is_verified_purchase,
            ],
        ], 201);
    }

    /**
     * Get a specific review (only by the author)
     */
    public function show(Review $review): JsonResponse
    {
        $user = Auth::user();

        // Only the author can view their own review details
        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment,
                'is_verified_purchase' => $review->is_verified_purchase,
                'created_at' => $review->created_at->format('c'),
                'updated_at' => $review->updated_at->format('c'),
            ],
        ]);
    }

    /**
     * Update a review (only by the author)
     */
    public function update(Request $request, Review $review): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|between:1,5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        // Only the author can update their review
        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        // Don't allow updates if the review is older than 30 days
        if ($review->created_at->diffInDays(now()) > 30) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier un avis de plus de 30 jours',
            ], 422);
        }

        $review->update([
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            // Keep existing verification status
            // Mark as pending approval if significant changes
            'is_approved' => $review->rating == $request->rating ? $review->is_approved : true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Avis mis à jour avec succès',
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'comment' => $review->comment,
                'is_verified_purchase' => $review->is_verified_purchase,
                'updated_at' => $review->updated_at->format('c'),
            ],
        ]);
    }

    /**
     * Delete a review (only by the author)
     */
    public function destroy(Review $review): JsonResponse
    {
        $user = Auth::user();

        // Only the author can delete their review
        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Avis supprimé avec succès',
        ]);
    }

    /**
     * Get review statistics for a merchant
     */
    public function stats(Request $request): JsonResponse
    {
        $request->validate([
            'merchant_id' => 'required|exists:merchants,id',
        ]);

        $merchantId = $request->merchant_id;

        $stats = Review::selectRaw('
            COUNT(*) as total_reviews,
            AVG(rating) as average_rating,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
            SUM(CASE WHEN is_verified_purchase = 1 THEN 1 ELSE 0 END) as verified_reviews
        ')
            ->where('merchant_id', $merchantId)
            ->approved()
            ->first();

        $ratingDistribution = [];
        if ($stats->total_reviews > 0) {
            for ($i = 5; $i >= 1; $i--) {
                $count = $stats->{$i === 5 ? 'five_stars' : ($i === 4 ? 'four_stars' : ($i === 3 ? 'three_stars' : ($i === 2 ? 'two_stars' : 'one_star')))};
                $ratingDistribution[] = [
                    'rating' => $i,
                    'count' => (int) $count,
                    'percentage' => round(($count / $stats->total_reviews) * 100, 1),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_reviews' => (int) $stats->total_reviews,
                'average_rating' => $stats->average_rating ? round($stats->average_rating, 1) : 0,
                'verified_reviews' => (int) $stats->verified_reviews,
                'rating_distribution' => $ratingDistribution,
            ],
        ]);
    }
}
