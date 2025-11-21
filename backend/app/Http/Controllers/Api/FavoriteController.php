<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Product;
use Carbon\Carbon;
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

            // 🐛 BUG FIX #3: Filter out favorites with invalid products (null category or merchant)
            $favorites = Favorite::with(['product.category', 'product.merchant.user'])
                ->where('user_id', $user->id)
                ->whereHas('product', function ($query) {
                    $query->whereNotNull('category_id')
                          ->whereNotNull('merchant_id');
                })
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            $products = $favorites->getCollection()->map(function ($favorite) {
                // Additional safety check
                if (!$favorite->product || !$favorite->product->category || !$favorite->product->merchant) {
                    return null;
                }

                $product = $favorite->product;
                try {
                    $expirationDate = $product->expiration_date
                        ? Carbon::parse($product->expiration_date)
                        : null;
                } catch (\Exception $exception) {
                    // Ignore malformed dates while keeping favorites list usable
                    $expirationDate = null;
                }

                $daysUntilExpiration = $expirationDate
                    ? now()->diffInDays($expirationDate, false)
                    : null;

                $originalPrice = (float) $product->original_price;
                $discountedPrice = (float) $product->discounted_price;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'original_price' => $originalPrice,
                    'discounted_price' => $discountedPrice,
                    'discount_percentage' => $product->discount_percentage,
                    'quantity_available' => $product->quantity_available,
                    'expiration_date' => $product->expiration_date,
                    'days_until_expiration' => $daysUntilExpiration,
                    'savings' => max($originalPrice - $discountedPrice, 0),
                    'image_url' => $product->image_url,
                    'is_active' => $product->is_active,
                    'status' => $product->status,
                    'needs_approval' => $product->needs_approval,
                    'created_at' => $product->created_at,
                    'category' => [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'icon' => $product->category->icon,
                    ],
                    'merchant' => [
                        'id' => $product->merchant->id,
                        'business_name' => $product->merchant->business_name,
                        'business_type' => $product->merchant->business_type,
                        'city' => $product->merchant->user->city ?? null,
                        'address' => $product->merchant->user->address ?? null,
                        'phone' => $product->merchant->user->phone ?? null,
                    ],
                    'favorited_at' => $favorite->created_at,
                ];
            })->filter()->values(); // Remove null entries and reset indexes

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
