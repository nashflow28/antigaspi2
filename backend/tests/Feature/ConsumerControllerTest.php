<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConsumerControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $consumer;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'test-secret-key-for-jwt-authentication',
            'jwt.keys.secret' => 'test-secret-key-for-jwt-authentication',
        ]);

        $this->consumer = User::factory()->create([
            'role' => 'consumer',
            'email' => 'consumer@example.com',
            'phone' => '+228 90 12 34 56',
        ]);

        Storage::fake('public');
    }

    public function test_consumer_can_update_profile(): void
    {
        $token = auth('api')->login($this->consumer);

        $payload = [
            'first_name' => 'Koffi',
            'last_name' => 'Adje',
            'email' => 'koffi.adje@example.com',
            'phone' => '+228 91 23 45 67',
            'address' => '15 Rue des Lilas',
            'city' => 'Lomé',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/consumers/profile', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
            ])
            ->assertJsonPath('data.email', 'koffi.adje@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $this->consumer->id,
            'first_name' => 'Koffi',
            'last_name' => 'Adje',
            'phone' => '+228 91 23 45 67',
            'city' => 'Lomé',
        ]);
    }

    public function test_update_profile_validates_inputs(): void
    {
        $token = auth('api')->login($this->consumer);

        $payload = [
            'first_name' => 'A',
            'last_name' => 'B',
            'email' => 'invalid-email',
            'phone' => '+123456',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/consumers/profile', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Données invalides',
            ])
            ->assertJsonStructure([
                'errors' => ['first_name', 'last_name', 'email', 'phone'],
            ]);
    }

    public function test_consumer_can_upload_profile_photo(): void
    {
        $token = auth('api')->login($this->consumer);

        $photo = UploadedFile::fake()->image('avatar.jpg', 600, 600)->size(1024);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/consumers/profile/photo', [
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

        $photoUrl = $response->json('data.photo_url');
        $path = str_replace('/storage/', '', $photoUrl);
        Storage::disk('public')->assertExists($path);

        $this->consumer->refresh();
        $this->assertNotNull($this->consumer->photo_url);
    }

    public function test_upload_photo_rejects_large_file(): void
    {
        $token = auth('api')->login($this->consumer);

        $photo = UploadedFile::fake()->image('avatar.jpg')->size(6000);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/consumers/profile/photo', [
                'photo' => $photo,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Fichier invalide',
            ]);
    }
}
