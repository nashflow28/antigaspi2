<?php

namespace Tests\Feature;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_consumer_can_create_review_and_merchant_can_list_it(): void
    {
        [$consumer, $merchantUser, $merchant, $product] = $this->prepareReviewContext();

        $token = JWTAuth::fromUser($consumer);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/reviews', [
                'product_id' => $product->id,
                'rating' => 5,
                'title' => 'Expérience exceptionnelle',
                'comment' => 'Super découverte, je recommande !',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $consumer->id,
            'merchant_id' => $merchant->id,
            'product_id' => $product->id,
            'rating' => 5,
        ]);

        $merchantToken = JWTAuth::fromUser($merchantUser);

        $listResponse = $this->withHeader('Authorization', "Bearer {$merchantToken}")
            ->getJson('/api/reviews');

        $listResponse->assertOk()
            ->assertJsonFragment([
                'comment' => 'Super découverte, je recommande !',
            ]);
    }

    public function test_admin_can_moderate_review(): void
    {
        [$consumer, $merchantUser, $merchant, $product] = $this->prepareReviewContext();

        $review = Review::create([
            'user_id' => $consumer->id,
            'merchant_id' => $merchant->id,
            'product_id' => $product->id,
            'rating' => 3,
            'title' => 'Bof',
            'comment' => 'À améliorer',
        ]);

        $admin = $this->createUser(['role' => 'admin', 'email' => 'admin@example.com']);
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 4,
                'is_verified_purchase' => true,
                'comment' => 'Avis modéré',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_verified_purchase', true)
            ->assertJsonPath('data.rating', 4);

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'is_verified_purchase' => true,
            'rating' => 4,
            'comment' => 'Avis modéré',
        ]);
    }

    private function prepareReviewContext(): array
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
            'business_name' => 'La boutique test',
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'category_id' => null,
            'name' => 'Panier surprise',
            'description' => 'Panier anti-gaspi',
            'original_price' => 15.0,
            'discounted_price' => 9.5,
            'quantity_available' => 3,
            'expiration_date' => now()->addDays(3),
            'is_active' => true,
        ]);

        return [$consumer, $merchantUser, $merchant, $product];
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
