<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Merchant;
use App\Models\Category;
use App\Models\Favorite;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Tests for FavoriteController API endpoints
 * ✅ SPRINT 1.1: Backend Favoris - Feature #1 CRITIQUE
 */
class FavoriteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $consumer;
    protected Product $product1;
    protected Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure JWT for testing
        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);

        // Create consumer user
        $this->consumer = User::factory()->create([
            'role' => 'consumer',
            'email' => 'consumer@example.com',
        ]);

        // Create merchant with products for testing
        $merchantUser = User::factory()->create(['role' => 'merchant']);
        $merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Test Bakery',
            'business_type' => 'bakery',
        ]);

        $category = Category::factory()->create([
            'name' => 'Pain',
            'icon' => 'bread',
        ]);

        $this->product1 = Product::factory()->create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Baguette',
            'discounted_price' => 150,
            'is_active' => true,
        ]);

        $this->product2 = Product::factory()->create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Croissant',
            'discounted_price' => 100,
            'is_active' => true,
        ]);
    }

    /**
     * TEST #1: Can toggle favorite ON (add to favorites)
     * ✅ Expected: 200 OK, is_favorite = true
     */
    public function test_can_add_product_to_favorites(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/favorites/{$this->product1->id}/toggle");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Produit ajouté aux favoris',
                'is_favorite' => true,
            ]);

        // Verify database entry exists
        $this->assertDatabaseHas('favorites', [
            'user_id' => $this->consumer->id,
            'product_id' => $this->product1->id,
        ]);
    }

    /**
     * TEST #2: Can toggle favorite OFF (remove from favorites)
     * ✅ Expected: 200 OK, is_favorite = false
     */
    public function test_can_remove_product_from_favorites(): void
    {
        $token = auth('api')->login($this->consumer);

        // Add to favorites first
        Favorite::create([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product1->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/favorites/{$this->product1->id}/toggle");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Produit retiré des favoris',
                'is_favorite' => false,
            ]);

        // Verify database entry removed
        $this->assertDatabaseMissing('favorites', [
            'user_id' => $this->consumer->id,
            'product_id' => $this->product1->id,
        ]);
    }

    /**
     * TEST #3: Can list all user's favorites
     * ✅ Expected: 200 OK with array of products
     */
    public function test_can_list_all_favorites(): void
    {
        $token = auth('api')->login($this->consumer);

        // Add 2 products to favorites
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product1->id]);
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product2->id]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/favorites');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => ['total' => 2],
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'original_price',
                        'discounted_price',
                        'category',
                        'merchant',
                        'favorited_at',
                    ],
                ],
            ]);

        // Verify product names are in response
        $response->assertJsonFragment(['name' => 'Baguette']);
        $response->assertJsonFragment(['name' => 'Croissant']);
    }

    /**
     * TEST #4: Can check if product is in favorites
     * ✅ Expected: 200 OK with is_favorite = true
     */
    public function test_can_check_if_product_is_favorite(): void
    {
        $token = auth('api')->login($this->consumer);

        // Add product1 to favorites
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product1->id]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/favorites/check/{$this->product1->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_favorite' => true,
            ]);
    }

    /**
     * TEST #5: Check returns false for non-favorite product
     * ✅ Expected: 200 OK with is_favorite = false
     */
    public function test_check_returns_false_for_non_favorite(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/favorites/check/{$this->product1->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_favorite' => false,
            ]);
    }

    /**
     * TEST #6: Can batch check all favorite IDs
     * ✅ Expected: 200 OK with array of product IDs
     */
    public function test_can_batch_check_favorite_ids(): void
    {
        $token = auth('api')->login($this->consumer);

        // Add 2 products to favorites
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product1->id]);
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product2->id]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/favorites/batch-check');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [$this->product1->id, $this->product2->id],
            ]);
    }

    /**
     * TEST #7: Unauthenticated access is denied
     * 🔒 SECURITY: JWT middleware protection
     * ✅ Expected: 401 Unauthorized
     */
    public function test_unauthenticated_access_is_denied(): void
    {
        $response = $this->getJson('/api/favorites');
        $response->assertStatus(401);

        $response = $this->postJson("/api/favorites/{$this->product1->id}/toggle");
        $response->assertStatus(401);

        $response = $this->getJson("/api/favorites/check/{$this->product1->id}");
        $response->assertStatus(401);
    }

    /**
     * TEST #8: Cannot favorite non-existent product
     * ✅ Expected: 404 Not Found
     */
    public function test_cannot_favorite_nonexistent_product(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/favorites/99999/toggle');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Produit non trouvé',
            ]);
    }

    /**
     * TEST #9: Empty favorites list returns empty array
     * ✅ Expected: 200 OK with empty data array
     */
    public function test_empty_favorites_list(): void
    {
        $token = auth('api')->login($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/favorites');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [],
                'meta' => ['total' => 0],
            ]);
    }

    /**
     * TEST #10: Users can only see their own favorites
     * 🔒 SECURITY: Data isolation between users
     * ✅ Expected: Only consumer's favorites are returned
     */
    public function test_users_can_only_see_own_favorites(): void
    {
        $token = auth('api')->login($this->consumer);

        // Create another consumer with a favorite
        $otherConsumer = User::factory()->create(['role' => 'consumer']);
        Favorite::create(['user_id' => $otherConsumer->id, 'product_id' => $this->product1->id]);

        // Add favorite for current consumer
        Favorite::create(['user_id' => $this->consumer->id, 'product_id' => $this->product2->id]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/favorites');

        $response->assertStatus(200)
            ->assertJson(['meta' => ['total' => 1]]) // Only 1 favorite (not 2)
            ->assertJsonFragment(['name' => 'Croissant']) // Consumer's favorite
            ->assertJsonMissing(['name' => 'Baguette']); // Not other consumer's favorite
    }
}
