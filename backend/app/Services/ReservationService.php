<?php

namespace App\Services;

use Carbon\Carbon;
use App\Enums\PaymentMethod;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Wallet;
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
        // 🐛 BUG FIX #29: Add comprehensive input validation
        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['La quantité doit être un nombre positif.'],
            ]);
        }

        if ($quantity > 100) {
            throw ValidationException::withMessages([
                'quantity' => ['La quantité maximale est de 100 unités par réservation.'],
            ]);
        }

        // Validate pickup_date if provided
        if (!empty($options['pickup_date'])) {
            try {
                $pickupDate = Carbon::parse($options['pickup_date']);

                // Autoriser les retraits le jour même tout en empêchant les dates passées
                if ($pickupDate->isBefore(Carbon::today())) {
                    throw ValidationException::withMessages([
                        'pickup_date' => ['La date de récupération doit être dans le futur.'],
                    ]);
                }
            } catch (\Carbon\Exceptions\InvalidFormatException $e) {
                throw ValidationException::withMessages([
                    'pickup_date' => ['Format de date invalide.'],
                ]);
            }
        }

        // Validate pickup_time if provided
        if (!empty($options['pickup_time']) && !preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $options['pickup_time'])) {
            throw ValidationException::withMessages([
                'pickup_time' => ['Format d\'heure invalide (HH:MM attendu).'],
            ]);
        }

        // Validate currency if provided
        if (!empty($options['currency']) && $options['currency'] !== 'XOF') {
            throw ValidationException::withMessages([
                'currency' => ['Seule la devise XOF est acceptée.'],
            ]);
        }

        // Validate wallet_pin if provided
        if (!empty($options['wallet_pin']) && !preg_match('/^\d{4,6}$/', $options['wallet_pin'])) {
            throw ValidationException::withMessages([
                'wallet_pin' => ['Le code PIN doit contenir entre 4 et 6 chiffres.'],
            ]);
        }

        // Validate notes length if provided
        if (!empty($options['notes']) && strlen($options['notes']) > 500) {
            throw ValidationException::withMessages([
                'notes' => ['Les notes ne peuvent pas dépasser 500 caractères.'],
            ]);
        }

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

        // 🐛 BUG FIX #29: Validate product price is positive
        if ($product->discounted_price <= 0) {
            throw ValidationException::withMessages([
                'product' => ['Le prix du produit est invalide.'],
            ]);
        }

        $totalAmount = $product->discounted_price * $quantity;

        // 🐛 BUG FIX #29: Ensure total amount is reasonable (max 1,000,000 XOF per transaction)
        if ($totalAmount > 1000000) {
            throw ValidationException::withMessages([
                'quantity' => ['Le montant total dépasse la limite autorisée de 1,000,000 XOF.'],
            ]);
        }

        // 🐛 BUG FIX: Validate wallet balance BEFORE creating reservation
        if ($paymentMethod === PaymentMethod::WALLET) {
            $wallet = Wallet::where('user_id', $user->id)->first();

            if (!$wallet) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Vous n\'avez pas encore de portefeuille. Veuillez d\'abord en créer un.'],
                ]);
            }

            if (!$wallet->is_active) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Votre portefeuille est désactivé.'],
                ]);
            }

            if (!$wallet->pin_hash) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Veuillez d\'abord configurer votre code PIN.'],
                ]);
            }

            if ($wallet->balance < $totalAmount) {
                throw ValidationException::withMessages([
                    'payment_method' => [
                        "Solde insuffisant. Votre solde: " . number_format($wallet->balance, 0, ',', ' ') .
                        " F CFA. Montant requis: " . number_format($totalAmount, 0, ',', ' ') . " F CFA."
                    ],
                ]);
            }
        }

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
