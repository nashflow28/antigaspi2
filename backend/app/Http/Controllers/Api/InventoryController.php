<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Notification as NotificationModel;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class InventoryController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user->isMerchant() || ! $user->merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants',
            ], 403);
        }

        $products = Product::where('merchant_id', $user->merchant->id)
            ->select(['id', 'name', 'quantity_available', 'low_stock_threshold', 'last_low_stock_alert_at'])
            ->orderBy('name')
            ->get();

        $totalProducts = $products->count();
        $totalQuantity = $products->sum('quantity_available');
        $lowStock = $products->filter->isLowStock();

        $recentMovements = InventoryMovement::with('product:id,name')
            ->where('merchant_id', $user->merchant->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (InventoryMovement $movement) {
                return [
                    'id' => $movement->id,
                    'product' => [
                        'id' => $movement->product?->id,
                        'name' => $movement->product?->name,
                    ],
                    'type' => $movement->movement_type,
                    'quantity_change' => $movement->quantity_change,
                    'quantity_after' => $movement->quantity_after,
                    'reason' => $movement->reason,
                    'reference' => $movement->reference,
                    'created_at' => $movement->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => [
                    'total_products' => $totalProducts,
                    'total_quantity' => $totalQuantity,
                    'low_stock_products' => $lowStock->count(),
                ],
                'low_stock_items' => $lowStock->map(function (Product $product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'quantity_available' => $product->quantity_available,
                        'low_stock_threshold' => $product->low_stock_threshold,
                        'last_low_stock_alert_at' => $product->last_low_stock_alert_at,
                    ];
                })->values(),
                'recent_movements' => $recentMovements,
            ],
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user->isMerchant() || ! $user->merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants',
            ], 403);
        }

        $validated = $request->validate([
            'product_id' => ['nullable', 'integer'],
            'type' => ['nullable', Rule::in(['stock_in', 'stock_out', 'adjustment'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = InventoryMovement::with('product:id,name')
            ->where('merchant_id', $user->merchant->id)
            ->orderByDesc('created_at');

        if (! empty($validated['product_id'])) {
            $query->where('product_id', $validated['product_id']);
        }

        if (! empty($validated['type'])) {
            $query->where('movement_type', $validated['type']);
        }

        if (! empty($validated['from'])) {
            $query->whereDate('created_at', '>=', $validated['from']);
        }

        if (! empty($validated['to'])) {
            $query->whereDate('created_at', '<=', $validated['to']);
        }

        $perPage = Arr::get($validated, 'per_page', 20);
        $movements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $movements->getCollection()->map(function (InventoryMovement $movement) {
                return [
                    'id' => $movement->id,
                    'product' => [
                        'id' => $movement->product?->id,
                        'name' => $movement->product?->name,
                    ],
                    'type' => $movement->movement_type,
                    'quantity_change' => $movement->quantity_change,
                    'quantity_after' => $movement->quantity_after,
                    'reason' => $movement->reason,
                    'reference' => $movement->reference,
                    'created_at' => $movement->created_at,
                ];
            }),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user->isMerchant() || ! $user->merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux commerçants',
            ], 403);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'type' => ['required', Rule::in(['stock_in', 'stock_out', 'adjustment'])],
            'quantity' => ['required', 'integer', 'min:0'],
            'reason' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:120'],
            'meta' => ['nullable', 'array'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        if (in_array($validated['type'], ['stock_in', 'stock_out'], true) && $validated['quantity'] <= 0) {
            throw ValidationException::withMessages([
                'quantity' => __('La quantité doit être supérieure à 0 pour ce type de mouvement.'),
            ]);
        }

        [$movement, $product] = DB::transaction(function () use ($validated, $user) {
            $product = Product::where('id', $validated['product_id'])
                ->where('merchant_id', $user->merchant->id)
                ->lockForUpdate()
                ->first();

            if (! $product) {
                throw ValidationException::withMessages([
                    'product_id' => __('Produit introuvable pour ce commerçant.'),
                ]);
            }

            $originalQuantity = $product->quantity_available;
            $change = 0;
            $newQuantity = $originalQuantity;

            switch ($validated['type']) {
                case 'stock_in':
                    $change = $validated['quantity'];
                    $newQuantity = $originalQuantity + $change;
                    break;
                case 'stock_out':
                    $change = -$validated['quantity'];
                    $newQuantity = $originalQuantity + $change;

                    if ($newQuantity < 0) {
                        throw ValidationException::withMessages([
                            'quantity' => __('Stock insuffisant pour effectuer cette sortie.'),
                        ]);
                    }
                    break;
                case 'adjustment':
                    $newQuantity = $validated['quantity'];
                    $change = $newQuantity - $originalQuantity;
                    break;
            }

            if ($change === 0) {
                throw ValidationException::withMessages([
                    'quantity' => __('Aucun changement de stock détecté.'),
                ]);
            }

            if (array_key_exists('low_stock_threshold', $validated) && $validated['low_stock_threshold'] !== null) {
                $product->low_stock_threshold = $validated['low_stock_threshold'];
            }

            $product->quantity_available = $newQuantity;

            if ($product->low_stock_threshold > 0 && $newQuantity > $product->low_stock_threshold) {
                $product->last_low_stock_alert_at = null;
            }

            $product->save();

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'merchant_id' => $user->merchant->id,
                'user_id' => $user->id,
                'movement_type' => $validated['type'],
                'quantity_change' => $change,
                'quantity_after' => $product->quantity_available,
                'reason' => $validated['reason'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'meta' => $validated['meta'] ?? null,
            ]);

            return [$movement, $product->fresh()];
        });

        if ($product->isLowStock()) {
            $this->sendLowStockAlert($product);
        }

        return response()->json([
            'success' => true,
            'message' => __('Mouvement d\'inventaire enregistré avec succès.'),
            'data' => [
                'movement' => [
                    'id' => $movement->id,
                    'type' => $movement->movement_type,
                    'quantity_change' => $movement->quantity_change,
                    'quantity_after' => $movement->quantity_after,
                    'reason' => $movement->reason,
                    'reference' => $movement->reference,
                    'created_at' => $movement->created_at,
                ],
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'quantity_available' => $product->quantity_available,
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'is_low_stock' => $product->isLowStock(),
                ],
            ],
        ], 201);
    }

    protected function sendLowStockAlert(Product $product): void
    {
        if ($product->low_stock_threshold <= 0) {
            return;
        }

        if ($product->last_low_stock_alert_at && $product->last_low_stock_alert_at->gt(now()->subHours(6))) {
            return;
        }

        $merchant = $product->merchant;

        if (! $merchant || ! $merchant->user) {
            return;
        }

        $product->forceFill([
            'last_low_stock_alert_at' => now(),
        ])->save();

        NotificationModel::create([
            'user_id' => $merchant->user->id,
            'type' => 'inventory.low_stock',
            'title' => __('Stock faible pour :product', ['product' => $product->name]),
            'message' => __('Il reste :quantity articles pour :product. Pensez à réapprovisionner.', [
                'quantity' => $product->quantity_available,
                'product' => $product->name,
            ]),
            'is_read' => false,
            'sent_via' => 'in_app',
            'sent_at' => null,
        ]);
    }
}
