<?php

namespace Tests\Feature;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Critical tests for MerchantController endpoints
 * 🔒 SECURITY: Testing Bug #12 (DB transactions), Bug #17 (MIME types)
 * 📋 COVERAGE: uploadPhoto(), updateOpeningHours()
 */
class MerchantControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $merchantUser;

    protected Merchant $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure JWT for testing
        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);

        // Create merchant user with merchant profile
        $this->merchantUser = User::factory()->create([
            'role' => 'merchant',
            'email' => 'test.merchant@example.com',
        ]);

        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'business_name' => 'Test Merchant',
            'business_type' => 'bakery',
        ]);

        // Use fake storage for file uploads
        Storage::fake('public');
    }

    /**
     * TEST #1: Valid JPEG merchant photo upload succeeds
     * ✅ Expected: 200 OK with photo URL
     */
    public function test_valid_jpeg_merchant_photo_succeeds(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        $token = auth('api')->login($this->merchantUser);

        // Create valid JPEG test image (800x800px)
        $photo = UploadedFile::fake()->image('merchant.jpg', 800, 800);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', [
                'photo' => $photo,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Photo uploadée avec succès',
            ])
            ->assertJsonStructure([
                'data' => ['photo_url', 'full_url'],
            ]);

        // Verify file was stored
        $photoUrl = $response->json('data.photo_url');
        $path = str_replace('/storage/', '', $photoUrl);
        Storage::disk('public')->assertExists($path);
    }

    /**
     * TEST #2: Valid PNG merchant photo upload succeeds
     * ✅ Expected: 200 OK with photo URL
     */
    public function test_valid_png_merchant_photo_succeeds(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        $token = auth('api')->login($this->merchantUser);

        // Create valid PNG test image (500x500px)
        $photo = UploadedFile::fake()->image('merchant.png', 500, 500);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', [
                'photo' => $photo,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Photo uploadée avec succès',
            ]);

        // Verify file was stored
        $photoUrl = $response->json('data.photo_url');
        $path = str_replace('/storage/', '', $photoUrl);
        Storage::disk('public')->assertExists($path);
    }

    /**
     * TEST #3: Invalid MIME type (PHP file) is rejected
     * 🔒 SECURITY: Test Bug #17 - Prevent malicious file uploads
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_invalid_mime_merchant_photo_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create malicious PHP file disguised as image
        $maliciousFile = UploadedFile::fake()->create('malicious.php', 100, 'application/x-php');

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', [
                'photo' => $maliciousFile,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Verify NO file was stored
        $this->assertCount(0, Storage::disk('public')->allFiles('merchants'));
    }

    /**
     * TEST #4: Oversized dimensions (>1000x1000px) are rejected
     * 🔒 SECURITY: Test Bug #17 - Prevent DoS via massive images
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_oversized_dimensions_merchant_photo_rejected(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        $token = auth('api')->login($this->merchantUser);

        // Create image exceeding max dimensions (1500x1500px > 1000x1000px limit)
        $oversizedImage = UploadedFile::fake()->image('huge.jpg', 1500, 1500);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', [
                'photo' => $oversizedImage,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Image trop grande. Dimensions maximales : 1000x1000px',
            ]);

        // Verify NO file was stored
        $this->assertCount(0, Storage::disk('public')->allFiles('merchants'));
    }

    /**
     * TEST #5: Oversized file size (>1MB) is rejected
     * 🔒 SECURITY: Test Bug #17 - Prevent storage exhaustion
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_oversized_file_merchant_photo_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create file exceeding max size (2MB > 1MB limit)
        $oversizedFile = UploadedFile::fake()->create('huge.jpg', 2048); // 2MB in KB

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', [
                'photo' => $oversizedFile,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Verify NO file was stored
        $this->assertCount(0, Storage::disk('public')->allFiles('merchants'));
    }

    /**
     * TEST #6: Old photo is deleted when uploading new one
     * 🐛 TEST BUG #12: Verify old file cleanup
     * ✅ Expected: Old photo deleted, new photo stored
     */
    public function test_old_photo_deleted_on_new_upload(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        $token = auth('api')->login($this->merchantUser);

        // Upload first photo
        $firstPhoto = UploadedFile::fake()->image('first.jpg', 500, 500);
        $firstResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', ['photo' => $firstPhoto]);

        $firstPhotoUrl = $firstResponse->json('data.photo_url');
        $firstPath = str_replace('/storage/', '', $firstPhotoUrl);
        Storage::disk('public')->assertExists($firstPath);

        // Upload second photo (should delete first)
        $secondPhoto = UploadedFile::fake()->image('second.jpg', 500, 500);
        $secondResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/merchants/profile/photo', ['photo' => $secondPhoto]);

        $secondPhotoUrl = $secondResponse->json('data.photo_url');
        $secondPath = str_replace('/storage/', '', $secondPhotoUrl);

        // Verify second photo exists
        Storage::disk('public')->assertExists($secondPath);

        // Verify first photo was deleted
        Storage::disk('public')->assertMissing($firstPath);
    }

    /**
     * TEST #7: Valid opening hours accepted
     * ✅ Expected: 200 OK
     */
    public function test_valid_opening_hours_accepted(): void
    {
        $token = auth('api')->login($this->merchantUser);

        $openingHours = [
            [
                'day' => 'monday',
                'is_open' => true,
                'morning_start' => '08:00',
                'morning_end' => '12:00',
                'afternoon_start' => '14:00',
                'afternoon_end' => '18:00',
            ],
            [
                'day' => 'tuesday',
                'is_open' => false,
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/merchants/opening-hours', [
                'opening_hours' => $openingHours,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Heures d\'ouverture mises à jour avec succès',
            ]);

        // Verify data was saved
        $this->merchant->refresh();
        $this->assertCount(2, $this->merchant->opening_hours);
    }

    /**
     * TEST #8: Duplicate days in opening hours rejected
     * 🐛 TEST BUG #9: Prevent duplicate days
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_opening_hours_duplicate_days_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        $openingHours = [
            ['day' => 'monday', 'is_open' => true],
            ['day' => 'monday', 'is_open' => false], // Duplicate
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/merchants/opening-hours', [
                'opening_hours' => $openingHours,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * TEST #9: Continuous opening hours allowed (morning_end = afternoon_start)
     * 🐛 TEST BUG #8: Allow continuous hours
     * ✅ Expected: 200 OK
     */
    public function test_opening_hours_continuous_allowed(): void
    {
        $token = auth('api')->login($this->merchantUser);

        $openingHours = [
            [
                'day' => 'monday',
                'is_open' => true,
                'morning_start' => '08:00',
                'morning_end' => '12:00',
                'afternoon_start' => '12:00', // Continuous (same as morning_end)
                'afternoon_end' => '18:00',
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/merchants/opening-hours', [
                'opening_hours' => $openingHours,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * TEST #10: Invalid time format rejected
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_opening_hours_invalid_format_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        $openingHours = [
            [
                'day' => 'monday',
                'is_open' => true,
                'morning_start' => '25:99', // Invalid time format
                'morning_end' => '12:00',
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/merchants/opening-hours', [
                'opening_hours' => $openingHours,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * TEST #11: Empty opening hours array rejected
     * 🐛 TEST EDGE CASE #2: Prevent empty arrays
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_opening_hours_empty_array_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/merchants/opening-hours', [
                'opening_hours' => [], // Empty array
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
