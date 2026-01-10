<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $method = $this->faker->randomElement(PaymentMethod::cases());
        $status = $this->faker->randomElement(PaymentStatus::cases());

        return [
            'reservation_id' => Reservation::factory(),
            'amount' => $this->faker->randomFloat(2, 5, 60),
            'currency' => 'XOF',
            'payment_method' => $method,
            'transaction_id' => $this->faker->uuid(),
            'status' => $status,
            'provider' => $method->provider(),
            'checkout_url' => $status === PaymentStatus::PENDING ? $this->faker->url() : null,
            'customer_phone' => $method->requiresPhone() ? '+228'.$this->faker->numberBetween(90000000, 99999999) : null,
            'reference' => strtoupper(Str::random(12)),
            'payload' => [
                'gateway' => $method->provider(),
                'meta' => [
                    'attempts' => 1,
                    'status_history' => [$status->value],
                ],
            ],
            'paid_at' => $status === PaymentStatus::SUCCESS ? now()->subMinutes($this->faker->numberBetween(1, 90)) : null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::SUCCESS,
            'paid_at' => now(),
        ]);
    }
}
