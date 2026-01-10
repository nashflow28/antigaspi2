<?php

namespace Tests\Feature;

use App\Models\LoyaltyPoint;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoyaltyPointControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $consumer;

    private User $merchantUser;

    private Merchant $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);

        $this->consumer = User::factory()->create([
            'role' => 'consumer',
            'referral_code' => 'TESTREF123',
        ]);

        $this->merchantUser = User::factory()->create(['role' => 'merchant']);
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'business_name' => 'Test Shop',
        ]);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    // ==================== GET USER POINTS TESTS ====================

    public function test_consumer_can_get_own_points(): void
    {
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 100,
            'type' => 'earned',
            'source' => 'purchase',
        ]);

        $response = $this->getJson('/api/loyalty/points', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_points',
                    'history',
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_get_points(): void
    {
        $response = $this->getJson('/api/loyalty/points');

        $response->assertUnauthorized();
    }

    // ==================== GET TIER INFO TESTS ====================

    public function test_consumer_can_get_tier_info(): void
    {
        $response = $this->getJson('/api/loyalty/tier', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'current_tier',
                    'total_points',
                ],
            ]);
    }

    // ==================== AWARD POINTS TESTS ====================

    public function test_admin_can_award_points_to_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->postJson('/api/loyalty/award', [
            'user_id' => $this->consumer->id,
            'points' => 50,
            'reason' => 'Bonus test',
        ], $this->actingAsJwt($admin));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $this->consumer->id,
            'points' => 50,
            'source' => 'admin_bonus',
        ]);
    }

    public function test_consumer_cannot_award_points(): void
    {
        $response = $this->postJson('/api/loyalty/award', [
            'user_id' => $this->consumer->id,
            'points' => 50,
            'reason' => 'Hack attempt',
        ], $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    public function test_award_points_requires_positive_amount(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->postJson('/api/loyalty/award', [
            'user_id' => $this->consumer->id,
            'points' => -50,
            'reason' => 'Invalid',
        ], $this->actingAsJwt($admin));

        $response->assertStatus(422);
    }

    // ==================== REDEEM POINTS TESTS ====================

    public function test_consumer_can_redeem_points(): void
    {
        // Give user some points first
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 500,
            'type' => 'earned',
        ]);

        $response = $this->postJson('/api/loyalty/redeem', [
            'points' => 100,
            'reward_type' => 'discount',
        ], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $this->consumer->id,
            'points' => -100,
            'type' => 'redeemed',
        ]);
    }

    public function test_cannot_redeem_more_points_than_available(): void
    {
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 50,
            'type' => 'earned',
        ]);

        $response = $this->postJson('/api/loyalty/redeem', [
            'points' => 1000,
            'reward_type' => 'discount',
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(400);
    }

    public function test_redeem_requires_minimum_points(): void
    {
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 500,
            'type' => 'earned',
        ]);

        $response = $this->postJson('/api/loyalty/redeem', [
            'points' => 5, // Too few
            'reward_type' => 'discount',
        ], $this->actingAsJwt($this->consumer));

        $response->assertStatus(422);
    }

    // ==================== MERCHANT STATS TESTS ====================

    public function test_merchant_can_get_loyalty_stats(): void
    {
        $response = $this->getJson('/api/merchant/loyalty/stats', $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_points_awarded',
                    'total_customers',
                ],
            ]);
    }

    public function test_consumer_cannot_access_merchant_loyalty_stats(): void
    {
        $response = $this->getJson('/api/merchant/loyalty/stats', $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== MERCHANT CUSTOMERS TESTS ====================

    public function test_merchant_can_get_customer_list(): void
    {
        $response = $this->getJson('/api/merchant/loyalty/customers', $this->actingAsJwt($this->merchantUser));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ==================== REFERRAL TESTS ====================

    public function test_consumer_can_get_referral_info(): void
    {
        $response = $this->getJson('/api/loyalty/referral', $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'referral_code',
                    'referral_count',
                    'referral_bonus',
                ],
            ]);
    }

    public function test_consumer_can_validate_referral_code(): void
    {
        $referrer = User::factory()->create([
            'role' => 'consumer',
            'referral_code' => 'VALIDCODE',
        ]);

        $response = $this->postJson('/api/loyalty/referral/validate', [
            'referral_code' => 'VALIDCODE',
        ], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.valid', true);
    }

    public function test_invalid_referral_code_returns_error(): void
    {
        $response = $this->postJson('/api/loyalty/referral/validate', [
            'referral_code' => 'INVALIDCODE123',
        ], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('data.valid', false);
    }

    public function test_cannot_use_own_referral_code(): void
    {
        $response = $this->postJson('/api/loyalty/referral/validate', [
            'referral_code' => 'TESTREF123', // Own code
        ], $this->actingAsJwt($this->consumer));

        $response->assertOk()
            ->assertJsonPath('data.valid', false);
    }

    // ==================== ADMIN ALL USERS POINTS TESTS ====================

    public function test_admin_can_get_all_users_points(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LoyaltyPoint::factory()->count(5)->create();

        $response = $this->getJson('/api/admin/loyalty/users', $this->actingAsJwt($admin));

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_consumer_cannot_get_all_users_points(): void
    {
        $response = $this->getJson('/api/admin/loyalty/users', $this->actingAsJwt($this->consumer));

        $response->assertForbidden();
    }

    // ==================== POINTS CALCULATION TESTS ====================

    public function test_points_balance_calculation_is_correct(): void
    {
        // Earned points
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 100,
            'type' => 'earned',
        ]);

        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => 50,
            'type' => 'earned',
        ]);

        // Redeemed points
        LoyaltyPoint::factory()->create([
            'user_id' => $this->consumer->id,
            'points' => -30,
            'type' => 'redeemed',
        ]);

        $response = $this->getJson('/api/loyalty/points', $this->actingAsJwt($this->consumer));

        $response->assertOk();
        // Total should be 100 + 50 - 30 = 120
        $this->assertEquals(120, $response->json('data.total_points'));
    }
}
