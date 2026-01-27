<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\SurpriseBasket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SurpriseBasket>
 */
class SurpriseBasketFactory extends Factory
{
    protected $model = SurpriseBasket::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $originalPrice = $this->faker->numberBetween(5000, 20000);
        $discountPercentage = $this->faker->numberBetween(20, 50);
        $discountedPrice = (int) ($originalPrice * (1 - $discountPercentage / 100));

        return [
            'merchant_id' => Merchant::factory(),
            'category_id' => Category::factory(),
            'name' => 'Panier Surprise '.$this->faker->word(),
            'description' => $this->faker->sentence(10),
            'original_price' => $originalPrice,
            'discounted_price' => $discountedPrice,
            'quantity_available' => $this->faker->numberBetween(1, 10),
            'is_surprise_basket' => true,
            'is_active' => true,
            'expiration_date' => now()->addDays($this->faker->numberBetween(1, 7)),
        ];
    }

    /**
     * Indicate that the basket is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the basket is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiration_date' => now()->subDay(),
        ]);
    }

    /**
     * Indicate that the basket has a specific discount.
     */
    public function withDiscount(int $percentage): static
    {
        return $this->state(function (array $attributes) use ($percentage) {
            $originalPrice = $attributes['original_price'] ?? 10000;

            return [
                'discounted_price' => (int) ($originalPrice * (1 - $percentage / 100)),
            ];
        });
    }
}
