<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Services\AdminAuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminMerchantController extends Controller
{
    public function __construct(private readonly AdminAuditService $auditService)
    {
    }

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
                    'description' => $merchant->description ?? 'Commerçant en attente de vérification',
                    'rejection_reason' => $merchant->rejection_reason,
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
                    'category' => $product->category?->name ?? 'Non catégorisé',
                    'moderation_status' => $product->moderation_status ?? 'pending',
                    'rejection_reason' => $product->rejection_reason
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

            // Transform all merchants for frontend (AdminMerchantsScreen)
            $allMerchantsData = $merchants->map(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'owner_name' => trim($merchant->user->first_name . ' ' . $merchant->user->last_name),
                    'email' => $merchant->user->email,
                    'phone' => $merchant->user->phone ?? 'Non renseigné',
                    'address' => $merchant->user->address ?? 'Non renseignée',
                    'business_type' => $merchant->business_type ?? 'Non spécifié',
                    'description' => $merchant->description ?? '',
                    'is_verified' => $merchant->is_verified,
                    'verification_date' => $merchant->verification_date,
                    'rejection_reason' => $merchant->rejection_reason,
                    'products_count' => $merchant->products->count(),
                    'created_at' => $merchant->created_at ? $merchant->created_at->toISOString() : now()->toISOString()
                ];
            })->values();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'merchants' => $allMerchantsData,
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
            DB::beginTransaction();

            $merchant = Merchant::findOrFail($id);
            $adminId = Auth::id();

            // Mettre à jour le commerçant
            $merchant->is_verified = true;
            $merchant->verification_date = now();
            $merchant->rejection_reason = null; // Effacer toute raison de rejet précédente

            // Ajouter les champs d'audit si ils existent
            if ($merchant->getConnection()->getSchemaBuilder()->hasColumn('merchants', 'verified_at')) {
                $merchant->verified_at = now();
            }
            if ($merchant->getConnection()->getSchemaBuilder()->hasColumn('merchants', 'verified_by')) {
                $merchant->verified_by = $adminId;
            }

            $merchant->save();

            // Logger l'action dans l'audit trail
            $this->auditService->logMerchantApproval($merchant);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Commerçant approuvé avec succès',
                'data' => [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'is_verified' => true,
                    'verified_at' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du commerçant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a merchant
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:1000'
        ], [
            'reason.required' => 'La raison du rejet est obligatoire',
            'reason.min' => 'La raison doit contenir au moins 10 caractères',
            'reason.max' => 'La raison ne peut pas dépasser 1000 caractères'
        ]);

        try {
            DB::beginTransaction();

            $merchant = Merchant::findOrFail($id);

            // Mettre à jour le commerçant avec la raison du rejet
            $merchant->is_verified = false;
            $merchant->rejection_reason = $data['reason'];
            $merchant->save();

            // Logger l'action dans l'audit trail
            $this->auditService->logMerchantRejection($merchant, $data['reason']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Commerçant rejeté avec succès',
                'data' => [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'is_verified' => false,
                    'rejection_reason' => $data['reason']
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du commerçant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a product
     */
    public function approveProduct(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);
            $adminId = Auth::id();

            // Mettre à jour le produit
            $product->is_active = true;
            $product->rejection_reason = null;

            // Mettre à jour le statut de modération si le champ existe
            if ($product->getConnection()->getSchemaBuilder()->hasColumn('products', 'moderation_status')) {
                $product->moderation_status = 'approved';
            }
            if ($product->getConnection()->getSchemaBuilder()->hasColumn('products', 'approved_at')) {
                $product->approved_at = now();
            }
            if ($product->getConnection()->getSchemaBuilder()->hasColumn('products', 'approved_by')) {
                $product->approved_by = $adminId;
            }

            $product->save();

            // Logger l'action
            $this->auditService->logProductApproval($product);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produit approuvé avec succès',
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'is_active' => true,
                    'moderation_status' => 'approved'
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a product
     */
    public function rejectProduct(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:1000'
        ], [
            'reason.required' => 'La raison du rejet est obligatoire',
            'reason.min' => 'La raison doit contenir au moins 10 caractères',
            'reason.max' => 'La raison ne peut pas dépasser 1000 caractères'
        ]);

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);

            // Mettre à jour le produit avec la raison du rejet
            $product->is_active = false;
            $product->rejection_reason = $data['reason'];

            // Mettre à jour le statut de modération si le champ existe
            if ($product->getConnection()->getSchemaBuilder()->hasColumn('products', 'moderation_status')) {
                $product->moderation_status = 'rejected';
            }

            $product->save();

            // Logger l'action
            $this->auditService->logProductRejection($product, $data['reason']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produit rejeté avec succès',
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'is_active' => false,
                    'rejection_reason' => $data['reason'],
                    'moderation_status' => 'rejected'
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve a flagged reservation
     */
    public function resolveReservation(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'resolution' => 'required|string|in:approved,refunded,cancelled',
            'reason' => 'nullable|string|max:1000'
        ]);

        try {
            DB::beginTransaction();

            $reservation = Reservation::findOrFail($id);

            // Mettre à jour selon la résolution
            switch ($data['resolution']) {
                case 'approved':
                    $reservation->status = 'completed';
                    break;
                case 'refunded':
                    $reservation->status = 'refunded';
                    break;
                case 'cancelled':
                    $reservation->status = 'cancelled';
                    break;
            }

            $reservation->save();

            // Logger l'action
            $this->auditService->logReservationResolution(
                $reservation,
                $data['resolution'],
                $data['reason'] ?? null
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Signalement résolu avec succès',
                'data' => [
                    'id' => $reservation->id,
                    'status' => $reservation->status,
                    'resolution' => $data['resolution']
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du signalement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
