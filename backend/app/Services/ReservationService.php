<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationStatusNotification;
use App\Services\Payments\PaymentService;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    public function __construct(private readonly PaymentService $payments)
    {
    }

    /**
     * @return array{0: Reservation, 1: Payment|null}
     * @throws ValidationException
     */
    public function createReservation(
        User $user,
        Product $product,
        int $quantity,
        PaymentMethod $paymentMethod,
        array $options = []
    ): array {
        // 🐛 BUG FIX #10: Reload product from database AFTER lock to get fresh stock value
        // This prevents race conditions where stock was checked before lock but changed during lock acquisition
        $product->refresh();

        if ($product->quantity_available < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => ["Stock insuffisant. Disponible: {$product->quantity_available}"],
            ]);
        }

        // 🐛 BUG FIX #11: Verify product is still active (additional safety check)
        if (!$product->is_active) {
            throw ValidationException::withMessages([
                'product' => ['Ce produit n\'est plus disponible.'],
            ]);
        }

        // 🐛 BUG FIX #12: Verify product is not expired (additional safety check)
        if ($product->isExpired()) {
            throw ValidationException::withMessages([
                'product' => ['Ce produit est expiré et n\'est plus disponible.'],
            ]);
        }

        $totalAmount = $product->discounted_price * $quantity;

        /** @var Reservation $reservation */
        $reservation = Reservation::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => $quantity,
            'total_amount' => $totalAmount,
            'status' => 'pending',
            'notes' => $options['notes'] ?? null,
            'pickup_date' => $options['pickup_date'] ?? null,
            'pickup_time' => $options['pickup_time'] ?? null,
        ]);

        $product->decrement('quantity_available', $quantity);

        $payment = null;
        if ($paymentMethod !== PaymentMethod::ON_SITE) {
            try {
                $payment = $this->payments->initializePayment($reservation, $paymentMethod, [
                    'customer_phone' => $options['customer_phone'] ?? null,
                    'customer_email' => $options['customer_email'] ?? null,
                    'currency' => $options['currency'] ?? config('payments.currency', 'XOF'),
                    'notes' => $options['notes'] ?? null,
                    'wallet_pin' => $options['wallet_pin'] ?? null,
                ]);
            } catch (\Throwable $exception) {
                Log::warning('Payment initialization failed: ' . $exception->getMessage());
            }
        }

        $reservation->load(['product.category', 'product.merchant.user']);
        $reservation->setRelation('user', $user);

        $user->notify(new ReservationStatusNotification($reservation));

        return [$reservation, $payment];
    }
}
