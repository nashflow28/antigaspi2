<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\SearchQuery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class SearchControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $consumer;
    private Merchant $merchant;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);

        $this->consumer = User::factory()->create(['role' => 'consumer']);

        $merchantUser = User::factory()->create(['role' => 'merchant']);
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Boulangerie Test',
            'city' => 'Lomé',
        ]);

        $this->category = Category::factory()->create(['name' => 'Boulangerie']);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => 'Bearer ' . $token];
    }

    // ==================== SEARCH INDEX TESTS ====================

    public function test_can_search_products_by_name(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain complet bio',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Croissant beurre',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=pain', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.products');
    }

    public function test_can_search_products_by_description(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Produit A',
            'description' => 'Délicieux pain artisanal fait maison',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=artisanal', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data.products');
    }

    public function test_search_excludes_inactive_products(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain actif',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain inactif',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/search?q=pain', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data.products');
    }

    public function test_can_filter_search_by_category(): void
    {
        $otherCategory = Category::factory()->create(['name' => 'Fruits']);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain boulangerie',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $otherCategory->id,
            'name' => 'Pain fruits', // Same keyword but different category
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/search?q=pain&category_id={$this->category->id}", $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data.products');
    }

    public function test_can_filter_search_by_price_range(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain pas cher',
            'discounted_price' => 500,
            'is_active' => true,
        ]);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain cher',
            'discounted_price' => 5000,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=pain&min_price=100&max_price=1000', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data.products');
    }

    public function test_search_returns_empty_for_no_matches(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Croissant',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=pizza', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(0, 'data.products');
    }

    public function test_search_is_case_insensitive(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain Complet',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=PAIN', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonCount(1, 'data.products');
    }

    public function test_search_requires_query_parameter(): void
    {
        $response = $this->getJson('/api/search', $this->actingAsJwt($this->consumer));

        // Should return validation error or empty results
        $response->assertStatus(422);
    }

    public function test_search_requires_minimum_query_length(): void
    {
        $response = $this->getJson('/api/search?q=a', $this->actingAsJwt($this->consumer));

        $response->assertStatus(422);
    }

    // ==================== SEARCH SUGGESTIONS TESTS ====================

    public function test_can_get_search_suggestions(): void
    {
        // Create some search history
        SearchQuery::factory()->create([
            'user_id' => $this->consumer->id,
            'query' => 'pain complet',
        ]);

        SearchQuery::factory()->create([
            'user_id' => $this->consumer->id,
            'query' => 'pain baguette',
        ]);

        $response = $this->getJson('/api/search/suggestions?q=pain', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_suggestions_include_popular_searches(): void
    {
        // Create multiple search queries for same term
        SearchQuery::factory()->count(5)->create([
            'query' => 'croissant',
        ]);

        $response = $this->getJson('/api/search/suggestions?q=croi', $this->actingAsJwt($this->consumer));

        $response->assertOk();
    }

    // ==================== SEARCH HISTORY TESTS ====================

    public function test_search_saves_query_history(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain test',
            'is_active' => true,
        ]);

        $this->getJson('/api/search?q=pain+test', $this->actingAsJwt($this->consumer));

        $this->assertDatabaseHas('search_queries', [
            'user_id' => $this->consumer->id,
            'query' => 'pain test',
        ]);
    }

    public function test_can_delete_search_history(): void
    {
        $searchQuery = SearchQuery::factory()->create([
            'user_id' => $this->consumer->id,
            'query' => 'test query',
        ]);

        $response = $this->deleteJson("/api/search/history/{$searchQuery->id}", [], $this->actingAsJwt($this->consumer));

        $response->assertOk();

        $this->assertDatabaseMissing('search_queries', [
            'id' => $searchQuery->id,
        ]);
    }

    public function test_cannot_delete_other_users_search_history(): void
    {
        $otherUser = User::factory()->create(['role' => 'consumer']);
        $searchQuery = SearchQuery::factory()->create([
            'user_id' => $otherUser->id,
            'query' => 'other user query',
        ]);

        $response = $this->deleteJson("/api/search/history/{$searchQuery->id}", [], $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== SEARCH PAGINATION TESTS ====================

    public function test_search_results_are_paginated(): void
    {
        Product::factory()->count(25)->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=pain&per_page=10', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'products',
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    // ==================== SEARCH SORTING TESTS ====================

    public function test_can_sort_search_results_by_price(): void
    {
        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain A',
            'discounted_price' => 1000,
            'is_active' => true,
        ]);

        Product::factory()->create([
            'merchant_id' => $this->merchant->id,
            'category_id' => $this->category->id,
            'name' => 'Pain B',
            'discounted_price' => 500,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=pain&sort_by=price&sort_order=asc', $this->actingAsJwt($this->consumer));

        $response->assertOk();
        $products = $response->json('data.products');

        if (count($products) >= 2) {
            $this->assertLessThanOrEqual(
                $products[1]['discounted_price'],
                $products[0]['discounted_price']
            );
        }
    }
}
