<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\CheckoutCartRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ReservationResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class CartController extends Controller
{
    public function __construct(private readonly ReservationService $reservations) {}

    public function show(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cart = $user->cart?->load(['items.product', 'merchant']);

        return response()->json([
            'success' => true,
            'data' => $cart ? new CartResource($cart) : null,
        ]);
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $product = Product::with('merchant')->findOrFail($request->product_id);

        $cart = $user->cart;
        if (! $cart) {
            $cart = Cart::create([
                'user_id' => $user->id,
                'merchant_id' => $product->merchant_id,
                'total_amount' => 0,
            ]);
        }

        if ($cart->merchant_id !== $product->merchant_id) {
            throw ValidationException::withMessages([
                'product_id' => 'Votre panier contient déjà des produits d\'un autre commerce.',
            ]);
        }

        $item = $cart->items()->where('product_id', $product->id)->first();
        if ($item) {
            $item->quantity += $request->quantity;
            $item->unit_price = $product->discounted_price;
            $item->updateTotals();
        } else {
            $item = $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $request->quantity,
                'unit_price' => $product->discounted_price,
                'total_price' => $product->discounted_price * $request->quantity,
            ]);
        }

        $cart->refreshTotals();
        $cart->load(['items.product', 'merchant']);

        return response()->json([
            'success' => true,
            'message' => 'Produit ajouté au panier',
            'data' => new CartResource($cart),
        ], 201);
    }

    public function updateItem(UpdateCartItemRequest $request, CartItem $item): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cart = $user->cart;

        if (! $cart || $item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Article introuvable dans votre panier',
            ], 404);
        }

        $item->quantity = $request->quantity;
        $item->unit_price = $item->product->discounted_price;
        $item->updateTotals();

        $cart->refreshTotals();
        $cart->load(['items.product', 'merchant']);

        return response()->json([
            'success' => true,
            'message' => 'Panier mis à jour',
            'data' => new CartResource($cart),
        ]);
    }

    public function removeItem(CartItem $item): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cart = $user->cart;

        if (! $cart || $item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Article introuvable dans votre panier',
            ], 404);
        }

        $item->delete();
        $cart->refreshTotals();

        if ($cart->isEmpty()) {
            $cart->delete();

            return response()->json([
                'success' => true,
                'message' => 'Panier vidé',
                'data' => null,
            ]);
        }

        $cart->load(['items.product', 'merchant']);

        return response()->json([
            'success' => true,
            'message' => 'Article supprimé du panier',
            'data' => new CartResource($cart),
        ]);
    }

    public function clear(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cart = $user->cart;

        if ($cart) {
            $cart->items()->delete();
            $cart->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Panier vidé',
            'data' => null,
        ]);
    }

    public function checkout(CheckoutCartRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cart = $user->cart?->load(['items.product' => function ($query) {
            $query->lockForUpdate();
        }, 'merchant']);

        if (! $cart || $cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Votre panier est vide.',
            ], 400);
        }

        try {
            return DB::transaction(function () use ($cart, $request, $user) {
                $reservations = [];
                $payments = [];
                $paymentMethod = PaymentMethod::from($request->input('payment_method'));

                foreach ($cart->items as $item) {
                    $product = Product::lockForUpdate()->find($item->product_id);
                    if (! $product || ! $product->is_active || $product->isExpired()) {
                        throw ValidationException::withMessages([
                            'cart' => 'Un des produits du panier n\'est plus disponible.',
                        ]);
                    }

                    if ($product->quantity_available < $item->quantity) {
                        throw ValidationException::withMessages([
                            'cart' => "Stock insuffisant pour {$product->name}. Disponible: {$product->quantity_available}",
                        ]);
                    }

                    [$reservation, $payment] = $this->reservations->createReservation(
                        $user,
                        $product,
                        $item->quantity,
                        $paymentMethod,
                        [
                            'notes' => $request->input('notes'),
                            'pickup_date' => $request->input('pickup_date'),
                            'pickup_time' => $request->input('pickup_time'),
                            'customer_phone' => $request->input('customer_phone'),
                            'customer_email' => $request->input('customer_email'),
                            'currency' => $request->input('currency', config('payments.currency', 'XOF')),
                            'wallet_pin' => $request->input('wallet_pin'),
                        ]
                    );

                    $reservations[] = $reservation;
                    if ($payment) {
                        $payments[] = $payment;
                    }
                }

                $cart->items()->delete();
                $cart->delete();

                $reservationData = collect($reservations)
                    ->map(fn ($reservation) => (new ReservationResource($reservation))->toArray(request()))
                    ->all();

                $response = [
                    'success' => true,
                    'message' => 'Réservations créées avec succès',
                    'data' => $reservationData,
                ];

                if (! empty($payments)) {
                    $response['payments'] = collect($payments)
                        ->map(fn ($payment) => (new PaymentResource($payment))->toArray(request()))
                        ->all();
                }

                return response()->json($response, 201);
            });
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de finaliser la réservation.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation du panier.',
                'error' => \App\Helpers\ErrorHelper::safeMessage($exception),
            ], 500);
        }
    }
}
