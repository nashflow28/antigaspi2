<?php

namespace Tests\Feature;

use App\Models\AnalyticsDaily;
use App\Models\Merchant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);
    }

    public function test_authenticated_user_can_store_events_and_aggregate_stats(): void
    {
        $user = User::factory()->create();
        $merchant = Merchant::factory()->create();

        $headers = $this->actingAsJwt($user);

        $timestamp = Carbon::now()->startOfDay()->addHours(10)->getTimestampMs();

        $response = $this->postJson('/api/analytics/events', [
            'events' => [
                [
                    'name' => 'Reservation Created',
                    'category' => 'Commerce',
                    'timestamp' => $timestamp,
                    'sessionId' => 'session-123',
                    'properties' => [
                        'quantity' => 2,
                        'totalAmount' => 5000,
                        'merchantId' => $merchant->id,
                    ],
                ],
                [
                    'name' => 'Purchase',
                    'category' => 'Revenue',
                    'timestamp' => $timestamp,
                    'sessionId' => 'session-123',
                    'properties' => [
                        'amount' => 5000,
                        'currency' => 'XOF',
                        'merchantId' => $merchant->id,
                    ],
                ],
                [
                    'name' => 'User Identified',
                    'category' => 'User',
                    'timestamp' => $timestamp,
                    'properties' => [
                        'createdAt' => Carbon::now()->toIso8601String(),
                        'role' => 'consumer',
                    ],
                ],
            ],
        ], $headers);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'stored' => 3,
            ]);

        $this->assertDatabaseHas('analytics_events', [
            'name' => 'Reservation Created',
            'user_id' => $user->id,
        ]);

        $today = Carbon::today()->toDateString();

        $globalDaily = AnalyticsDaily::global()->whereDate('date', $today)->first();
        $this->assertNotNull($globalDaily);
        $this->assertSame(1, $globalDaily->total_reservations);
        $this->assertEquals(5000.0, (float) $globalDaily->total_revenue);
        $this->assertSame(2, $globalDaily->products_saved_from_waste);
        $this->assertSame(1, $globalDaily->new_users);

        $merchantDaily = AnalyticsDaily::forMerchant($merchant->id)->whereDate('date', $today)->first();
        $this->assertNotNull($merchantDaily);
        $this->assertSame(1, $merchantDaily->total_reservations);
        $this->assertEquals(5000.0, (float) $merchantDaily->total_revenue);
        $this->assertSame(2, $merchantDaily->products_saved_from_waste);

        $stats = $this->getJson('/api/analytics/stats?start_date=' . $today . '&end_date=' . $today, $headers);

        $stats->assertOk()
            ->assertJsonPath('summary.total_reservations', 1)
            ->assertJsonPath('summary.total_revenue', 5000)
            ->assertJsonPath('summary.products_saved_from_waste', 2)
            ->assertJsonPath('summary.new_users', 1)
            ->assertJsonPath('summary.event_count', 3);

        $topEventNames = collect($stats->json('top_events'))->pluck('name');
        $this->assertContains('Reservation Created', $topEventNames);
        $this->assertContains('Purchase', $topEventNames);
    }

    public function test_guest_cannot_store_events(): void
    {
        $response = $this->postJson('/api/analytics/events', [
            'events' => [
                [
                    'name' => 'Test Event',
                    'category' => 'Test',
                ],
            ],
        ]);

        $response->assertUnauthorized();
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer ' . $token];
    }
}
