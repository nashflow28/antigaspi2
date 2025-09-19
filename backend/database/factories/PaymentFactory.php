<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'amount' => $this->faker->randomFloat(2, 5, 60),
            'currency' => 'EUR',
            'payment_method' => $this->faker->randomElement(['card', 'cash', 'wallet']),
            'transaction_id' => $this->faker->uuid(),
            'status' => $this->faker->randomElement(['pending', 'completed', 'failed']),
            'provider_response' => ['provider' => 'stripe', 'status' => 'ok'],
            'paid_at' => now()->subMinutes($this->faker->numberBetween(5, 120)),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
        ]);
    }
}
