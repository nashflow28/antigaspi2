<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'merchant_id' => Merchant::factory(),
            'product_id' => Product::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'title' => $this->faker->sentence(4),
            'comment' => $this->faker->paragraph(),
            'merchant_response' => $this->faker->optional()->sentence(),
            'merchant_response_at' => $this->faker->optional()->dateTimeBetween('-1 week', 'now'),
            'merchant_response_updated_at' => $this->faker->optional()->dateTimeBetween('-1 week', 'now'),
            'is_verified_purchase' => $this->faker->boolean(70),
            'is_approved' => true,
            'approved_at' => now()->subDays($this->faker->numberBetween(1, 10)),
        ];
    }
}
