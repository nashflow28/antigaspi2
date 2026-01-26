<?php

namespace Database\Factories;

use App\Models\SearchQuery;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SearchQuery>
 */
class SearchQueryFactory extends Factory
{
    protected $model = SearchQuery::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'query' => $this->faker->words(2, true),
            'search_count' => $this->faker->numberBetween(1, 100),
            'last_results_count' => $this->faker->numberBetween(0, 50),
            'last_searched_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }

    /**
     * Indicate that the search query has no results.
     */
    public function noResults(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_results_count' => 0,
        ]);
    }

    /**
     * Indicate that the search query is popular.
     */
    public function popular(): static
    {
        return $this->state(fn (array $attributes) => [
            'search_count' => $this->faker->numberBetween(50, 500),
        ]);
    }
}
