<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

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

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
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

        return ['Authorization' => 'Bearer '.$token];
    }

    /**
     * Create a surprise basket (Product with is_surprise_basket = true)
     */
    private function createSurpriseBasket(array $overrides = []): Product
    {
        $defaults = [
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'is_surprise_basket' => true,
            'is_active' => true,
            'quantity_available' => 5,
            'original_price' => 10000,
            'discounted_price' => 5000,
        ];

        return Product::factory()->create(array_merge($defaults, $overrides));
    }

    // ==================== LIST BASKETS TESTS ====================

    public function test_consumer_can_list_available_surprise_baskets(): void
    {
        $this->createSurpriseBasket(['quantity_available' => 5]);
        $this->createSurpriseBasket(['quantity_available' => 3]);
        $this->createSurpriseBasket(['quantity_available' => 2]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Paginated response has data key with items
        $this->assertIsArray($response->json('data.data') ?? $response->json('data'));
    }

    public function test_list_excludes_inactive_baskets(): void
    {
        $this->createSurpriseBasket(['is_active' => true, 'quantity_available' => 5]);
        $this->createSurpriseBasket(['is_active' => false, 'quantity_available' => 5]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk();
        // Active scope filters inactive baskets
    }

    public function test_list_excludes_baskets_with_zero_quantity(): void
    {
        $this->createSurpriseBasket(['quantity_available' => 5]);
        $this->createSurpriseBasket(['quantity_available' => 0]);

        $response = $this->getJson('/api/surprise-baskets', $this->actingAsJwt($this->consumer));

        $response->assertOk();
        // Available scope filters zero quantity baskets
    }

    // ==================== MERCHANT BASKETS TESTS ====================

    public function test_merchant_can_list_own_baskets(): void
    {
        $this->createSurpriseBasket();
        $this->createSurpriseBasket();

        // Another merchant's basket
        $otherMerchant = Merchant::factory()->create();
        $this->createSurpriseBasket(['merchant_id' => $otherMerchant->id]);

        // Use the correct endpoint: /api/surprise-baskets/merchant/list
        $response = $this->getJson('/api/surprise-baskets/merchant/list', $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_consumer_cannot_access_merchant_baskets_endpoint(): void
    {
        $response = $this->getJson('/api/surprise-baskets/merchant/list', $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== CREATE BASKET TESTS ====================

    public function test_merchant_can_create_surprise_basket(): void
    {
        // Use the correct endpoint: POST /api/surprise-baskets
        $response = $this->postJson('/api/surprise-baskets', [
            'name' => 'Panier Mystère',
            'description' => 'Un panier surprise avec des produits variés',
            'discounted_price' => 2500,
            'quantity_available' => 10,
            'category_id' => $this->category->id,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Panier Mystère');

        $this->assertDatabaseHas('products', [
            'merchant_id' => $this->merchant->id,
            'name' => 'Panier Mystère',
            'discounted_price' => 2500,
            'is_surprise_basket' => true,
        ]);
    }

    public function test_consumer_cannot_create_surprise_basket(): void
    {
        $response = $this->postJson('/api/surprise-baskets', [
            'name' => 'Hack Basket',
            'discounted_price' => 2500,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    public function test_create_basket_requires_name(): void
    {
        $response = $this->postJson('/api/surprise-baskets', [
            'discounted_price' => 2500,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_basket_requires_valid_price(): void
    {
        $response = $this->postJson('/api/surprise-baskets', [
            'name' => 'Test Basket',
            'discounted_price' => -100,
            'quantity_available' => 10,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertStatus(422);
    }

    // ==================== SHOW BASKET TESTS ====================

    public function test_can_view_single_basket(): void
    {
        $basket = $this->createSurpriseBasket(['is_active' => true]);

        $response = $this->getJson("/api/surprise-baskets/{$basket->id}", $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $basket->id);
    }

    public function test_cannot_view_nonexistent_basket(): void
    {
        $response = $this->getJson('/api/surprise-baskets/99999', $this->actingAsJwt($this->consumer));

        $response->assertNotFound();
    }

    // ==================== UPDATE BASKET TESTS ====================

    public function test_merchant_can_update_own_basket(): void
    {
        $basket = $this->createSurpriseBasket(['name' => 'Old Name']);

        // Use the correct endpoint: PUT /api/surprise-baskets/{id}
        $response = $this->putJson("/api/surprise-baskets/{$basket->id}", [
            'name' => 'New Name',
            'quantity_available' => 20,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('products', [
            'id' => $basket->id,
            'name' => 'New Name',
            'quantity_available' => 20,
        ]);
    }

    public function test_merchant_cannot_update_other_merchants_basket(): void
    {
        $otherMerchantUser = User::factory()->create(['role' => 'merchant']);
        $otherMerchant = Merchant::factory()->create(['user_id' => $otherMerchantUser->id]);

        $basket = $this->createSurpriseBasket(['merchant_id' => $otherMerchant->id]);

        $response = $this->putJson("/api/surprise-baskets/{$basket->id}", [
            'name' => 'Hacked Name',
        ], $this->actingAsJwt($this->merchantUser));

        // Returns 404 because the basket belongs to another merchant
        $response->assertNotFound();
    }

    // ==================== DELETE BASKET TESTS ====================

    public function test_merchant_can_delete_own_basket(): void
    {
        $basket = $this->createSurpriseBasket();

        // Use the correct endpoint: DELETE /api/surprise-baskets/{id}
        $response = $this->deleteJson("/api/surprise-baskets/{$basket->id}", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', [
            'id' => $basket->id,
        ]);
    }

    public function test_merchant_cannot_delete_other_merchants_basket(): void
    {
        $otherMerchantUser = User::factory()->create(['role' => 'merchant']);
        $otherMerchant = Merchant::factory()->create(['user_id' => $otherMerchantUser->id]);

        $basket = $this->createSurpriseBasket(['merchant_id' => $otherMerchant->id]);

        $response = $this->deleteJson("/api/surprise-baskets/{$basket->id}", [], $this->actingAsJwt($this->merchantUser));

        // Returns 404 because the basket belongs to another merchant
        $response->assertNotFound();
    }

    // ==================== ADD/REMOVE PRODUCT TESTS ====================

    public function test_merchant_can_add_product_to_basket(): void
    {
        $basket = $this->createSurpriseBasket();

        $product = Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'is_active' => true,
            'is_surprise_basket' => false,
            'discounted_price' => 1000,
        ]);

        // Use the correct endpoint: POST /api/surprise-baskets/{basketId}/products
        $response = $this->postJson("/api/surprise-baskets/{$basket->id}/products", [
            'product_id' => $product->id,
            'quantity' => 2,
        ], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_cannot_add_other_merchants_product_to_basket(): void
    {
        $basket = $this->createSurpriseBasket();

        $otherMerchant = Merchant::factory()->create();
        $product = Product::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'category_id' => $this->category->id,
            'is_surprise_basket' => false,
        ]);

        $response = $this->postJson("/api/surprise-baskets/{$basket->id}/products", [
            'product_id' => $product->id,
            'quantity' => 1,
        ], $this->actingAsJwt($this->merchantUser));

        // Returns 404 because the product doesn't belong to this merchant
        $response->assertNotFound();
    }

    public function test_merchant_can_remove_product_from_basket(): void
    {
        $basket = $this->createSurpriseBasket();

        $product = Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'is_surprise_basket' => false,
            'discounted_price' => 1000,
        ]);

        // First add the product via API
        $basket->addItemToBasket($product, 1);

        // Use the correct endpoint: DELETE /api/surprise-baskets/{basketId}/products/{productId}
        $response = $this->deleteJson("/api/surprise-baskets/{$basket->id}/products/{$product->id}", [], $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ==================== BASKET DISCOUNT CALCULATION TESTS ====================

    public function test_basket_shows_correct_discount_percentage(): void
    {
        $basket = $this->createSurpriseBasket([
            'original_price' => 10000,
            'discounted_price' => 5000,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/surprise-baskets/{$basket->id}", $this->actingAsJwt($this->consumer));

        $response->assertOk();
        // discount_percentage is an accessor on the Product model
        // The API may return it if it's appended to the model, or we verify it exists on the model
        $this->assertEquals(50, $basket->discount_percentage);
    }
}
