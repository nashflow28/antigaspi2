<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use App\Models\Reservation;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReviewControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $consumer;
    protected $merchant;
    protected $merchantModel;
    protected $category;
    protected $product;
    protected $otherConsumer;

    protected function setUp(): void
    {
        parent::setUp();

        // Create category
        $this->category = Category::create([
            'name' => 'Boulangerie',
            'icon' => 'bread',
            'business_type' => 'all',
        ]);

        // Create consumer user
        $this->consumer = User::create([
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'role' => 'consumer',
        ]);

        // Create another consumer
        $this->otherConsumer = User::create([
            'first_name' => 'Marie',
            'last_name' => 'Martin',
            'email' => 'other@test.com',
            'password' => bcrypt('password'),
            'role' => 'consumer',
        ]);

        // Create merchant user
        $this->merchant = User::create([
            'first_name' => 'Pierre',
            'last_name' => 'Boulanger',
            'email' => 'merchant@test.com',
            'password' => bcrypt('password'),
            'role' => 'merchant',
        ]);

        // Create merchant
        $this->merchantModel = Merchant::create([
            'user_id' => $this->merchant->id,
            'business_name' => 'Boulangerie Martin',
            'business_type' => 'bakery',
            'siret' => '12345678901234',
            'address' => '123 Rue de Paris',
            'city' => 'Paris',
            'postal_code' => '75001',
            'phone' => '+33123456789',
        ]);

        // Create product
        $this->product = Product::create([
            'merchant_id' => $this->merchantModel->id,
            'category_id' => $this->category->id,
            'name' => 'Pain Complet',
            'description' => 'Pain frais du jour',
            'original_price' => 3.50,
            'discounted_price' => 2.00,
            'quantity_available' => 10,
            'expiration_date' => now()->addDay(),
            'is_active' => true,
        ]);
    }

    /** @test */
    public function test_can_create_review_for_merchant()
    {
        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'rating' => 5,
                'title' => 'Excellent service',
                'comment' => 'Très bon pain, vendeur sympa!',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Avis ajouté avec succès',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'rating',
                    'title',
                    'comment',
                    'is_verified_purchase',
                ],
            ]);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
            'title' => 'Excellent service',
        ]);
    }

    /** @test */
    public function test_can_create_review_for_specific_product()
    {
        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'product_id' => $this->product->id,
                'rating' => 4,
                'title' => 'Bon pain',
                'comment' => 'Pain de qualité',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'product_id' => $this->product->id,
            'rating' => 4,
        ]);
    }

    /** @test */
    public function test_verified_purchase_flag_is_set_when_user_has_completed_reservation()
    {
        // Create a completed reservation using DB::table to bypass fillable restrictions
        DB::table('reservations')->insert([
            'user_id' => $this->consumer->id,
            'product_id' => $this->product->id,
            'quantity_reserved' => 1,
            'total_amount' => 2.00,
            'status' => 'completed',
            'payment_status' => 'pending',
            'reservation_code' => 'RES' . strtoupper(uniqid()),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'product_id' => $this->product->id,
                'rating' => 5,
                'comment' => 'Produit acheté et testé',
            ]);

        $response->assertStatus(201);

        $review = Review::latest()->first();
        $this->assertTrue($review->is_verified_purchase);
    }

    /** @test */
    public function test_cannot_create_duplicate_review_for_same_merchant()
    {
        // Create first review
        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'rating' => 4,
                'comment' => 'Autre avis',
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Vous avez déjà donné un avis pour ce commerçant/produit',
            ]);
    }

    /** @test */
    public function test_create_review_requires_authentication()
    {
        $response = $this->postJson('/api/reviews', [
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function test_create_review_validates_required_fields()
    {
        $token = JWTAuth::fromUser($this->consumer);

        // Missing merchant_id
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'rating' => 5,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Données invalides',
            ])
            ->assertJsonValidationErrors(['merchant_id']);

        // Missing rating
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    /** @test */
    public function test_create_review_validates_rating_range()
    {
        $token = JWTAuth::fromUser($this->consumer);

        // Rating too low
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'rating' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);

        // Rating too high
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reviews', [
                'merchant_id' => $this->merchantModel->id,
                'rating' => 6,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    /** @test */
    public function test_can_list_approved_reviews_for_merchant()
    {
        // Create approved reviews
        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
            'title' => 'Super',
            'comment' => 'Très bien',
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        Review::create([
            'user_id' => $this->otherConsumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'title' => 'Bien',
            'comment' => 'Bon',
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        // Create pending review (should not appear)
        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'product_id' => $this->product->id,
            'rating' => 3,
            'is_approved' => false,
        ]);

        $response = $this->getJson('/api/reviews?merchant_id=' . $this->merchantModel->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'rating',
                        'title',
                        'comment',
                        'stars',
                        'time_ago',
                        'is_verified_purchase',
                        'user' => ['id', 'name'],
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        // Should only return 2 approved reviews
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(2, $response->json('pagination.total'));
    }

    /** @test */
    public function test_can_filter_reviews_by_rating()
    {
        // Create reviews with different ratings
        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        Review::create([
            'user_id' => $this->otherConsumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 3,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $response = $this->getJson('/api/reviews?merchant_id=' . $this->merchantModel->id . '&rating=5');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals(5, $data[0]['rating']);
    }

    /** @test */
    public function test_can_get_review_statistics_for_merchant()
    {
        // Create reviews with various ratings
        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 5,
            'is_verified_purchase' => true,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        Review::create([
            'user_id' => $this->otherConsumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_verified_purchase' => false,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'product_id' => $this->product->id,
            'rating' => 5,
            'is_verified_purchase' => true,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $response = $this->getJson('/api/reviews/stats?merchant_id=' . $this->merchantModel->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_reviews',
                    'average_rating',
                    'verified_reviews',
                    'rating_distribution' => [
                        '*' => ['rating', 'count', 'percentage'],
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(3, $data['total_reviews']);
        $this->assertEquals(4.7, $data['average_rating']); // (5+4+5)/3 = 4.666... rounded to 4.7
        $this->assertEquals(2, $data['verified_reviews']);
        $this->assertCount(5, $data['rating_distribution']); // 5 star ratings (5,4,3,2,1)
    }

    /** @test */
    public function test_can_update_own_review()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'title' => 'Bien',
            'comment' => 'Bon service',
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 5,
                'title' => 'Excellent',
                'comment' => 'Service parfait',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avis mis à jour avec succès',
            ]);

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'rating' => 5,
            'title' => 'Excellent',
            'comment' => 'Service parfait',
        ]);
    }

    /** @test */
    public function test_cannot_update_others_review()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->otherConsumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 5,
                'comment' => 'Tentative de modification',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Non autorisé',
            ]);
    }

    /** @test */
    public function test_cannot_update_review_older_than_30_days()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        // Force the created_at date to be 31 days ago
        $review->created_at = now()->subDays(31);
        $review->saveQuietly();

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 5,
                'comment' => 'Tentative de modification',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Impossible de modifier un avis de plus de 30 jours',
            ]);
    }

    /** @test */
    public function test_can_delete_own_review()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avis supprimé avec succès',
            ]);

        $this->assertDatabaseMissing('reviews', [
            'id' => $review->id,
        ]);
    }

    /** @test */
    public function test_cannot_delete_others_review()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->otherConsumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Non autorisé',
            ]);

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
        ]);
    }

    /** @test */
    public function test_can_view_own_review_details()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'title' => 'Bien',
            'comment' => 'Bon service',
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $review->id,
                    'rating' => 4,
                    'title' => 'Bien',
                    'comment' => 'Bon service',
                ],
            ]);
    }

    /** @test */
    public function test_cannot_view_others_review_details()
    {
        $review = Review::create([
            'user_id' => $this->consumer->id,
            'merchant_id' => $this->merchantModel->id,
            'rating' => 4,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $token = JWTAuth::fromUser($this->otherConsumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/reviews/{$review->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Non autorisé',
            ]);
    }
}
