<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoyaltyPointApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_points_are_awarded_and_redeemed(): void
    {
        $consumer = $this->createUser([
            'email' => 'fidelite-consumer@example.com',
            'role' => 'consumer',
        ]);

        $admin = $this->createUser([
            'email' => 'fidelite-admin@example.com',
            'role' => 'admin',
        ]);

        $adminToken = JWTAuth::fromUser($admin);

        $awardResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/loyalty-points', [
                'user_id' => $consumer->id,
                'points' => 100,
                'earned_from' => 'reservation',
                'description' => 'Récompense de fidélité',
            ]);

        $awardResponse->assertCreated()
            ->assertJsonPath('balance', 100);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $consumer->id,
            'points' => 100,
        ]);

        $consumerToken = JWTAuth::fromUser($consumer);

        $redeemResponse = $this->withHeader('Authorization', "Bearer {$consumerToken}")
            ->postJson('/api/loyalty-points/redeem', [
                'points' => 40,
                'description' => 'Utilisation sur une commande',
            ]);

        $redeemResponse->assertOk()
            ->assertJsonPath('balance', 60);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $consumer->id,
            'points' => -40,
        ]);

        $balanceResponse = $this->withHeader('Authorization', "Bearer {$consumerToken}")
            ->getJson('/api/loyalty-points/balance');

        $balanceResponse->assertOk()
            ->assertJsonPath('balance', 60);
    }

    private function createUser(array $overrides = []): User
    {
        $defaults = [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'user' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
            'phone' => '0102030406',
            'role' => 'consumer',
            'city' => 'Lyon',
            'address' => '2 rue de Lyon',
            'is_active' => true,
        ];

        return User::create(array_merge($defaults, $overrides));
    }
}
