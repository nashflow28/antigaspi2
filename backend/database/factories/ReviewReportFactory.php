<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReviewReport>
 */
class ReviewReportFactory extends Factory
{
    protected $model = ReviewReport::class;

    public function definition(): array
    {
        return [
            'review_id' => Review::factory(),
            'reported_by' => User::factory(),
            'reason' => $this->faker->randomElement([
                'inappropriate_content',
                'spam',
                'fake_review',
                'offensive_language',
                'harassment',
                'copyright_violation',
                'other',
            ]),
            'description' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['pending', 'reviewed', 'resolved']),
            'reviewed_by' => User::factory()->admin(),
            'admin_notes' => $this->faker->optional()->sentence(),
            'reviewed_at' => now()->subDays($this->faker->numberBetween(0, 5)),
        ];
    }
}
