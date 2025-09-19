<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Merchant>
 */
class MerchantFactory extends Factory
{
    protected $model = Merchant::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->merchant(),
            'business_name' => $this->faker->company(),
            'business_type' => $this->faker->randomElement(['bakery', 'restaurant', 'grocery', 'cafe']),
            'siret' => $this->faker->unique()->numerify('##############'),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'opening_hours' => [
                'monday' => ['08:00', '18:00'],
                'tuesday' => ['08:00', '18:00'],
                'wednesday' => ['08:00', '18:00'],
                'thursday' => ['08:00', '18:00'],
                'friday' => ['08:00', '18:00'],
            ],
            'is_verified' => $this->faker->boolean(70),
            'verification_date' => now()->subDays($this->faker->numberBetween(1, 365)),
            'total_sales' => $this->faker->randomFloat(2, 1000, 50000),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => [
            'is_verified' => false,
            'verification_date' => null,
        ]);
    }
}
