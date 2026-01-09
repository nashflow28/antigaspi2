<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\SurpriseBasket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class SurpriseBasketControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $consumer;
    private User $merchantUser;
    private Merchant $merchant;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);

        $this->consumer = User::factory()->create(['role' => 'consumer']);

        $this->merchantUser = User::factory()->create(['role' => 'merchant']);
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'business_name' => 'Test Shop',
        ]);

        $this->category = Category::factory()->create(['name' => 'Mixte']);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => 'Bearer ' . $token];
    }

    // ==================== LIST BASKETS TESTS ====================

    public function test_consumer_can_list_available_surprise_baskets(): void
    {
        SurpriseBasket::factory()->count(3)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'quantity_available' => 5,
        ]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_list_excludes_inactive_baskets(): void
    {
        SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'quantity_available' => 5,
        ]);

        SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => false,
            'quantity_available' => 5,
        ]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_excludes_baskets_with_zero_quantity(): void
    {
        SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'quantity_available' => 5,
        ]);

        SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
            'quantity_available' => 0,
        ]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ==================== MERCHANT BASKETS TESTS ====================

    public function test_merchant_can_list_own_baskets(): void
    {
        SurpriseBasket::factory()->count(2)->create([
            'merchant_id' => $this->merchant->id,
        ]);

        // Another merchant's basket
        $otherMerchant = Merchant::factory()->create();
        SurpriseBasket::factory()->create([
            'merchant_id' => $otherMerchant->id,
        ]);

        $response = $this->getJson('/api/merchant/surprise-baskets', $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_consumer_cannot_access_merchant_baskets_endpoint(): void
    {
        $response = $this->getJson('/api/merchant/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== CREATE BASKET TESTS ====================

    public function test_merchant_can_create_surprise_basket(): void
    {
        $response = $this->postJson('/api/merchant/surprise-baskets', [
            'name' => 'Panier Mystère',
            'description' => 'Un panier surprise avec des produits variés',
            'original_price' => 5000,
            'discounted_price' => 2500,
            'quantity_available' => 10,
            'pickup_start' => '17:00',
            'pickup_end' => '19:00',
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Panier Mystère');

        $this->assertDatabaseHas('surprise_baskets', [
            'merchant_id' => $this->merchant->id,
            'name' => 'Panier Mystère',
            'discounted_price' => 2500,
        ]);
    }

    public function test_consumer_cannot_create_surprise_basket(): void
    {
        $response = $this->postJson('/api/merchant/surprise-baskets', [
            'name' => 'Hack Basket',
            'original_price' => 5000,
            'discounted_price' => 2500,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    public function test_create_basket_requires_name(): void
    {
        $response = $this->postJson('/api/merchant/surprise-baskets', [
            'original_price' => 5000,
            'discounted_price' => 2500,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_basket_requires_valid_prices(): void
    {
        $response = $this->postJson('/api/merchant/surprise-baskets', [
            'name' => 'Test Basket',
            'original_price' => -100,
            'discounted_price' => 2500,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422);
    }

    public function test_discounted_price_must_be_less_than_original(): void
    {
        $response = $this->postJson('/api/merchant/surprise-baskets', [
            'name' => 'Test Basket',
            'original_price' => 2000,
            'discounted_price' => 5000, // Higher than original
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422);
    }

    // ==================== SHOW BASKET TESTS ====================

    public function test_can_view_single_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/surprise-baskets/{$basket->id}", $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $basket->id);
    }

    public function test_cannot_view_inactive_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/surprise-baskets/{$basket->id}", $this->actingAsJwt($this->consumer));

        $response->assertNotFound();
    }

    // ==================== UPDATE BASKET TESTS ====================

    public function test_merchant_can_update_own_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'name' => 'Old Name',
        ]);

        $response = $this->putJson("/api/merchant/surprise-baskets/{$basket->id}", [
            'name' => 'New Name',
            'quantity_available' => 20,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('surprise_baskets', [
            'id' => $basket->id,
            'name' => 'New Name',
            'quantity_available' => 20,
        ]);
    }

    public function test_merchant_cannot_update_other_merchants_basket(): void
    {
        $otherMerchantUser = User::factory()->create(['role' => 'merchant']);
        $otherMerchant = Merchant::factory()->create(['user_id' => $otherMerchantUser->id]);

        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $otherMerchant->id,
        ]);

        $response = $this->putJson("/api/merchant/surprise-baskets/{$basket->id}", [
            'name' => 'Hacked Name',
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertForbidden();
    }

    // ==================== DELETE BASKET TESTS ====================

    public function test_merchant_can_delete_own_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $response = $this->deleteJson("/api/merchant/surprise-baskets/{$basket->id}", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('surprise_baskets', [
            'id' => $basket->id,
        ]);
    }

    public function test_merchant_cannot_delete_other_merchants_basket(): void
    {
        $otherMerchantUser = User::factory()->create(['role' => 'merchant']);
        $otherMerchant = Merchant::factory()->create(['user_id' => $otherMerchantUser->id]);

        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $otherMerchant->id,
        ]);

        $response = $this->deleteJson("/api/merchant/surprise-baskets/{$basket->id}", [], $this->actingAsJwt($this->merchantUser));

        $response->assertForbidden();
    }

    // ==================== ADD/REMOVE PRODUCT TESTS ====================

    public function test_merchant_can_add_product_to_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $product = Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/merchant/surprise-baskets/{$basket->id}/products", [
            'product_id' => $product->id,
            'quantity' => 2,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_cannot_add_other_merchants_product_to_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $otherMerchant = Merchant::factory()->create();
        $product = Product::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->postJson("/api/merchant/surprise-baskets/{$basket->id}/products", [
            'product_id' => $product->id,
            'quantity' => 1,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422);
    }

    public function test_merchant_can_remove_product_from_basket(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
        ]);

        $product = Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
        ]);

        // First add the product
        $basket->products()->attach($product->id, ['quantity' => 1]);

        $response = $this->deleteJson("/api/merchant/surprise-baskets/{$basket->id}/products/{$product->id}", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ==================== BASKET DISCOUNT CALCULATION TESTS ====================

    public function test_basket_shows_correct_discount_percentage(): void
    {
        $basket = SurpriseBasket::factory()->create([
            'merchant_id' => $this->merchant->id,
            'original_price' => 10000,
            'discounted_price' => 5000,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/surprise-baskets/{$basket->id}", $this->actingAsJwt($this->consumer));

        $response->assertOk();
        // 50% discount
        $this->assertEquals(50, $response->json('data.discount_percentage'));
    }
}
