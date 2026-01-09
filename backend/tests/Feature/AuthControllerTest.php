<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Merchant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer ' . $token];
    }

    // ==================== LOGIN TESTS ====================

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'consumer',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'access_token',
                'token_type',
                'expires_in',
                'user' => [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'role',
                ],
            ])
            ->assertJsonPath('success', true)
            ->assertJsonPath('token_type', 'bearer');
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_user_cannot_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_requires_valid_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_merchant_can_login_and_receive_merchant_data(): void
    {
        $user = User::factory()->create([
            'email' => 'merchant@example.com',
            'password' => Hash::make('password123'),
            'role' => 'merchant',
        ]);

        Merchant::factory()->create([
            'user_id' => $user->id,
            'business_name' => 'Test Shop',
            'business_type' => 'restaurant',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'merchant@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'merchant')
            ->assertJsonStructure([
                'user' => [
                    'merchant' => [
                        'id',
                        'business_name',
                        'business_type',
                    ],
                ],
            ]);
    }

    // ==================== REGISTER TESTS ====================

    public function test_user_can_register_as_consumer(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '22891000000',
            'role' => 'consumer',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'access_token',
                'user' => [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'role',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john.doe@example.com',
            'role' => 'consumer',
        ]);
    }

    public function test_user_can_register_as_merchant_with_business_info(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '22892000000',
            'role' => 'merchant',
            'business_name' => 'Jane\'s Bakery',
            'business_type' => 'bakery',
            'city' => 'Lomé',
            'address' => '123 Main Street',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'merchant');

        $this->assertDatabaseHas('users', [
            'email' => 'jane.smith@example.com',
            'role' => 'merchant',
        ]);

        $this->assertDatabaseHas('merchants', [
            'business_name' => 'Jane\'s Bakery',
            'business_type' => 'bakery',
        ]);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'consumer',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword',
            'role' => 'consumer',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_minimum_password_length(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => '123',
            'password_confirmation' => '123',
            'role' => 'consumer',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_merchant_registration_requires_business_name(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'merchant@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'merchant',
            // Missing business_name
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['business_name']);
    }

    // ==================== ME ENDPOINT TESTS ====================

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'role' => 'consumer',
        ]);

        $response = $this->getJson('/api/auth/me', $this->actingAsJwt($user));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.email', 'test@example.com')
            ->assertJsonPath('user.first_name', 'Test');
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_merchant_profile_includes_merchant_data(): void
    {
        $user = User::factory()->create(['role' => 'merchant']);
        Merchant::factory()->create([
            'user_id' => $user->id,
            'business_name' => 'Test Business',
        ]);

        $response = $this->getJson('/api/auth/me', $this->actingAsJwt($user));

        $response->assertOk()
            ->assertJsonPath('user.role', 'merchant')
            ->assertJsonStructure([
                'user' => [
                    'merchant' => [
                        'id',
                        'business_name',
                    ],
                ],
            ]);
    }

    // ==================== LOGOUT TESTS ====================

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/auth/logout', [], $headers);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Successfully logged out');
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertUnauthorized();
    }

    // ==================== REFRESH TOKEN TESTS ====================

    public function test_user_can_refresh_token(): void
    {
        $user = User::factory()->create();
        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/auth/refresh', [], $headers);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'access_token',
                'token_type',
                'expires_in',
            ])
            ->assertJsonPath('success', true)
            ->assertJsonPath('token_type', 'bearer');
    }

    public function test_refresh_fails_without_token(): void
    {
        $response = $this->postJson('/api/auth/refresh');

        $response->assertUnauthorized();
    }

    // ==================== ROLE-BASED ACCESS TESTS ====================

    public function test_user_cannot_register_as_admin(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Hacker',
            'last_name' => 'User',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        // Should either reject admin role or default to consumer
        if ($response->status() === 201) {
            // If registration succeeds, role should NOT be admin
            $this->assertDatabaseMissing('users', [
                'email' => 'hacker@example.com',
                'role' => 'admin',
            ]);
        } else {
            // Registration should fail with validation error
            $response->assertStatus(422);
        }
    }

    public function test_password_is_hashed_on_registration(): void
    {
        $this->postJson('/api/auth/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'hash.test@example.com',
            'password' => 'plainpassword',
            'password_confirmation' => 'plainpassword',
            'role' => 'consumer',
        ]);

        $user = User::where('email', 'hash.test@example.com')->first();

        $this->assertNotNull($user);
        $this->assertNotEquals('plainpassword', $user->password);
        $this->assertTrue(Hash::check('plainpassword', $user->password));
    }
}
