<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Wallet>
 */
class WalletFactory extends Factory
{
    protected $model = Wallet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'balance' => $this->faker->randomFloat(2, 0, 100000),
            'currency' => 'XOF',
            'is_active' => true,
            'pin_hash' => Hash::make('1234'),
            'daily_limit' => 500000.00,
            'daily_spent' => 0.00,
            'daily_spent_date' => now()->toDateString(),
            'last_transaction_at' => null,
            'pin_attempts' => 0,
            'pin_locked_until' => null,
        ];
    }

    /**
     * Indicate that the wallet is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the wallet has a specific balance.
     */
    public function withBalance(float $balance): static
    {
        return $this->state(fn () => [
            'balance' => $balance,
        ]);
    }

    /**
     * Indicate that the wallet PIN is locked.
     */
    public function pinLocked(): static
    {
        return $this->state(fn () => [
            'pin_attempts' => 3,
            'pin_locked_until' => now()->addHour(),
        ]);
    }
}
