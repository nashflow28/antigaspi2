<?php

namespace Database\Factories;

use App\Models\AnalyticsDaily;
use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnalyticsDaily>
 */
class AnalyticsDailyFactory extends Factory
{
    protected $model = AnalyticsDaily::class;

    public function definition(): array
    {
        return [
            'date' => now()->subDays($this->faker->numberBetween(0, 30))->toDateString(),
            'merchant_id' => $this->faker->boolean(70) ? Merchant::factory() : null,
            'total_reservations' => $this->faker->numberBetween(0, 50),
            'total_revenue' => $this->faker->randomFloat(2, 100, 5000),
            'products_saved_from_waste' => $this->faker->numberBetween(0, 150),
            'new_users' => $this->faker->numberBetween(0, 20),
            'created_at' => now()->subDays($this->faker->numberBetween(0, 30)),
        ];
    }
}
