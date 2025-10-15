<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Merchant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Critical MIME validation tests for ProductController uploadImage endpoint
 * 🔒 SECURITY: Ensuring only valid, safe image uploads are accepted
 */
class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $merchantUser;

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

        Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'business_name' => 'Test Merchant',
            'business_type' => 'bakery',
        ]);

        // Use fake storage for file uploads
        Storage::fake('public');
    }

    /**
     * TEST #1: Valid JPEG image upload succeeds
     * ✅ Expected: 200 OK with success response
     */
    public function test_valid_jpeg_upload_succeeds(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create valid JPEG test image (100x100px)
        $image = UploadedFile::fake()->image('product.jpg', 100, 100);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products/upload-image', [
                'image' => $image,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Image uploadée avec succès',
            ])
            ->assertJsonStructure([
                'data' => ['url', 'path', 'filename'],
            ]);

        // Verify file was stored
        $filename = $response->json('data.filename');
        Storage::disk('public')->assertExists('products/' . $filename);
    }

    /**
     * TEST #2: Valid PNG image upload succeeds
     * ✅ Expected: 200 OK with success response
     */
    public function test_valid_png_upload_succeeds(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create valid PNG test image (500x500px)
        $image = UploadedFile::fake()->image('product.png', 500, 500);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products/upload-image', [
                'image' => $image,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Image uploadée avec succès',
            ]);

        // Verify file was stored
        $filename = $response->json('data.filename');
        Storage::disk('public')->assertExists('products/' . $filename);
    }

    /**
     * TEST #3: Invalid MIME type (PHP file) is rejected
     * 🔒 SECURITY: Prevent executable file uploads disguised as images
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_invalid_mime_type_is_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create malicious PHP file disguised as image
        $maliciousFile = UploadedFile::fake()->create('malicious.php', 100, 'application/x-php');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products/upload-image', [
                'image' => $maliciousFile,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Verify NO file was stored
        Storage::disk('public')->assertDirectoryEmpty('products');
    }

    /**
     * TEST #4: Oversized image dimensions (>2000x2000px) is rejected
     * 🔒 SECURITY: Prevent DoS via massive image processing
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_oversized_dimensions_are_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create image exceeding max dimensions (2500x2500px > 2000x2000px limit)
        $oversizedImage = UploadedFile::fake()->image('huge.jpg', 2500, 2500);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products/upload-image', [
                'image' => $oversizedImage,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Image trop grande. Dimensions maximales : 2000x2000px',
            ]);

        // Verify NO file was stored
        Storage::disk('public')->assertDirectoryEmpty('products');
    }

    /**
     * TEST #5: Oversized file size (>2MB) is rejected
     * 🔒 SECURITY: Prevent storage exhaustion attacks
     * ✅ Expected: 422 Unprocessable Entity
     */
    public function test_oversized_file_is_rejected(): void
    {
        $token = auth('api')->login($this->merchantUser);

        // Create file exceeding max size (3MB > 2MB limit)
        $oversizedFile = UploadedFile::fake()->create('huge.jpg', 3072); // 3MB in KB

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/products/upload-image', [
                'image' => $oversizedFile,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Verify NO file was stored
        Storage::disk('public')->assertDirectoryEmpty('products');
    }
}
