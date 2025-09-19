<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();
        $product = Product::where('name', 'Panier anti-gaspi – Boulangerie')->first();

        if (! $consumer || ! $product) {
            return;
        }

        Reservation::updateOrCreate(
            ['reservation_code' => 'RES000001'],
            [
                'user_id' => $consumer->id,
                'product_id' => $product->id,
                'quantity_reserved' => 1,
                'total_amount' => $product->discounted_price,
                'status' => 'confirmed',
                'reserved_at' => now()->subHours(3),
                'confirmed_at' => now()->subHours(2),
                'expires_at' => now()->addHours(10),
                'notes' => 'Retrait prévu dans l\'après-midi.',
            ]
        );
    }
}
