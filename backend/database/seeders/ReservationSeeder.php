<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer le consumer de test
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();

        if (!$consumer) {
            $this->command->warn('Consumer consumer@antigaspi.com not found. Skipping reservation seeding.');
            return;
        }

        // Récupérer les produits du merchant (Boulangerie du Centre)
        $products = Product::where('merchant_id', 1)->get();

        if ($products->isEmpty()) {
            $this->command->warn('No products found for merchant_id=1. Skipping reservation seeding.');
            return;
        }

        // Créer des réservations avec différents statuts
        $reservationsData = [
            [
                'product' => $products[0] ?? null,
                'quantity' => 2,
                'status' => 'pending',
                'created_at' => now()->subHours(2),
            ],
            [
                'product' => $products[1] ?? null,
                'quantity' => 1,
                'status' => 'pending',
                'created_at' => now()->subHours(1),
            ],
            [
                'product' => $products[2] ?? null,
                'quantity' => 3,
                'status' => 'confirmed',
                'created_at' => now()->subHours(5),
                'confirmed_at' => now()->subHours(4),
            ],
            [
                'product' => $products[3] ?? null,
                'quantity' => 1,
                'status' => 'confirmed',
                'created_at' => now()->subHours(3),
                'confirmed_at' => now()->subHours(2),
            ],
            [
                'product' => $products[4] ?? null,
                'quantity' => 2,
                'status' => 'ready',
                'created_at' => now()->subHours(6),
                'confirmed_at' => now()->subHours(5),
            ],
            [
                'product' => $products[0] ?? null,
                'quantity' => 1,
                'status' => 'completed',
                'created_at' => now()->subDays(1),
                'confirmed_at' => now()->subDays(1)->addHours(1),
                'updated_at' => now()->subDays(1)->addHours(3),
            ],
            [
                'product' => $products[1] ?? null,
                'quantity' => 2,
                'status' => 'completed',
                'created_at' => now()->subDays(2),
                'confirmed_at' => now()->subDays(2)->addHours(1),
                'updated_at' => now()->subDays(2)->addHours(2),
            ],
            [
                'product' => $products[2] ?? null,
                'quantity' => 1,
                'status' => 'cancelled',
                'created_at' => now()->subHours(8),
            ],
        ];

        foreach ($reservationsData as $data) {
            if (!$data['product']) {
                continue;
            }

            DB::table('reservations')->insert([
                'user_id' => $consumer->id,
                'product_id' => $data['product']->id,
                'quantity_reserved' => $data['quantity'],
                'total_amount' => $data['product']->discounted_price * $data['quantity'],
                'status' => $data['status'],
                'reservation_code' => 'RES-' . strtoupper(Str::random(8)),
                'reserved_at' => $data['created_at'],
                'confirmed_at' => $data['confirmed_at'] ?? null,
                'expires_at' => now()->addHours(24),
                'created_at' => $data['created_at'],
                'updated_at' => $data['updated_at'] ?? $data['created_at'],
            ]);
        }

        $this->command->info('✅ ' . count($reservationsData) . ' réservations créées avec succès');
    }
}
