<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReservationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_consumer_can_create_reservation_with_quantity_reserved_field(): void
    {
        [$consumer, $merchant, $product] = $this->prepareReservationContext();

        $token = JWTAuth::fromUser($consumer);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/reservations', [
                'product_id' => $product->id,
                'quantity_reserved' => 2,
                'notes' => 'Je récupère ce soir',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.quantity', 2);

        $this->assertEqualsWithDelta(
            (float) ($product->discounted_price * 2),
            $response->json('data.total_amount'),
            0.01
        );

        $this->assertDatabaseHas('reservations', [
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'quantity_reserved' => 2,
        ]);

        $this->assertSame(
            $product->quantity_available - 2,
            $product->fresh()->quantity_available
        );
    }

    public function test_quantity_field_is_rejected_in_favor_of_quantity_reserved(): void
    {
        [$consumer, $merchant, $product] = $this->prepareReservationContext();

        $token = JWTAuth::fromUser($consumer);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/reservations', [
                'product_id' => $product->id,
                'quantity' => 2,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity_reserved']);

        $this->assertDatabaseMissing('reservations', [
            'user_id' => $consumer->id,
            'product_id' => $product->id,
        ]);

        $this->assertSame($product->quantity_available, $product->fresh()->quantity_available);
    }

    private function prepareReservationContext(): array
    {
        $consumer = $this->createUser([
            'email' => 'consumer@example.com',
            'role' => 'consumer',
        ]);

        $merchantUser = $this->createUser([
            'email' => 'merchant@example.com',
            'role' => 'merchant',
        ]);

        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Marchand test',
        ]);

        $category = Category::create([
            'name' => 'Paniers',
            'description' => 'Restes du jour',
            'icon' => 'basket',
            'is_active' => true,
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Panier surprise',
            'description' => 'Panier anti-gaspi',
            'original_price' => 15.00,
            'discounted_price' => 10.50,
            'quantity_available' => 5,
            'expiration_date' => now()->addDay(),
            'is_active' => true,
        ]);

        return [$consumer, $merchant, $product];
    }

    private function createUser(array $overrides = []): User
    {
        $defaults = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'user' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
            'phone' => '0102030405',
            'role' => 'consumer',
            'city' => 'Paris',
            'address' => '1 rue de Paris',
            'is_active' => true,
        ];

        return User::create(array_merge($defaults, $overrides));
    }
}
