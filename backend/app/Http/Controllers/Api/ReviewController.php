<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $query = Review::with(['user', 'product', 'merchant']);

        if ($user->isMerchant()) {
            $merchant = $user->merchant;

            if (!$merchant) {
                return response()->json([
                    'success' => false,
                    'message' => "Aucun profil commerçant associé"
                ], 403);
            }

            $query->where('merchant_id', $merchant->id);
        } elseif ($user->isConsumer()) {
            $query->where('user_id', $user->id);
        } else {
            if ($request->filled('merchant_id')) {
                $query->where('merchant_id', $request->integer('merchant_id'));
            }
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->integer('user_id'));
            }
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('rating')) {
            $query->where('rating', $request->integer('rating'));
        }

        $reviews = $query->latest()->paginate(min($request->integer('per_page', 15), 50));

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

    public function store(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->isConsumer()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les consommateurs peuvent laisser un avis'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string',
            'product_id' => 'nullable|exists:products,id',
            'merchant_id' => 'required_without:product_id|exists:merchants,id',
            'is_verified_purchase' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $productId = $data['product_id'] ?? null;
        $merchantId = $data['merchant_id'] ?? null;

        if ($productId) {
            $product = Product::findOrFail($productId);
            $merchantId = $product->merchant_id;
        }

        $existingReview = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->when(!$productId, function ($query) use ($merchantId) {
                return $query->where('merchant_id', $merchantId);
            })
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà laissé un avis pour cet achat'
            ], 409);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'merchant_id' => $merchantId,
            'product_id' => $productId,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'] ?? null,
            'is_verified_purchase' => $data['is_verified_purchase'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Avis créé avec succès',
            'data' => $review->load(['user', 'product', 'merchant']),
        ], 201);
    }

    public function show(Review $review): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$this->canAccessReview($user, $review)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cet avis'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $review->load(['user', 'product', 'merchant']),
        ]);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$this->canModifyReview($user, $review)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas modifier cet avis'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'sometimes|integer|min:1|max:5',
            'title' => 'sometimes|nullable|string|max:255',
            'comment' => 'sometimes|nullable|string',
            'is_verified_purchase' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        $review->fill($validator->validated());
        $review->save();

        return response()->json([
            'success' => true,
            'message' => 'Avis mis à jour',
            'data' => $review->refresh()->load(['user', 'product', 'merchant']),
        ]);
    }

    public function destroy(Review $review): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$this->canModifyReview($user, $review)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer cet avis'
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Avis supprimé'
        ]);
    }

    protected function canAccessReview($user, Review $review): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isMerchant()) {
            return optional($user->merchant)->id === $review->merchant_id;
        }

        return $review->user_id === $user->id;
    }

    protected function canModifyReview($user, Review $review): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isMerchant()) {
            return optional($user->merchant)->id === $review->merchant_id;
        }

        return $user->id === $review->user_id;
    }
}
