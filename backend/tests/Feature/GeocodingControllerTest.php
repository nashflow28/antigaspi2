<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Mockery;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class GeocodingControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);

        $this->user = User::factory()->create(['role' => 'consumer']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    // ==================== GEOCODE TESTS ====================

    public function test_can_geocode_address(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([
                [
                    'lat' => '6.1319',
                    'lon' => '1.2228',
                    'display_name' => 'Lomé, Maritime, Togo',
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/geocoding/geocode?address=Lomé,Togo', $this->actingAsJwt($this->user));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'latitude',
                    'longitude',
                    'display_name',
                ],
            ]);
    }

    public function test_geocode_requires_address_parameter(): void
    {
        $response = $this->getJson('/api/geocoding/geocode', $this->actingAsJwt($this->user));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    }

    public function test_geocode_returns_error_for_unknown_address(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([], 200),
        ]);

        $response = $this->getJson('/api/geocoding/geocode?address=UnknownPlace12345', $this->actingAsJwt($this->user));

        $response->assertOk()
            ->assertJsonPath('success', false);
    }

    public function test_geocode_handles_api_error(): void
    {
        Http::fake([
            '*nominatim*' => Http::response('Server Error', 500),
        ]);

        $response = $this->getJson('/api/geocoding/geocode?address=Lomé', $this->actingAsJwt($this->user));

        $response->assertStatus(500);
    }

    // ==================== REVERSE GEOCODE TESTS ====================

    public function test_can_reverse_geocode_coordinates(): void
    {
        Http::fake([
            '*nominatim*reverse*' => Http::response([
                'lat' => '6.1319',
                'lon' => '1.2228',
                'display_name' => 'Boulevard du 13 Janvier, Lomé, Maritime, Togo',
                'address' => [
                    'road' => 'Boulevard du 13 Janvier',
                    'city' => 'Lomé',
                    'state' => 'Maritime',
                    'country' => 'Togo',
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/geocoding/reverse?latitude=6.1319&longitude=1.2228', $this->actingAsJwt($this->user));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'display_name',
                    'address',
                ],
            ]);
    }

    public function test_reverse_geocode_requires_coordinates(): void
    {
        $response = $this->getJson('/api/geocoding/reverse', $this->actingAsJwt($this->user));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    public function test_reverse_geocode_requires_valid_latitude(): void
    {
        $response = $this->getJson('/api/geocoding/reverse?latitude=999&longitude=1.2228', $this->actingAsJwt($this->user));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);
    }

    public function test_reverse_geocode_requires_valid_longitude(): void
    {
        $response = $this->getJson('/api/geocoding/reverse?latitude=6.1319&longitude=999', $this->actingAsJwt($this->user));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['longitude']);
    }

    // ==================== SEARCH ADDRESSES TESTS ====================

    public function test_can_search_addresses(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([
                [
                    'lat' => '6.1319',
                    'lon' => '1.2228',
                    'display_name' => 'Lomé, Maritime, Togo',
                ],
                [
                    'lat' => '6.1350',
                    'lon' => '1.2150',
                    'display_name' => 'Lomé Centre, Maritime, Togo',
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/geocoding/search?query=Lomé', $this->actingAsJwt($this->user));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'latitude',
                        'longitude',
                        'display_name',
                    ],
                ],
            ]);
    }

    public function test_search_requires_query_parameter(): void
    {
        $response = $this->getJson('/api/geocoding/search', $this->actingAsJwt($this->user));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['query']);
    }

    public function test_search_requires_minimum_query_length(): void
    {
        $response = $this->getJson('/api/geocoding/search?query=ab', $this->actingAsJwt($this->user));

        $response->assertStatus(422);
    }

    public function test_search_limits_results(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([
                ['lat' => '6.1', 'lon' => '1.2', 'display_name' => 'Place 1'],
                ['lat' => '6.2', 'lon' => '1.3', 'display_name' => 'Place 2'],
                ['lat' => '6.3', 'lon' => '1.4', 'display_name' => 'Place 3'],
                ['lat' => '6.4', 'lon' => '1.5', 'display_name' => 'Place 4'],
                ['lat' => '6.5', 'lon' => '1.6', 'display_name' => 'Place 5'],
                ['lat' => '6.6', 'lon' => '1.7', 'display_name' => 'Place 6'],
            ], 200),
        ]);

        $response = $this->getJson('/api/geocoding/search?query=Place&limit=3', $this->actingAsJwt($this->user));

        $response->assertOk();
        $this->assertLessThanOrEqual(3, count($response->json('data')));
    }

    // ==================== AUTHENTICATION TESTS ====================

    public function test_geocoding_requires_authentication(): void
    {
        $response = $this->getJson('/api/geocoding/geocode?address=Lomé');

        $response->assertUnauthorized();
    }

    public function test_reverse_geocoding_requires_authentication(): void
    {
        $response = $this->getJson('/api/geocoding/reverse?latitude=6.1319&longitude=1.2228');

        $response->assertUnauthorized();
    }

    // ==================== RATE LIMITING TESTS ====================

    public function test_geocoding_respects_rate_limits(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([
                ['lat' => '6.1', 'lon' => '1.2', 'display_name' => 'Lomé'],
            ], 200),
        ]);

        // Make multiple requests - should not fail within reasonable limit
        for ($i = 0; $i < 5; $i++) {
            $response = $this->getJson('/api/geocoding/geocode?address=Lomé'.$i, $this->actingAsJwt($this->user));
            $response->assertOk();
        }
    }

    // ==================== TOGO-SPECIFIC TESTS ====================

    public function test_can_geocode_togo_cities(): void
    {
        Http::fake([
            '*nominatim*' => Http::response([
                ['lat' => '6.1319', 'lon' => '1.2228', 'display_name' => 'Lomé, Togo'],
            ], 200),
        ]);

        $cities = ['Lomé', 'Kara', 'Sokodé', 'Atakpamé'];

        foreach ($cities as $city) {
            $response = $this->getJson("/api/geocoding/geocode?address={$city},Togo", $this->actingAsJwt($this->user));
            $response->assertOk();
        }
    }
}
