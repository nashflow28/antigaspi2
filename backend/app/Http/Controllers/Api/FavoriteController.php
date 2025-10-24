<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class FavoriteController extends Controller
{
    /**
     * Get all user's favorites with pagination
     * 🐛 BUG FIX #27: Added pagination to prevent performance issues with large datasets
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            // 🐛 BUG FIX #27: Add pagination with safe limits
            $perPage = $request->get('per_page', 20);
            $perPage = max(1, min((int) $perPage, 100)); // Between 1 and 100

            $favorites = Favorite::with(['product.category', 'product.merchant.user'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            $products = $favorites->map(function ($favorite) {
                return [
                    'id' => $favorite->product->id,
                    'name' => $favorite->product->name,
                    'description' => $favorite->product->description,
                    'original_price' => (float) $favorite->product->original_price,
                    'discounted_price' => (float) $favorite->product->discounted_price,
                    'discount_percentage' => $favorite->product->discount_percentage,
                    'quantity_available' => $favorite->product->quantity_available,
                    'expiration_date' => $favorite->product->expiration_date,
                    'image_url' => $favorite->product->image_url,
                    'is_active' => $favorite->product->is_active,
                    'category' => [
                        'id' => $favorite->product->category->id,
                        'name' => $favorite->product->category->name,
                        'icon' => $favorite->product->category->icon,
                    ],
                    'merchant' => [
                        'id' => $favorite->product->merchant->id,
                        'business_name' => $favorite->product->merchant->business_name,
                        'business_type' => $favorite->product->merchant->business_type,
                    ],
                    'favorited_at' => $favorite->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $products,
                'pagination' => [
                    'total' => $favorites->total(),
                    'per_page' => $favorites->perPage(),
                    'current_page' => $favorites->currentPage(),
                    'last_page' => $favorites->lastPage(),
                    'from' => $favorites->firstItem(),
                    'to' => $favorites->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des favoris',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle favorite status for a product
     */
    public function toggle(Request $request, $productId): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            // Vérifier que le produit existe
            $product = Product::findOrFail($productId);

            $isFavorite = Favorite::toggle($user->id, $productId);

            return response()->json([
                'success' => true,
                'message' => $isFavorite ? 'Produit ajouté aux favoris' : 'Produit retiré des favoris',
                'is_favorite' => $isFavorite,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du favori',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if a product is in user's favorites
     */
    public function check(Request $request, $productId): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $isFavorite = Favorite::isFavorite($user->id, $productId);

            return response()->json([
                'success' => true,
                'is_favorite' => $isFavorite,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get favorite products IDs for batch checking
     */
    public function batchCheck(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            $favoriteIds = Favorite::where('user_id', $user->id)
                ->pluck('product_id')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $favoriteIds,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des favoris',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
