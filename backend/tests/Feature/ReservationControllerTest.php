<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $consumer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);

        Carbon::setTestNow(Carbon::create(2024, 5, 10, 10, 0, 0, config('app.timezone')));

        $this->consumer = User::factory()->create([
            'role' => 'consumer',
        ]);

        $this->product = Product::factory()->create([
            'discounted_price' => 1200,
            'original_price' => 1500,
            'quantity_available' => 5,
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_can_create_reservation_without_pickup_slot(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reservations', [
                'product_id' => $this->product->id,
                'quantity' => 1,
                'payment_method' => PaymentMethod::ON_SITE->value,
                // pickup_date and pickup_time intentionally omitted
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pickup_date', '2024-05-10')
            ->assertJsonPath('data.pickup_time', '11:00');

        $this->assertDatabaseHas('reservations', [
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'pickup_date' => '2024-05-10',
            'pickup_time' => '11:00',
        ]);
    }

    public function test_rejects_past_pickup_date(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reservations', [
                'product_id' => $this->product->id,
                'quantity' => 1,
                'payment_method' => PaymentMethod::ON_SITE->value,
                'pickup_date' => Carbon::now()->subDay()->toDateString(),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pickup_date']);
    }
}
