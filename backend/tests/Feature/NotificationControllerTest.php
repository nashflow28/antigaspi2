<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $secret = str_repeat('a', 64);

        config([
            'jwt.secret' => $secret,
            'jwt.keys.secret' => $secret,
            'queue.default' => 'sync',
        ]);
    }

    protected function actingAsUser(User $user)
    {
        $token = JWTAuth::fromUser($user);

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    public function test_user_can_list_their_notifications(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(2)->create(['user_id' => $user->id]);
        Notification::factory()->create();

        $response = $this->actingAsUser($user)->getJson('/api/notifications');

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('meta.total', 2);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $response = $this->actingAsUser($user)->postJson("/api/notifications/{$notification->id}/read");

        $response->assertOk()
            ->assertJsonPath('data.is_read', true);

        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_user_can_manage_push_subscriptions(): void
    {
        $user = User::factory()->create();
        $endpoint = 'https://example.com/push/' . uniqid();

        $subscribeResponse = $this->actingAsUser($user)->postJson('/api/notifications/subscriptions', [
            'endpoint' => $endpoint,
            'public_key' => 'test-public-key',
            'auth_token' => 'auth-token',
            'content_encoding' => 'aes128gcm',
        ]);

        $subscribeResponse->assertCreated()->assertJson(['success' => true]);
        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => $endpoint,
        ]);

        $unsubscribeResponse = $this->actingAsUser($user)->deleteJson('/api/notifications/subscriptions', [
            'endpoint' => $endpoint,
        ]);

        $unsubscribeResponse->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseMissing('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => $endpoint,
        ]);
    }

    public function test_user_can_update_notification_preferences(): void
    {
        $user = User::factory()->create([
            'prefers_email_notifications' => true,
            'prefers_sms_notifications' => false,
            'prefers_push_notifications' => false,
        ]);

        $response = $this->actingAsUser($user)->patchJson('/api/notifications/preferences', [
            'email' => false,
            'sms' => true,
            'push' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.prefers_email_notifications', false)
            ->assertJsonPath('data.prefers_sms_notifications', true)
            ->assertJsonPath('data.prefers_push_notifications', true);

        $user->refresh();

        $this->assertFalse($user->prefers_email_notifications);
        $this->assertTrue($user->prefers_sms_notifications);
        $this->assertTrue($user->prefers_push_notifications);
    }

    public function test_user_can_fetch_legacy_notification_settings(): void
    {
        $user = User::factory()->create([
            'notification_settings' => [
                'enabled' => false,
                'new_products' => true,
                'reservations' => false,
                'promotions' => true,
                'expiring_products' => false,
                'quiet_hours_enabled' => true,
                'quiet_hours_start' => '21:30',
                'quiet_hours_end' => '07:15',
            ],
        ]);

        $response = $this->actingAsUser($user)->getJson('/api/notifications/settings');

        $response->assertOk()
            ->assertJsonPath('data.enabled', false)
            ->assertJsonPath('data.reservations', false)
            ->assertJsonPath('data.quiet_hours_enabled', true)
            ->assertJsonPath('data.quiet_hours_start', '21:30')
            ->assertJsonPath('data.quiet_hours_end', '07:15');
    }

    public function test_user_can_update_legacy_notification_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAsUser($user)->patchJson('/api/notifications/settings', [
            'enabled' => false,
            'new_products' => true,
            'reservations' => false,
            'promotions' => true,
            'expiring_products' => true,
            'quiet_hours_enabled' => true,
            'quiet_hours_start' => '20:00',
            'quiet_hours_end' => '06:30',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.enabled', false)
            ->assertJsonPath('data.quiet_hours_enabled', true)
            ->assertJsonPath('data.quiet_hours_start', '20:00')
            ->assertJsonPath('data.quiet_hours_end', '06:30');

        $user->refresh();

        $this->assertEquals([
            'enabled' => false,
            'new_products' => true,
            'reservations' => false,
            'promotions' => true,
            'expiring_products' => true,
            'quiet_hours_enabled' => true,
            'quiet_hours_start' => '20:00',
            'quiet_hours_end' => '06:30',
        ], $user->notification_settings);
    }
}
