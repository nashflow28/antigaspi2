<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SurpriseBasketItem;
use App\Models\User;
use App\Notifications\NewSurpriseBasketNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Notification;

class SurpriseBasketController extends Controller
{
    /**
     * Get all surprise baskets
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::surpriseBaskets()
            ->active()
            ->available()
            ->with(['merchant', 'category', 'surpriseBasketItems.product']);

        // Filter by merchant if requested
        if ($request->has('merchant_id')) {
            $query->where('merchant_id', $request->merchant_id);
        }

        // Filter by category if requested
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by price range
        if ($request->has('min_price') || $request->has('max_price')) {
            $query->priceRange($request->min_price, $request->max_price);
        }

        $surpriseBaskets = $query->paginate(12);

        return response()->json([
            'success' => true,
            'data' => $surpriseBaskets,
            'message' => 'Paniers surprise récupérés avec succès'
        ]);
    }

    /**
     * Get merchant's surprise baskets
     */
    public function merchantBaskets(): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $surpriseBaskets = Product::surpriseBaskets()
            ->where('merchant_id', $user->merchant->id)
            ->with(['category', 'surpriseBasketItems.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $surpriseBaskets,
            'message' => 'Paniers surprise du commerçant récupérés avec succès'
        ]);
    }

    /**
     * Create a new surprise basket
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'surprise_description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'discounted_price' => 'required|numeric|min:0',
            'quantity_available' => 'required|integer|min:1',
            'min_items' => 'nullable|integer|min:1',
            'max_items' => 'nullable|integer|min:1',
            'expiration_date' => 'nullable|date|after:today',
            'image_url' => 'nullable|string|max:500',
            'products' => 'required|array|min:1',
            'products.*.id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        // Calculate total original value
        $totalOriginalValue = 0;
        $productIds = collect($request->products)->pluck('id');
        $products = Product::whereIn('id', $productIds)
            ->where('merchant_id', $user->merchant->id)
            ->get()
            ->keyBy('id');

        foreach ($request->products as $productData) {
            $product = $products->get($productData['id']);
            if ($product) {
                $totalOriginalValue += $product->original_price * $productData['quantity'];
            }
        }

        // Create surprise basket
        $surpriseBasket = Product::create([
            'merchant_id' => $user->merchant->id,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'surprise_description' => $request->surprise_description,
            'original_price' => $totalOriginalValue,
            'discounted_price' => $request->discounted_price,
            'quantity_available' => $request->quantity_available,
            'min_items' => $request->min_items,
            'max_items' => $request->max_items,
            'total_original_value' => $totalOriginalValue,
            'expiration_date' => $request->expiration_date,
            'image_url' => $request->image_url,
            'is_surprise_basket' => true,
            'is_active' => true,
        ]);

        // Add products to basket
        foreach ($request->products as $productData) {
            $product = $products->get($productData['id']);
            if ($product) {
                SurpriseBasketItem::create([
                    'surprise_basket_id' => $surpriseBasket->id,
                    'product_id' => $product->id,
                    'quantity' => $productData['quantity'],
                    'unit_price' => $product->discounted_price,
                ]);
            }
        }

        // Load relationships for response
        $surpriseBasket->load(['merchant', 'category', 'surpriseBasketItems.product']);

        $interestedUsers = User::consumers()
            ->where('id', '!=', $user->id)
            ->where(function ($query) {
                $query->where('prefers_email_notifications', true)
                    ->orWhere('prefers_push_notifications', true)
                    ->orWhere('prefers_sms_notifications', true);
            })
            ->get();

        if ($interestedUsers->isNotEmpty()) {
            Notification::send($interestedUsers, new NewSurpriseBasketNotification($surpriseBasket));
        }

        return response()->json([
            'success' => true,
            'data' => $surpriseBasket,
            'message' => 'Panier surprise créé avec succès'
        ], 201);
    }

    /**
     * Show a specific surprise basket
     */
    public function show(int $id): JsonResponse
    {
        $surpriseBasket = Product::surpriseBaskets()
            ->with(['merchant', 'category', 'surpriseBasketItems.product'])
            ->find($id);

        if (!$surpriseBasket) {
            return response()->json([
                'success' => false,
                'message' => 'Panier surprise non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $surpriseBasket,
            'message' => 'Panier surprise récupéré avec succès'
        ]);
    }

    /**
     * Update a surprise basket
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $surpriseBasket = Product::surpriseBaskets()
            ->where('merchant_id', $user->merchant->id)
            ->find($id);

        if (!$surpriseBasket) {
            return response()->json([
                'success' => false,
                'message' => 'Panier surprise non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'surprise_description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'discounted_price' => 'sometimes|required|numeric|min:0',
            'quantity_available' => 'sometimes|required|integer|min:0',
            'min_items' => 'nullable|integer|min:1',
            'max_items' => 'nullable|integer|min:1',
            'expiration_date' => 'nullable|date',
            'image_url' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $surpriseBasket->update($request->only([
            'name', 'description', 'surprise_description', 'category_id',
            'discounted_price', 'quantity_available', 'min_items', 'max_items',
            'expiration_date', 'image_url', 'is_active'
        ]));

        $surpriseBasket->load(['merchant', 'category', 'surpriseBasketItems.product']);

        return response()->json([
            'success' => true,
            'data' => $surpriseBasket,
            'message' => 'Panier surprise mis à jour avec succès'
        ]);
    }

    /**
     * Delete a surprise basket
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $surpriseBasket = Product::surpriseBaskets()
            ->where('merchant_id', $user->merchant->id)
            ->find($id);

        if (!$surpriseBasket) {
            return response()->json([
                'success' => false,
                'message' => 'Panier surprise non trouvé'
            ], 404);
        }

        $surpriseBasket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Panier surprise supprimé avec succès'
        ]);
    }

    /**
     * Add product to surprise basket
     */
    public function addProduct(Request $request, int $basketId): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $surpriseBasket = Product::surpriseBaskets()
            ->where('merchant_id', $user->merchant->id)
            ->find($basketId);

        if (!$surpriseBasket) {
            return response()->json([
                'success' => false,
                'message' => 'Panier surprise non trouvé'
            ], 404);
        }

        $product = Product::where('merchant_id', $user->merchant->id)
            ->where('is_surprise_basket', false)
            ->find($request->product_id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }

        $success = $surpriseBasket->addItemToBasket($product, $request->quantity);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'ajouter le produit au panier'
            ], 400);
        }

        $surpriseBasket->load(['surpriseBasketItems.product']);

        return response()->json([
            'success' => true,
            'data' => $surpriseBasket,
            'message' => 'Produit ajouté au panier surprise avec succès'
        ]);
    }

    /**
     * Remove product from surprise basket
     */
    public function removeProduct(int $basketId, int $productId): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $surpriseBasket = Product::surpriseBaskets()
            ->where('merchant_id', $user->merchant->id)
            ->find($basketId);

        if (!$surpriseBasket) {
            return response()->json([
                'success' => false,
                'message' => 'Panier surprise non trouvé'
            ], 404);
        }

        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }

        $success = $surpriseBasket->removeItemFromBasket($product);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de retirer le produit du panier'
            ], 400);
        }

        $surpriseBasket->load(['surpriseBasketItems.product']);

        return response()->json([
            'success' => true,
            'data' => $surpriseBasket,
            'message' => 'Produit retiré du panier surprise avec succès'
        ]);
    }
}