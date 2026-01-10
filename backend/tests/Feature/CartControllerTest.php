<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);
    }

    public function test_consumer_can_add_items_and_checkout_cart(): void
    {
        $user = User::factory()->create(['role' => 'consumer', 'email' => 'consumer@example.com']);
        $category = Category::factory()->create();
        $merchant = Merchant::factory()->create([
            'business_type' => 'boulangerie',
        ]);

        $productA = Product::factory()->create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'quantity_available' => 5,
            'discounted_price' => 10.00,
            'is_active' => true,
        ]);

        $productB = Product::factory()->create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'quantity_available' => 4,
            'discounted_price' => 8.50,
            'is_active' => true,
        ]);

        $token = auth('api')->login($user);
        $headers = ['Authorization' => 'Bearer '.$token];

        $this->withHeaders($headers)->postJson('/api/cart/items', [
            'product_id' => $productA->id,
            'quantity' => 2,
        ])->assertCreated();

        $this->withHeaders($headers)->postJson('/api/cart/items', [
            'product_id' => $productB->id,
            'quantity' => 1,
        ])->assertCreated();

        $pickupDate = now()->format('Y-m-d');
        $pickupTime = now()->addHours(2)->format('H:i');

        $response = $this->withHeaders($headers)->postJson('/api/cart/checkout', [
            'payment_method' => PaymentMethod::ON_SITE->value,
            'pickup_date' => $pickupDate,
            'pickup_time' => $pickupTime,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseCount('reservations', 2);
        $this->assertDatabaseMissing('carts', ['user_id' => $user->id]);

        $reservationTotals = Reservation::sum('total_amount');
        $this->assertEqualsWithDelta(28.5, (float) $reservationTotals, 0.01);
    }

    public function test_cart_rejects_products_from_different_merchants(): void
    {
        $user = User::factory()->create(['role' => 'consumer', 'email' => 'consumer@example.com']);
        $category = Category::factory()->create();
        $merchantA = Merchant::factory()->create([
            'business_type' => 'boulangerie',
        ]);
        $merchantB = Merchant::factory()->create([
            'business_type' => 'supermarche',
        ]);

        $productA = Product::factory()->create([
            'merchant_id' => $merchantA->id,
            'category_id' => $category->id,
            'quantity_available' => 5,
            'is_active' => true,
        ]);

        $productB = Product::factory()->create([
            'merchant_id' => $merchantB->id,
            'category_id' => $category->id,
            'quantity_available' => 5,
            'is_active' => true,
        ]);

        $token = auth('api')->login($user);
        $headers = ['Authorization' => 'Bearer '.$token];

        $this->withHeaders($headers)->postJson('/api/cart/items', [
            'product_id' => $productA->id,
            'quantity' => 1,
        ])->assertCreated();

        $this->withHeaders($headers)->postJson('/api/cart/items', [
            'product_id' => $productB->id,
            'quantity' => 1,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);
    }
}
