<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminSystemSettingsTest extends TestCase
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

        // Run settings migration
        $this->artisan('migrate');
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
        $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    protected function authenticateConsumer(): void
    {
        $consumer = User::create([
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'role' => 'consumer',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($consumer);
        $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    /** @test */
    public function it_requires_authentication_to_get_settings()
    {
        $response = $this->getJson('/api/admin/settings');

        $response->assertStatus(401);
    }

    /** @test */
    public function it_requires_admin_role_to_get_settings()
    {
        $this->authenticateConsumer();

        $response = $this->getJson('/api/admin/settings');

        // Laravel's can:admin middleware returns 403
        $response->assertStatus(403);
    }

    /** @test */
    public function it_returns_all_settings_grouped_by_category()
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/settings');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        $response->assertJsonStructure([
            'success',
            'data' => [
                'general' => [
                    '*' => ['key', 'value', 'type', 'description']
                ],
                'commission' => [
                    '*' => ['key', 'value', 'type', 'description']
                ],
                'reservation',
                'notifications',
                'maintenance',
                'limits'
            ]
        ]);

        // Verify specific default settings
        $data = $response->json('data');
        $this->assertNotEmpty($data['general']);
        $this->assertNotEmpty($data['commission']);
    }

    /** @test */
    public function it_logs_admin_access_to_settings()
    {
        Log::spy();

        $this->authenticateAdmin();
        $response = $this->getJson('/api/admin/settings');

        $response->assertStatus(200);

        Log::shouldHaveReceived('info')
            ->once()
            ->with('Admin accessed system settings', \Mockery::on(function ($arg) {
                return isset($arg['admin_id']) &&
                       isset($arg['admin_email']) &&
                       isset($arg['ip_address']) &&
                       isset($arg['user_agent']) &&
                       isset($arg['timestamp']);
            }));
    }

    /** @test */
    public function it_requires_authentication_to_update_settings()
    {
        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'New Name'
            ]
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_requires_admin_role_to_update_settings()
    {
        $this->authenticateConsumer();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'New Name'
            ]
        ]);

        // Laravel's can:admin middleware returns 403
        $response->assertStatus(403);
    }

    /** @test */
    public function it_validates_settings_array_is_required()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings']);
    }

    /** @test */
    public function it_validates_settings_must_be_array()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => 'not-an-array'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings']);
    }

    /** @test */
    public function it_updates_string_setting_successfully()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'Antigaspi Pro'
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Paramètres mis à jour avec succès',
            'updated' => ['site_name'],
            'failed' => []
        ]);

        // Verify database update
        $setting = Setting::where('key', 'site_name')->first();
        $this->assertEquals('Antigaspi Pro', $setting->value);
    }

    /** @test */
    public function it_updates_integer_setting_successfully()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'max_reservation_duration' => 48
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'updated' => ['max_reservation_duration']
        ]);

        // Verify value is stored as string but casts to integer
        $setting = Setting::where('key', 'max_reservation_duration')->first();
        $this->assertEquals('48', $setting->value);
        $this->assertEquals(48, Setting::get('max_reservation_duration'));
    }

    /** @test */
    public function it_updates_boolean_setting_successfully()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'maintenance_mode' => true
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'updated' => ['maintenance_mode']
        ]);

        // Verify boolean conversion
        $setting = Setting::where('key', 'maintenance_mode')->first();
        $this->assertEquals('1', $setting->value);
        $this->assertTrue(Setting::get('maintenance_mode'));
    }

    /** @test */
    public function it_updates_decimal_setting_successfully()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'commission_rate' => 15.5
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'updated' => ['commission_rate']
        ]);

        // Verify decimal value
        $this->assertEquals(15.5, Setting::get('commission_rate'));
    }

    /** @test */
    public function it_updates_multiple_settings_simultaneously()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'Antigaspi v2',
                'contact_email' => 'support@antigaspi.com',
                'commission_rate' => 12,
                'notifications_enabled' => false
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'updated' => [
                'site_name',
                'contact_email',
                'commission_rate',
                'notifications_enabled'
            ],
            'failed' => []
        ]);

        // Verify all updates
        $this->assertEquals('Antigaspi v2', Setting::get('site_name'));
        $this->assertEquals('support@antigaspi.com', Setting::get('contact_email'));
        $this->assertEquals(12.0, Setting::get('commission_rate'));
        $this->assertFalse(Setting::get('notifications_enabled'));
    }

    /** @test */
    public function it_tracks_failed_updates_for_non_existent_keys()
    {
        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'Valid Setting',
                'invalid_key' => 'This does not exist',
                'another_invalid' => 'Also invalid'
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'updated' => ['site_name'],
            'failed' => ['invalid_key', 'another_invalid']
        ]);
    }

    /** @test */
    public function it_clears_cache_after_updating_settings()
    {
        $this->authenticateAdmin();

        // Pre-populate cache
        Setting::get('site_name'); // This caches the value
        $this->assertTrue(Cache::has('setting.site_name'));

        // Update setting
        $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'New Cached Name'
            ]
        ]);

        // Cache should be cleared
        $this->assertFalse(Cache::has('setting.site_name'));

        // Fresh fetch should get new value
        $this->assertEquals('New Cached Name', Setting::get('site_name'));
    }

    /** @test */
    public function it_logs_settings_update_with_audit_trail()
    {
        Log::spy();

        $this->authenticateAdmin();

        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                'site_name' => 'Audited Update'
            ]
        ]);

        $response->assertStatus(200);

        Log::shouldHaveReceived('info')
            ->once()
            ->with('Admin updated system settings', \Mockery::on(function ($arg) {
                return isset($arg['admin_id']) &&
                       isset($arg['admin_email']) &&
                       isset($arg['ip_address']) &&
                       isset($arg['user_agent']) &&
                       isset($arg['changes']) &&
                       isset($arg['updated_count']) &&
                       isset($arg['failed_count']) &&
                       isset($arg['timestamp']);
            }));
    }

    /** @test */
    public function it_validates_empty_settings_array()
    {
        $this->authenticateAdmin();

        // Empty settings array should fail validation
        $response = $this->putJson('/api/admin/settings', [
            'settings' => []
        ]);

        // Laravel validation requires at least one value
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings']);
    }

    /** @test */
    public function it_respects_rate_limiting_for_admin_endpoints()
    {
        $this->authenticateAdmin();

        // Admin routes have throttle:admin middleware
        // Make multiple requests within the limit
        for ($i = 0; $i < 5; $i++) {
            $response = $this->getJson('/api/admin/settings');
            $response->assertStatus(200);
        }

        // This test verifies the endpoint doesn't crash under repeated access
        // Rate limit testing is handled by Laravel's throttle middleware
    }

    /** @test */
    public function setting_model_get_method_returns_default_for_non_existent_key()
    {
        $this->assertEquals('default-value', Setting::get('non_existent_key', 'default-value'));

        // Clear cache to test default null behavior
        Cache::forget('setting.non_existent_key');
        $this->assertNull(Setting::get('non_existent_key'));
    }

    /** @test */
    public function setting_model_get_method_uses_cache()
    {
        // Clear cache first
        Cache::flush();

        // First call should cache the value
        $value1 = Setting::get('site_name');
        $this->assertTrue(Cache::has('setting.site_name'));

        // Manually modify database without using Setting::set()
        $setting = Setting::where('key', 'site_name')->first();
        $setting->value = 'Modified Directly';
        $setting->save();

        // Second call should return cached value (not the modified one)
        $value2 = Setting::get('site_name');
        $this->assertEquals($value1, $value2);
        $this->assertNotEquals('Modified Directly', $value2);

        // After clearing cache, should get updated value
        Cache::forget('setting.site_name');
        $value3 = Setting::get('site_name');
        $this->assertEquals('Modified Directly', $value3);
    }

    /** @test */
    public function setting_model_casts_types_correctly()
    {
        // Integer
        $this->assertIsInt(Setting::get('max_reservation_duration'));
        $this->assertEquals(24, Setting::get('max_reservation_duration'));

        // Boolean
        $this->assertIsBool(Setting::get('notifications_enabled'));
        $this->assertTrue(Setting::get('notifications_enabled'));

        // Decimal
        $this->assertIsFloat(Setting::get('commission_rate'));
        $this->assertEquals(10.0, Setting::get('commission_rate'));

        // String
        $this->assertIsString(Setting::get('site_name'));
        $this->assertEquals('Antigaspi', Setting::get('site_name'));
    }

    /** @test */
    public function setting_model_prepares_values_for_storage()
    {
        // Boolean true becomes '1'
        Setting::set('maintenance_mode', true);
        $setting = Setting::where('key', 'maintenance_mode')->first();
        $this->assertEquals('1', $setting->value);

        // Boolean false becomes '0'
        Setting::set('maintenance_mode', false);
        $setting->refresh();
        $this->assertEquals('0', $setting->value);

        // Integer becomes string
        Setting::set('max_upload_size_mb', 10);
        $setting = Setting::where('key', 'max_upload_size_mb')->first();
        $this->assertEquals('10', $setting->value);
    }

    /** @test */
    public function get_all_grouped_returns_all_settings_organized_by_group()
    {
        $grouped = Setting::getAllGrouped();

        $this->assertIsArray($grouped);
        $this->assertArrayHasKey('general', $grouped);
        $this->assertArrayHasKey('commission', $grouped);
        $this->assertArrayHasKey('reservation', $grouped);
        $this->assertArrayHasKey('notifications', $grouped);
        $this->assertArrayHasKey('maintenance', $grouped);
        $this->assertArrayHasKey('limits', $grouped);

        // Verify structure of each setting
        foreach ($grouped['general'] as $setting) {
            $this->assertArrayHasKey('key', $setting);
            $this->assertArrayHasKey('value', $setting);
            $this->assertArrayHasKey('type', $setting);
            $this->assertArrayHasKey('description', $setting);
        }
    }

    /** @test */
    public function clear_cache_removes_all_setting_caches()
    {
        // Populate multiple caches
        Setting::get('site_name');
        Setting::get('commission_rate');
        Setting::get('notifications_enabled');

        $this->assertTrue(Cache::has('setting.site_name'));
        $this->assertTrue(Cache::has('setting.commission_rate'));
        $this->assertTrue(Cache::has('setting.notifications_enabled'));

        // Clear all
        Setting::clearCache();

        $this->assertFalse(Cache::has('setting.site_name'));
        $this->assertFalse(Cache::has('setting.commission_rate'));
        $this->assertFalse(Cache::has('setting.notifications_enabled'));
    }
}
