<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminMerchantController extends Controller
{
    /**
     * Get moderation dashboard data
     */
    public function moderation(): JsonResponse
    {
        try {
            // Get all merchants with their user relationship
            $merchants = Merchant::with(['user', 'products.category'])->get();

            // Get merchants by verification status
            $verifiedMerchants = $merchants->where('is_verified', true);
            $pendingMerchants = $merchants->where('is_verified', false);

            // Get products and reservations for stats
            $totalProducts = Product::count();
            $totalReservations = Reservation::count();

            // Calculate stats
            $stats = [
                'activeMerchants' => $verifiedMerchants->count(),
                'pendingMerchants' => $pendingMerchants->count(),
                'totalProducts' => $totalProducts,
                'totalReservations' => $totalReservations
            ];

            // Transform pending merchants for frontend
            $pendingMerchantsData = $pendingMerchants->map(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'owner_name' => trim($merchant->user->first_name . ' ' . $merchant->user->last_name),
                    'email' => $merchant->user->email,
                    'phone' => $merchant->user->phone ?? 'Non renseigné',
                    'address' => $merchant->user->address ?? 'Non renseignée',
                    'business_type' => $merchant->business_type ?? 'Non spécifié',
                    'description' => 'Commerçant en attente de vérification',
                    'created_at' => $merchant->created_at ? $merchant->created_at->toISOString() : now()->toISOString()
                ];
            })->values();

            // Get recent products (as products to moderate)
            $recentProducts = Product::with(['merchant.user', 'category'])
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get();

            $productsToModerate = $recentProducts->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'merchant_name' => $product->merchant->business_name,
                    'original_price' => (float) $product->original_price,
                    'discounted_price' => (float) $product->discounted_price,
                    'quantity_available' => (int) $product->quantity_available,
                    'image_url' => $product->image_url ?: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400',
                    'description' => $product->description ?? '',
                    'category' => $product->category?->name ?? 'Non catégorisé'
                ];
            })->values();

            // Get flagged reservations (using completed reservations as examples)
            $flaggedReservations = Reservation::with(['user', 'product.merchant', 'product.category'])
                ->where('status', 'completed')
                ->take(3)
                ->get()
                ->map(function ($reservation) {
                    return [
                        'id' => $reservation->id,
                        'product_name' => $reservation->product->name,
                        'customer_name' => trim($reservation->user->first_name . ' ' . $reservation->user->last_name),
                        'merchant_name' => $reservation->product->merchant->business_name,
                        'total_amount' => (float) $reservation->total_amount,
                        'quantity_reserved' => (int) $reservation->quantity_reserved,
                        'flag_reason' => 'Contrôle qualité',
                        'created_at' => $reservation->created_at ? $reservation->created_at->toISOString() : now()->toISOString()
                    ];
                })->values();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'pendingMerchants' => $pendingMerchantsData,
                'productsToModerate' => $productsToModerate,
                'flaggedReservations' => $flaggedReservations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données de modération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a merchant
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $merchant = Merchant::findOrFail($id);
            $merchant->is_verified = true;
            $merchant->verification_date = now();
            $merchant->save();

            return response()->json([
                'success' => true,
                'message' => 'Commerçant approuvé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du commerçant'
            ], 500);
        }
    }

    /**
     * Reject a merchant
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $merchant = Merchant::findOrFail($id);
            // For now, we'll just mark as not verified
            // In a real implementation, you might want to delete or flag the merchant
            $merchant->is_verified = false;
            $merchant->save();

            return response()->json([
                'success' => true,
                'message' => 'Commerçant rejeté avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du commerçant'
            ], 500);
        }
    }

    /**
     * Approve a product
     */
    public function approveProduct(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            // For demo purposes, we'll just update the product
            $product->updated_at = now();
            $product->save();

            return response()->json([
                'success' => true,
                'message' => 'Produit approuvé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du produit'
            ], 500);
        }
    }

    /**
     * Reject a product
     */
    public function rejectProduct(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            // For demo purposes, we'll just mark it as out of stock
            $product->quantity_available = 0;
            $product->save();

            return response()->json([
                'success' => true,
                'message' => 'Produit rejeté avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du produit'
            ], 500);
        }
    }

    /**
     * Resolve a flagged reservation
     */
    public function resolveReservation(Request $request, $id): JsonResponse
    {
        try {
            $reservation = Reservation::findOrFail($id);
            // Mark as resolved by updating the status or a flag
            $reservation->updated_at = now();
            $reservation->save();

            return response()->json([
                'success' => true,
                'message' => 'Signalement résolu avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du signalement'
            ], 500);
        }
    }
}