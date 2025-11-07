<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Lister les commandes de l'utilisateur connecté
     * GET /api/orders
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = Order::where('user_id', $user->id)
            ->with(['reservations.product.category', 'reservations.product.merchant'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Créer une nouvelle commande avec plusieurs produits
     * POST /api/orders
     *
     * Body: {
     *   "items": [
     *     { "product_id": 1, "quantity": 2 },
     *     { "product_id": 2, "quantity": 1 }
     *   ],
     *   "notes": "Optionnel"
     * }
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ], [
            'items.required' => 'Vous devez ajouter au moins un produit',
            'items.*.product_id.exists' => 'Un des produits n\'existe pas',
            'items.*.quantity.min' => 'La quantité doit être au moins 1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $items = $request->input('items');

        try {
            DB::beginTransaction();

            // 1. Créer la commande
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => Order::generateOrderNumber(),
                'total_amount' => 0, // Sera calculé après
                'status' => 'pending',
                'payment_status' => 'pending',
                'notes' => $request->input('notes'),
            ]);

            $totalAmount = 0;
            $createdReservations = [];

            // 2. Créer une réservation pour chaque produit
            foreach ($items as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                // Vérifier la disponibilité
                if (!$product->is_active) {
                    throw new \Exception("Le produit '{$product->name}' n'est plus disponible");
                }

                if ($product->quantity_available < $item['quantity']) {
                    throw new \Exception("Stock insuffisant pour '{$product->name}' (demandé: {$item['quantity']}, disponible: {$product->quantity_available})");
                }

                // Vérifier la date d'expiration
                if ($product->expiration_date < now()->toDateString()) {
                    throw new \Exception("Le produit '{$product->name}' a expiré");
                }

                // Calculer le montant
                $itemTotal = $product->discounted_price * $item['quantity'];
                $totalAmount += $itemTotal;

                // Créer la réservation
                $reservation = Reservation::create([
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'quantity_reserved' => $item['quantity'],
                    'total_amount' => $itemTotal,
                    'status' => 'pending',
                    'payment_status' => 'pending',
                    'reserved_at' => now(),
                    'expires_at' => now()->addHours(24), // 24h pour confirmer
                ]);

                // Déduire du stock
                $product->decrement('quantity_available', $item['quantity']);

                $createdReservations[] = $reservation;
            }

            // 3. Mettre à jour le total de la commande
            $order->update(['total_amount' => $totalAmount]);

            DB::commit();

            // Charger les relations pour la réponse
            $order->load(['reservations.product.category', 'reservations.product.merchant']);

            return response()->json([
                'success' => true,
                'message' => 'Commande créée avec succès',
                'data' => [
                    'order' => $order,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'items_count' => count($createdReservations),
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la commande',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Afficher les détails d'une commande
     * GET /api/orders/{id}
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['reservations.product.category', 'reservations.product.merchant'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande non trouvée',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Annuler une commande
     * POST /api/orders/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();

        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande non trouvée',
            ], 404);
        }

        if (!$order->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette commande ne peut plus être annulée (statut: ' . $order->status . ')',
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Restaurer les stocks pour chaque réservation
            foreach ($order->reservations as $reservation) {
                $product = Product::find($reservation->product_id);
                if ($product) {
                    $product->increment('quantity_available', $reservation->quantity_reserved);
                }
            }

            // Annuler la commande (annule aussi les réservations via la méthode)
            $order->cancel();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Commande annulée avec succès',
                'data' => $order->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
