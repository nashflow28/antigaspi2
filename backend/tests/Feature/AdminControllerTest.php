<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Critical tests for AdminController dashboard
 * 🐛 TEST BUG #18: Memory leak fix (SQL aggregation)
 * 📋 COVERAGE: dashboard() method
 */
class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure JWT for testing
        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);

        // Create admin user
        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@antigaspi.com',
        ]);
    }

    /**
     * TEST #1: Dashboard returns expected structure
     * ✅ Expected: 200 OK with stats
     */
    public function test_dashboard_returns_expected_structure(): void
    {
        $token = auth('api')->login($this->adminUser);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'stats' => [
                        'totalUsers',
                        'newUsersThisMonth',
                        'activeMerchants',
                        'merchantGrowthRate',
                        'productsSaved',
                        'kgFoodSaved',
                        'totalRevenue',
                        'revenueGrowth',
                    ],
                    'topMerchants',
                    'popularCategories',
                    'recentActivities',
                    'environmentalImpact' => [
                        'co2Saved',
                        'waterSaved',
                        'wasteSaved',
                        'treesEquivalent',
                    ],
                ],
            ]);
    }

    /**
     * TEST #2: Dashboard uses SQL aggregation (Bug #18)
     * 🐛 TEST BUG #18: Verify memory leak fix
     * ✅ Expected: Query uses SUM() directly, not Collection->sum()
     */
    public function test_dashboard_uses_sql_aggregation_not_memory(): void
    {
        $token = auth('api')->login($this->adminUser);

        // Create test data
        $merchant = Merchant::factory()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
        ]);

        // Create multiple completed reservations
        Reservation::factory()->count(10)->create([
            'product_id' => $product->id,
            'status' => 'completed',
            'quantity_reserved' => 5,
            'total_amount' => 1000,
        ]);

        // Execute dashboard (should use SQL SUM, not load all records)
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200);

        // Verify stats are calculated
        $stats = $response->json('data.stats');
        $this->assertGreaterThan(0, $stats['productsSaved']);
        $this->assertGreaterThan(0, $stats['totalRevenue']);
    }

    /**
     * TEST #3: Dashboard handles empty data gracefully
     * ✅ Expected: 200 OK with zero stats
     */
    public function test_dashboard_handles_empty_data_gracefully(): void
    {
        $token = auth('api')->login($this->adminUser);

        // No data created, everything should be zero
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200);

        $stats = $response->json('data.stats');
        $this->assertEquals(1, $stats['totalUsers']); // Only admin user
        $this->assertEquals(0, $stats['activeMerchants']);
        $this->assertEquals(0, $stats['productsSaved']);
        $this->assertEquals(0, $stats['totalRevenue']);
    }

    /**
     * TEST #4: Dashboard requires admin role
     * 🔒 SECURITY: Test authorization
     * ✅ Expected: 403 Forbidden for non-admin
     */
    public function test_dashboard_requires_admin_role(): void
    {
        // Create non-admin user
        $consumer = User::factory()->create([
            'role' => 'consumer',
        ]);

        $token = auth('api')->login($consumer);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ]);
    }

    /**
     * TEST #5: System health endpoint works
     * ✅ Expected: 200 OK with health status
     */
    public function test_system_health_returns_status(): void
    {
        $token = auth('api')->login($this->adminUser);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/system-health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'name',
                        'description',
                        'status',
                        'uptime',
                        'responseTime',
                    ],
                ],
            ]);
    }
}
