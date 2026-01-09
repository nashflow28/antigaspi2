<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ReservationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $consumer;
    private User $merchantUser;
    private Merchant $merchant;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);

        Notification::fake();

        Carbon::setTestNow(Carbon::create(2024, 5, 10, 10, 0, 0, config('app.timezone')));

        // Create consumer
        $this->consumer = User::factory()->create([
            'role' => 'consumer',
            'email' => 'consumer@test.com',
        ]);

        // Create merchant user and merchant
        $this->merchantUser = User::factory()->create([
            'role' => 'merchant',
            'email' => 'merchant@test.com',
        ]);

        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'business_name' => 'Test Shop',
        ]);

        // Create product
        $this->product = Product::factory()->create([
            'merchant_id' => $this->merchant->id,
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

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => 'Bearer ' . $token];
    }

    // ==================== CREATION TESTS ====================

    public function test_can_create_reservation_without_pickup_slot(): void
    {
        $response = $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'payment_method' => PaymentMethod::ON_SITE->value,
        ], $this->actingAsJwt($this->consumer));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pickup_date', '2024-05-10')
            ->assertJsonPath('data.pickup_time', '11:00');

        $this->assertDatabaseHas('reservations', [
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_rejects_past_pickup_date(): void
    {
        $response = $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'payment_method' => PaymentMethod::ON_SITE->value,
            'pickup_date' => Carbon::now()->subDay()->toDateString(),
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pickup_date']);
    }

    public function test_reservation_decrements_product_stock(): void
    {
        $initialStock = $this->product->quantity_available;

        $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'payment_method' => PaymentMethod::ON_SITE->value,
        ], $this->actingAsJwt($this->consumer));

        $this->product->refresh();
        $this->assertEquals($initialStock - 2, $this->product->quantity_available);
    }

    public function test_cannot_reserve_more_than_available_stock(): void
    {
        $response = $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 100, // More than available
            'payment_method' => PaymentMethod::ON_SITE->value,
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(422);
    }

    public function test_cannot_reserve_inactive_product(): void
    {
        $this->product->update(['is_active' => false]);

        $response = $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'payment_method' => PaymentMethod::ON_SITE->value,
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(422);
    }

    public function test_calculates_total_amount_correctly(): void
    {
        $response = $this->postJson('/api/reservations', [
            'product_id' => $this->product->id,
            'quantity' => 3,
            'payment_method' => PaymentMethod::ON_SITE->value,
        ], $this->actingAsJwt($this->consumer));

        $response->assertCreated();

        // 1200 * 3 = 3600
        $this->assertDatabaseHas('reservations', [
            'user_id' => $this->consumer->id,
            'total_amount' => 3600,
        ]);
    }

    // ==================== CANCELLATION TESTS ====================

    public function test_consumer_can_cancel_pending_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'quantity_reserved' => 1,
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/cancel", [], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals('cancelled', $reservation->status);
    }

    public function test_cancellation_restores_product_stock(): void
    {
        $initialStock = $this->product->quantity_available;
        $reservedQuantity = 2;

        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'quantity_reserved' => $reservedQuantity,
        ]);

        // Simulate stock decrease
        $this->product->decrement('quantity_available', $reservedQuantity);

        $this->postJson("/api/reservations/{$reservation->id}/cancel", [], $this->actingAsJwt($this->consumer));

        $this->product->refresh();
        $this->assertEquals($initialStock, $this->product->quantity_available);
    }

    public function test_cannot_cancel_completed_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'completed',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/cancel", [], $this->actingAsJwt($this->consumer));

        $response->assertStatus(400);
    }

    public function test_cannot_cancel_other_users_reservation(): void
    {
        $otherUser = User::factory()->create(['role' => 'consumer']);

        $reservation = Reservation::factory()->create([
            'user_id' => $otherUser->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/cancel", [], $this->actingAsJwt($this->consumer));

        $response->assertStatus(404);
    }

    // ==================== MERCHANT CONFIRMATION TESTS ====================

    public function test_merchant_can_confirm_pending_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/confirm", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals('confirmed', $reservation->status);
    }

    public function test_non_merchant_cannot_confirm_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/confirm", [], $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    public function test_merchant_cannot_confirm_other_merchants_reservation(): void
    {
        // Create another merchant
        $otherMerchantUser = User::factory()->create(['role' => 'merchant']);
        $otherMerchant = Merchant::factory()->create(['user_id' => $otherMerchantUser->id]);
        $otherProduct = Product::factory()->create(['merchant_id' => $otherMerchant->id]);

        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $otherProduct->id,
            'status' => 'pending',
        ]);

        // Try to confirm with different merchant
        $response = $this->postJson("/api/reservations/{$reservation->id}/confirm", [], $this->actingAsJwt($this->merchantUser));

        $response->assertForbidden();
    }

    // ==================== MARK READY TESTS ====================

    public function test_merchant_can_mark_confirmed_reservation_as_ready(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'confirmed',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/ready", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals('ready', $reservation->status);
    }

    public function test_cannot_mark_pending_reservation_as_ready(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/ready", [], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(400);
    }

    // ==================== COMPLETE TESTS ====================

    public function test_merchant_can_complete_ready_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'ready',
            'total_amount' => 1200,
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/complete", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals('completed', $reservation->status);
    }

    public function test_completing_reservation_increments_merchant_sales(): void
    {
        $initialSales = $this->merchant->total_sales;

        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'ready',
            'total_amount' => 1200,
        ]);

        $this->postJson("/api/reservations/{$reservation->id}/complete", [], $this->actingAsJwt($this->merchantUser));

        $this->merchant->refresh();
        $this->assertEquals($initialSales + 1200, $this->merchant->total_sales);
    }

    // ==================== REJECT TESTS ====================

    public function test_merchant_can_reject_pending_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'quantity_reserved' => 2,
        ]);

        $this->product->decrement('quantity_available', 2);

        $response = $this->postJson("/api/reservations/{$reservation->id}/reject", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals('cancelled', $reservation->status);
    }

    // ==================== LIST TESTS ====================

    public function test_consumer_can_list_own_reservations(): void
    {
        Reservation::factory()->count(3)->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
        ]);

        // Create reservations for other user
        $otherUser = User::factory()->create(['role' => 'consumer']);
        Reservation::factory()->count(2)->create([
            'user_id' => $otherUser->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->getJson('/api/reservations', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_reservations_by_status(): void
    {
        Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'completed',
        ]);

        $response = $this->getJson('/api/reservations?status=pending', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    // ==================== MERCHANT RESERVATIONS TESTS ====================

    public function test_merchant_can_list_received_reservations(): void
    {
        Reservation::factory()->count(3)->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->getJson('/api/merchant/reservations', $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_non_merchant_cannot_access_merchant_reservations(): void
    {
        $response = $this->getJson('/api/merchant/reservations', $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== STATISTICS TESTS ====================

    public function test_consumer_can_get_reservation_statistics(): void
    {
        Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'completed',
        ]);

        $response = $this->getJson('/api/reservations/statistics', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'total_reservations',
                    'pending_reservations',
                    'completed_reservations',
                    'cancelled_reservations',
                ],
            ])
            ->assertJsonPath('data.total_reservations', 2)
            ->assertJsonPath('data.pending_reservations', 1)
            ->assertJsonPath('data.completed_reservations', 1);
    }

    // ==================== QUANTITY UPDATE TESTS ====================

    public function test_consumer_can_update_quantity_of_pending_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'quantity_reserved' => 1,
            'total_amount' => 1200,
        ]);

        $response = $this->putJson("/api/reservations/{$reservation->id}/quantity", [
            'quantity' => 2,
        ], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $reservation->refresh();
        $this->assertEquals(2, $reservation->quantity_reserved);
        $this->assertEquals(2400, $reservation->total_amount);
    }

    public function test_cannot_update_quantity_of_confirmed_reservation(): void
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'status' => 'confirmed',
            'quantity_reserved' => 1,
        ]);

        $response = $this->putJson("/api/reservations/{$reservation->id}/quantity", [
            'quantity' => 2,
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(400);
    }
}
