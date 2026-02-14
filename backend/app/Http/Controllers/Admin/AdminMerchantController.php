<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Services\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminMerchantController extends Controller
{
    public function __construct(private readonly AdminAuditService $auditService) {}

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
                'totalReservations' => $totalReservations,
            ];

            // Transform pending merchants for frontend
            $pendingMerchantsData = $pendingMerchants->map(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'owner_name' => trim($merchant->user->first_name.' '.$merchant->user->last_name),
                    'email' => $merchant->user->email,
                    'phone' => $merchant->user->phone ?? 'Non renseigné',
                    'address' => $merchant->user->address ?? 'Non renseignée',
                    'business_type' => $merchant->business_type ?? 'Non spécifié',
                    'description' => $merchant->description ?? 'Commerçant en attente de vérification',
                    'rejection_reason' => $merchant->rejection_reason,
                    'created_at' => $merchant->created_at ? $merchant->created_at->toISOString() : now()->toISOString(),
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
                    'rejection_reason' => $product->rejection_reason,
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
                        'customer_name' => trim($reservation->user->first_name.' '.$reservation->user->last_name),
                        'merchant_name' => $reservation->product->merchant->business_name,
                        'total_amount' => (float) $reservation->total_amount,
                        'quantity_reserved' => (int) $reservation->quantity_reserved,
                        'flag_reason' => 'Contrôle qualité',
                        'created_at' => $reservation->created_at ? $reservation->created_at->toISOString() : now()->toISOString(),
                    ];
                })->values();

            // Transform all merchants for frontend (AdminMerchantsScreen)
            $allMerchantsData = $merchants->map(function ($merchant) {
                return [
                    'id' => $merchant->id,
                    'business_name' => $merchant->business_name,
                    'owner_name' => trim($merchant->user->first_name.' '.$merchant->user->last_name),
                    'email' => $merchant->user->email,
                    'phone' => $merchant->user->phone ?? 'Non renseigné',
                    'address' => $merchant->user->address ?? 'Non renseignée',
                    'business_type' => $merchant->business_type ?? 'Non spécifié',
                    'description' => $merchant->description ?? '',
                    'is_verified' => $merchant->is_verified,
                    'verification_date' => $merchant->verification_date,
                    'rejection_reason' => $merchant->rejection_reason,
                    'products_count' => $merchant->products->count(),
                    'created_at' => $merchant->created_at ? $merchant->created_at->toISOString() : now()->toISOString(),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'merchants' => $allMerchantsData,
                'pendingMerchants' => $pendingMerchantsData,
                'productsToModerate' => $productsToModerate,
                'flaggedReservations' => $flaggedReservations,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données de modération',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
                    'verified_at' => now()->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du commerçant',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Reject a merchant
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ], [
            'reason.required' => 'La raison du rejet est obligatoire',
            'reason.min' => 'La raison doit contenir au moins 10 caractères',
            'reason.max' => 'La raison ne peut pas dépasser 1000 caractères',
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
                    'rejection_reason' => $data['reason'],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du commerçant',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
                    'moderation_status' => 'approved',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du produit',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Reject a product
     */
    public function rejectProduct(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ], [
            'reason.required' => 'La raison du rejet est obligatoire',
            'reason.min' => 'La raison doit contenir au moins 10 caractères',
            'reason.max' => 'La raison ne peut pas dépasser 1000 caractères',
        ]);

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);

            // Mettre à jour le produit avec la raison du rejet
            $product->is_active = false;
            $product->rejection_reason = $data['reason'];
            $product->quantity_available = 0;

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
                    'moderation_status' => 'rejected',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du produit',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * List all products for admin (without active/available filtering)
     */
    public function adminProducts(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['merchant.user', 'category']);

            // Server-side filtering by status
            if ($request->has('status')) {
                switch ($request->status) {
                    case 'active':
                        $query->where('is_active', true);
                        break;
                    case 'inactive':
                        $query->where('is_active', false);
                        break;
                    case 'pending':
                        // Guard: Only filter by moderation_status if column exists
                        if (\Schema::hasColumn('products', 'moderation_status')) {
                            $query->where('moderation_status', 'pending');
                        } else {
                            // Fallback: treat all inactive products as "pending"
                            $query->where('is_active', false);
                        }
                        break;
                        // 'all' - no filter
                }
            }

            // Filter by category
            if ($request->has('category_id') && $request->category_id !== 'all') {
                $query->where('category_id', $request->category_id);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('description', 'like', '%'.$search.'%')
                        ->orWhereHas('merchant', function ($mq) use ($search) {
                            $mq->where('business_name', 'like', '%'.$search.'%');
                        });
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $allowedSortFields = ['created_at', 'name', 'discounted_price', 'quantity_available'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = min($request->get('per_page', 50), 100);
            $products = $query->paginate($perPage);

            // Transform data
            $products->getCollection()->transform(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'original_price' => $product->original_price,
                    'discounted_price' => $product->discounted_price,
                    'discount_percentage' => $product->discount_percentage,
                    'quantity_available' => $product->quantity_available,
                    'expiration_date' => $product->expiration_date,
                    'image_url' => $product->image_url,
                    'is_active' => $product->is_active,
                    'is_surprise_basket' => (bool) $product->is_surprise_basket,
                    'moderation_status' => $product->moderation_status ?? 'approved',
                    'needs_approval' => ($product->moderation_status ?? 'approved') === 'pending',
                    'rejection_reason' => $product->rejection_reason,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'icon' => $product->category->icon,
                    ] : null,
                    'merchant' => [
                        'id' => $product->merchant->id,
                        'business_name' => $product->merchant->business_name,
                        'business_type' => $product->merchant->business_type,
                        'city' => $product->merchant->user->city ?? null,
                        'address' => $product->merchant->user->address ?? null,
                        'phone' => $product->merchant->user->phone ?? null,
                        'is_verified' => $product->merchant->is_verified,
                    ],
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    /**
     * Update product status (admin can activate/deactivate any product)
     */
    public function updateProduct(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);

            $validated = $request->validate([
                'is_active' => 'sometimes|boolean',
                'moderation_status' => 'sometimes|string|in:pending,approved,rejected',
            ]);

            // Store original value for audit logging
            $oldIsActive = $product->is_active;

            if (isset($validated['is_active'])) {
                $product->is_active = $validated['is_active'];
            }

            if (isset($validated['moderation_status'])) {
                if ($product->getConnection()->getSchemaBuilder()->hasColumn('products', 'moderation_status')) {
                    $product->moderation_status = $validated['moderation_status'];
                }
            }

            $product->save();

            // Log action with correct signature
            $action = $product->is_active ? 'product_activated' : 'product_deactivated';
            $this->auditService->log(
                $action,
                'product',
                $product->id,
                $product->name,
                null,
                ['is_active' => $oldIsActive],
                ['is_active' => $product->is_active]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produit mis à jour avec succès',
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'is_active' => $product->is_active,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du produit',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
            'reason' => 'nullable|string|max:1000',
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
                    'resolution' => $data['resolution'],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du signalement',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }
}
