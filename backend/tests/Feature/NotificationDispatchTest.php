<?php

namespace Tests\Feature;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class NotificationDispatchTest extends TestCase
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
            'services.webpush.public_key' => null,
            'services.webpush.private_key' => null,
        ]);
    }

    protected function actingAsUser(User $user)
    {
        $token = JWTAuth::fromUser($user);

        return $this->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_confirming_reservation_creates_notification_record(): void
    {
        $consumer = User::factory()->create([
            'prefers_email_notifications' => true,
            'prefers_push_notifications' => false,
            'prefers_sms_notifications' => false,
        ]);

        $merchant = Merchant::factory()->create();
        $product = Product::factory()->for($merchant)->create();

        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsUser($merchant->user)->postJson("/api/reservations/{$reservation->id}/confirm");

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $consumer->id,
            'type' => 'reservation_status',
            'is_read' => false,
        ]);
    }

    public function test_creating_surprise_basket_notifies_opted_in_consumers(): void
    {
        $consumer = User::factory()->create([
            'prefers_email_notifications' => false,
            'prefers_sms_notifications' => false,
            'prefers_push_notifications' => true,
        ]);

        $merchant = Merchant::factory()->create();
        $existingProduct = Product::factory()->for($merchant)->create([
            'quantity_available' => 10,
        ]);

        $payload = [
            'name' => 'Panier du jour',
            'description' => 'Une sélection surprise de produits frais.',
            'surprise_description' => 'Inclus fruits et viennoiseries.',
            'discounted_price' => 1500,
            'quantity_available' => 3,
            'products' => [
                ['id' => $existingProduct->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAsUser($merchant->user)->postJson('/api/surprise-baskets', $payload);

        $response->assertCreated()->assertJson(['success' => true]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $consumer->id,
            'type' => 'surprise_basket',
        ]);
    }
}
