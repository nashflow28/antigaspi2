<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(['reservation', 'promotion', 'system']),
            'title' => $this->faker->sentence(6),
            'message' => $this->faker->paragraph(),
            'is_read' => $this->faker->boolean(40),
            'sent_via' => $this->faker->randomElement(['email', 'sms', 'push']),
            'sent_at' => now()->subHours($this->faker->numberBetween(1, 72)),
            'created_at' => now()->subHours($this->faker->numberBetween(1, 72)),
            'updated_at' => now()->subHours($this->faker->numberBetween(1, 48)),
        ];
    }
}
