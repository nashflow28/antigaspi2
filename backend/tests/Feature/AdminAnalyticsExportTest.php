<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminAnalyticsExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $secret = str_repeat('a', 64);
        config([
            'jwt.secret' => $secret,
            'jwt.keys.secret' => $secret,
        ]);
    }

    protected function authenticateAdmin(): void
    {
        $admin = User::create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Admin',
            'last_name' => 'User',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($admin);
        $this->withHeader('Authorization', 'Bearer '.$token);
    }

    protected function createTestData(): void
    {
        // Create test users
        $consumer = User::create([
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'role' => 'consumer',
            'is_active' => true,
        ]);

        $merchantUser = User::create([
            'email' => 'merchant@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'role' => 'merchant',
            'is_active' => true,
        ]);

        // Create merchant
        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Test Bakery',
            'business_type' => 'Bakery',
            'is_verified' => true,
            'verification_date' => now(),
        ]);

        // Create category
        $category = Category::create([
            'name' => 'Bakery',
            'description' => 'Baked goods',
            'icon' => 'bread',
            'is_active' => true,
        ]);

        // Create product
        $product = Product::create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Test Bread',
            'description' => 'Fresh bread',
            'original_price' => 1000,
            'discounted_price' => 500,
            'quantity_available' => 10,
            'is_active' => true,
        ]);

        // Create reservation
        Reservation::create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'quantity_reserved' => 2,
            'total_amount' => 1000,
            'status' => 'completed',
            'reservation_code' => 'TEST123',
            'reserved_at' => now(),
            'confirmed_at' => now(),
        ]);
    }

    public function test_export_requires_authentication(): void
    {
        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
        ]);

        $response->assertUnauthorized();
    }

    public function test_export_requires_admin_role(): void
    {
        $consumer = User::create([
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Test',
            'last_name' => 'Consumer',
            'role' => 'consumer',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($consumer);
        $this->withHeader('Authorization', 'Bearer '.$token);

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
        ]);

        $response->assertForbidden();
    }

    public function test_can_export_analytics_as_csv(): void
    {
        $this->authenticateAdmin();
        $this->createTestData();

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
            'period' => 'month',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['file_content', 'filename', 'mime_type'],
            ]);

        // Verify CSV content contains expected headers (decode base64)
        $content = base64_decode($response->json('data.file_content'));
        $this->assertStringContainsString('RAPPORT ANALYTICS ANTIGASPI', $content);
        $this->assertStringContainsString('STATISTIQUES GÉNÉRALES', $content);
        $this->assertStringContainsString('TOP COMMERÇANTS', $content);
    }

    public function test_can_export_analytics_as_pdf(): void
    {
        $this->authenticateAdmin();
        $this->createTestData();

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'pdf',
            'period' => 'month',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['file_content', 'filename', 'mime_type'],
            ]);

        // Verify HTML content contains expected elements (decode base64)
        $content = base64_decode($response->json('data.file_content'));
        $this->assertStringContainsString('Rapport Analytics Antigaspi', $content);
        $this->assertStringContainsString('Générales', $content);
        $this->assertStringContainsString('Environnemental', $content);
    }

    public function test_export_with_custom_date_range(): void
    {
        $this->authenticateAdmin();
        $this->createTestData();

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
            'start_date' => now()->subDays(7)->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.mime_type', 'text/csv');

        $content = base64_decode($response->json('data.file_content'));
        $this->assertStringContainsString('RAPPORT ANALYTICS ANTIGASPI', $content);
    }

    public function test_export_includes_merchant_data(): void
    {
        $this->authenticateAdmin();
        $this->createTestData();

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
            'period' => 'month',
        ]);

        $response->assertOk();

        $content = base64_decode($response->json('data.file_content'));
        $this->assertStringContainsString('Test Bakery', $content);
        $this->assertStringContainsString('merchant@test.com', $content);
    }

    public function test_export_includes_category_data(): void
    {
        $this->authenticateAdmin();
        $this->createTestData();

        $response = $this->postJson('/api/admin/analytics/export', [
            'format' => 'csv',
            'period' => 'month',
        ]);

        $response->assertOk();

        $content = base64_decode($response->json('data.file_content'));
        $this->assertStringContainsString('CATÉGORIES POPULAIRES', $content);
        $this->assertStringContainsString('Bakery', $content);
    }
}
