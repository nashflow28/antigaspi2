<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(1, 3);

        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'quantity_reserved' => $quantity,
            'total_amount' => $this->faker->randomFloat(2, 5, 60),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'ready', 'completed']),
            'reservation_code' => 'RES' . strtoupper(Str::random(8)),
            'reserved_at' => now()->subHours($this->faker->numberBetween(1, 48)),
            'confirmed_at' => now()->subHours($this->faker->numberBetween(0, 24)),
            'expires_at' => now()->addHours($this->faker->numberBetween(4, 48)),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'confirmed_at' => null,
        ]);
    }
}
