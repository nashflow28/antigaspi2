<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Wallet;
use App\Services\Payments\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService)
    {
    }

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
     *   "payment_method": "wallet|on_site|flooz|tmoney|orange_money|mtn_momo",
     *   "wallet_pin": "1234" (requis si payment_method=wallet),
     *   "notes": "Optionnel"
     * }
     */
    public function store(Request $request)
    {
        // DEBUG: Log the entire request body
        Log::info('OrderController::store - Raw request data', [
            'all' => $request->all(),
            'payment_method_raw' => $request->input('payment_method'),
            'wallet_pin_raw' => $request->has('wallet_pin') ? '[PRESENT]' : '[ABSENT]',
            'content_type' => $request->header('Content-Type'),
        ]);

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'nullable|string|in:wallet,on_site,flooz,tmoney,orange_money,mtn_momo',
            'wallet_pin' => 'nullable|string|digits_between:4,6',
            'notes' => 'nullable|string|max:1000',
        ], [
            'items.required' => 'Vous devez ajouter au moins un produit',
            'items.*.product_id.exists' => 'Un des produits n\'existe pas',
            'items.*.quantity.min' => 'La quantité doit être au moins 1',
            'wallet_pin.digits_between' => 'Le code PIN doit contenir entre 4 et 6 chiffres',
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
        $paymentMethodStr = $request->input('payment_method', 'on_site');
        $walletPin = $request->input('wallet_pin');

        // DEBUG: Log received payment data
        Log::info('Order creation - payment data received', [
            'user_id' => $user->id,
            'payment_method_received' => $request->input('payment_method'),
            'payment_method_used' => $paymentMethodStr,
            'wallet_pin_present' => !empty($walletPin),
            'items_count' => count($items),
            'all_input_keys' => array_keys($request->all()),
        ]);

        // Parse payment method
        try {
            $paymentMethod = PaymentMethod::from($paymentMethodStr);
        } catch (\ValueError $e) {
            $paymentMethod = PaymentMethod::ON_SITE;
        }

        try {
            DB::beginTransaction();

            // Calculate total amount first to validate wallet
            $totalAmount = 0;
            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                if ($product) {
                    $totalAmount += $product->discounted_price * $item['quantity'];
                }
            }

            // Validate wallet balance and PIN BEFORE creating order
            if ($paymentMethod === PaymentMethod::WALLET) {
                $wallet = Wallet::where('user_id', $user->id)->first();

                if (!$wallet) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous n\'avez pas encore de portefeuille. Veuillez d\'abord en créer un.',
                    ], 400);
                }

                if (!$wallet->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Votre portefeuille est désactivé.',
                    ], 400);
                }

                if (!$wallet->pin_hash) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Veuillez d\'abord configurer votre code PIN.',
                    ], 400);
                }

                if (empty($walletPin)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Le code PIN est requis pour les paiements par portefeuille.',
                    ], 400);
                }

                if (!$wallet->verifyPin($walletPin)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Code PIN incorrect.',
                    ], 400);
                }

                if ($wallet->balance < $totalAmount) {
                    return response()->json([
                        'success' => false,
                        'message' => "Solde insuffisant. Votre solde: " . number_format($wallet->balance, 0, ',', ' ') .
                            " F CFA. Montant requis: " . number_format($totalAmount, 0, ',', ' ') . " F CFA.",
                    ], 400);
                }

                if (!$wallet->canSpend($totalAmount)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Limite de dépense quotidienne dépassée.',
                    ], 400);
                }
            }

            // 1. Créer la commande
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => Order::generateOrderNumber(),
                'total_amount' => 0, // Sera calculé après
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethodStr,
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

            // 4. Traiter le paiement pour CHAQUE réservation (comme CartController)
            $payments = [];
            if ($paymentMethod !== PaymentMethod::ON_SITE && count($createdReservations) > 0) {
                try {
                    foreach ($createdReservations as $reservation) {
                        $payment = $this->paymentService->initializePayment(
                            $reservation,
                            $paymentMethod,
                            [
                                'wallet_pin' => $walletPin,
                                'currency' => 'XOF',
                                'notes' => $request->input('notes'),
                            ]
                        );

                        if ($payment) {
                            $payments[] = $payment;
                        }

                        // Vérifier si le paiement wallet a réussi
                        if ($paymentMethod === PaymentMethod::WALLET) {
                            if ($payment && $payment->isSuccessful()) {
                                $reservation->update([
                                    'status' => 'confirmed',
                                    'payment_status' => 'success',
                                ]);
                            } else {
                                throw new \Exception('Le paiement par portefeuille a échoué pour ' . $reservation->product->name);
                            }
                        }
                    }

                    // Si tous les paiements wallet ont réussi, confirmer la commande
                    if ($paymentMethod === PaymentMethod::WALLET) {
                        $order->update([
                            'status' => 'confirmed',
                            'payment_status' => 'success',
                        ]);

                        Log::info('Wallet payments successful for order', [
                            'order_id' => $order->id,
                            'total_amount' => $totalAmount,
                            'payments_count' => count($payments),
                            'user_id' => $user->id,
                        ]);
                    }
                } catch (\Exception $paymentError) {
                    // Rollback: restore stock and cancel reservations
                    foreach ($createdReservations as $reservation) {
                        $product = Product::find($reservation->product_id);
                        if ($product) {
                            $product->increment('quantity_available', $reservation->quantity_reserved);
                        }
                        $reservation->update(['status' => 'cancelled']);
                    }
                    $order->update(['status' => 'cancelled']);

                    throw new \Exception('Erreur de paiement: ' . $paymentError->getMessage());
                }
            }

            DB::commit();

            // 5. Vider le panier après succès (utiliser la relation comme CartController)
            // Re-fetch user to get fresh relationship data
            $freshUser = \App\Models\User::find($user->id);
            $userCart = $freshUser?->cart;

            Log::info('Attempting to clear cart after order', [
                'user_id' => $user->id,
                'cart_found' => $userCart !== null,
                'cart_id' => $userCart?->id,
                'order_id' => $order->id,
            ]);

            if ($userCart) {
                $itemCount = $userCart->items()->count();
                $userCart->items()->delete();
                $userCart->delete();
                Log::info('Cart cleared after successful order', [
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'items_deleted' => $itemCount,
                ]);
            } else {
                Log::warning('No cart found to clear after order', ['user_id' => $user->id]);
            }

            // Charger les relations pour la réponse
            $order->load(['reservations.product.category', 'reservations.product.merchant']);

            // Build response data
            $responseData = [
                'order' => $order,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'total_amount' => $order->total_amount,
                'items_count' => count($createdReservations),
                'payment_status' => $order->payment_status,
            ];

            // For Mobile Money payments, include payment info for status polling
            if ($paymentMethod->requiresExternalProvider() && !empty($payments)) {
                $firstPayment = $payments[0] ?? null;
                if ($firstPayment) {
                    $responseData['payment'] = [
                        'id' => $firstPayment->id,
                        'status' => $firstPayment->status instanceof PaymentStatus
                            ? $firstPayment->status->value
                            : $firstPayment->status,
                        'reference' => $firstPayment->reference,
                        'provider' => $firstPayment->provider,
                        'amount' => $firstPayment->amount,
                    ];
                    $responseData['requires_payment_confirmation'] = true;
                }
            }

            return response()->json([
                'success' => true,
                'message' => $paymentMethod === PaymentMethod::WALLET
                    ? 'Commande créée et payée avec succès'
                    : 'Commande créée avec succès',
                'data' => $responseData,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'items' => $items,
            ]);

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
