<?php

namespace Tests\Feature;

use App\Models\InventoryMovement;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class InventoryControllerTest extends TestCase
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

    public function test_merchant_can_record_stock_entry(): void
    {
        $user = User::factory()->merchant()->create();
        $merchant = Merchant::factory()->for($user, 'user')->create();
        $product = Product::factory()->for($merchant)->create([
            'quantity_available' => 5,
            'low_stock_threshold' => 2,
        ]);

        $payload = [
            'product_id' => $product->id,
            'type' => 'stock_in',
            'quantity' => 3,
            'reason' => 'Réapprovisionnement hebdomadaire',
        ];

        $response = $this->actingAsUser($user)->postJson('/api/inventory/movements', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.product.quantity_available', 8)
            ->assertJsonPath('data.movement.quantity_change', 3);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'movement_type' => 'stock_in',
            'quantity_change' => 3,
            'quantity_after' => 8,
        ]);

        $this->assertEquals(8, $product->fresh()->quantity_available);
    }

    public function test_low_stock_trigger_creates_notification(): void
    {
        $user = User::factory()->merchant()->create();
        $merchant = Merchant::factory()->for($user, 'user')->create();
        $product = Product::factory()->for($merchant)->create([
            'quantity_available' => 4,
            'low_stock_threshold' => 3,
        ]);

        $response = $this->actingAsUser($user)->postJson('/api/inventory/movements', [
            'product_id' => $product->id,
            'type' => 'stock_out',
            'quantity' => 2,
            'reason' => 'Commande client',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.product.is_low_stock', true);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'inventory.low_stock',
        ]);
    }

    public function test_inventory_summary_returns_metrics_and_recent_movements(): void
    {
        $user = User::factory()->merchant()->create();
        $merchant = Merchant::factory()->for($user, 'user')->create();

        $lowStockProduct = Product::factory()->for($merchant)->create([
            'name' => 'Sandwich Végétarien',
            'quantity_available' => 2,
            'low_stock_threshold' => 5,
        ]);

        $regularProduct = Product::factory()->for($merchant)->create([
            'name' => 'Salade Fraîche',
            'quantity_available' => 10,
            'low_stock_threshold' => 3,
        ]);

        InventoryMovement::create([
            'product_id' => $regularProduct->id,
            'merchant_id' => $merchant->id,
            'user_id' => $user->id,
            'movement_type' => 'stock_in',
            'quantity_change' => 5,
            'quantity_after' => 15,
            'reason' => 'Réception fournisseur',
        ]);

        $response = $this->actingAsUser($user)->getJson('/api/inventory/summary');

        $response->assertOk()
            ->assertJsonPath('data.metrics.total_products', 2)
            ->assertJsonPath('data.metrics.low_stock_products', 1)
            ->assertJsonPath('data.low_stock_items.0.id', $lowStockProduct->id)
            ->assertJsonPath('data.recent_movements.0.type', 'stock_in');
    }
}
