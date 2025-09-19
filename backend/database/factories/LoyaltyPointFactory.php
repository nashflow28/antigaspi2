<?php

namespace Database\Factories;

use App\Models\LoyaltyPoint;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyPoint>
 */
class LoyaltyPointFactory extends Factory
{
    protected $model = LoyaltyPoint::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'points' => $this->faker->numberBetween(5, 50),
            'earned_from' => $this->faker->randomElement(['reservation', 'review', 'referral', 'bonus', 'redemption']),
            'reference_id' => $this->faker->randomNumber(),
            'description' => $this->faker->sentence(),
            'expires_at' => $this->faker->optional()->dateTimeBetween('+1 month', '+6 months'),
            'created_at' => now()->subDays($this->faker->numberBetween(1, 30)),
            'updated_at' => now()->subDays($this->faker->numberBetween(0, 30)),
        ];
    }
}
