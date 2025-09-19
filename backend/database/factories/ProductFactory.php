<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $originalPrice = $this->faker->randomFloat(2, 5, 50);
        $discountedPrice = $originalPrice * $this->faker->randomFloat(2, 0.3, 0.8);

        return [
            'merchant_id' => Merchant::factory(),
            'category_id' => Category::factory(),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'original_price' => round($originalPrice, 2),
            'discounted_price' => round($discountedPrice, 2),
            'quantity_available' => $this->faker->numberBetween(1, 20),
            'expiration_date' => now()->addDays($this->faker->numberBetween(1, 7)),
            'image_url' => $this->faker->imageUrl(),
            'is_active' => $this->faker->boolean(85),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expiration_date' => now()->subDay(),
            'is_active' => false,
        ]);
    }
}
