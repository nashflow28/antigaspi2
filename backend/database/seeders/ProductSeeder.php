<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the test merchant (Boulangerie du Centre)
        $merchantUser = User::where('email', 'boulangerie.martin@email.com')->first();
        $merchant = $merchantUser?->merchant;

        if (!$merchant) {
            echo "❌ Merchant not found. Run AdminUserSeeder first.\n";
            return;
        }

        $products = [
            [
                'name' => 'Pain complet artisanal',
                'description' => 'Pain complet frais de la journée, légèrement rassis mais parfait pour accompagner vos repas.',
                'category_id' => 1, // Boulangerie
                'merchant_id' => $merchant->id,
                'original_price' => 500,
                'discounted_price' => 250,
                'quantity_available' => 10,
                'expiration_date' => now()->addDays(1)->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
            [
                'name' => 'Croissants artisanaux (x5)',
                'description' => 'Lot de 5 croissants pur beurre de la veille, encore délicieux pour le petit-déjeuner.',
                'category_id' => 1, // Boulangerie
                'merchant_id' => $merchant->id,
                'original_price' => 250,
                'discounted_price' => 100,
                'quantity_available' => 8,
                'expiration_date' => now()->addDays(1)->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
            [
                'name' => 'Baguette tradition',
                'description' => 'Baguette tradition française, cuite le matin même.',
                'category_id' => 1, // Boulangerie
                'merchant_id' => $merchant->id,
                'original_price' => 300,
                'discounted_price' => 150,
                'quantity_available' => 15,
                'expiration_date' => now()->addDay()->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
            [
                'name' => 'Tarte aux pommes',
                'description' => 'Tarte aux pommes maison, à consommer rapidement.',
                'category_id' => 7, // Pâtisserie
                'merchant_id' => $merchant->id,
                'original_price' => 1500,
                'discounted_price' => 750,
                'quantity_available' => 3,
                'expiration_date' => now()->addDays(2)->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
            [
                'name' => 'Pain au chocolat (x3)',
                'description' => 'Lot de 3 pains au chocolat pur beurre.',
                'category_id' => 1, // Boulangerie
                'merchant_id' => $merchant->id,
                'original_price' => 350,
                'discounted_price' => 200,
                'quantity_available' => 5,
                'expiration_date' => now()->addDay()->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1623334044303-241021148842?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
            [
                'name' => 'Sandwich jambon-beurre',
                'description' => 'Sandwich fait maison avec baguette fraîche, jambon de qualité et beurre.',
                'category_id' => 8, // Traiteur
                'merchant_id' => $merchant->id,
                'original_price' => 800,
                'discounted_price' => 400,
                'quantity_available' => 6,
                'expiration_date' => now()->format('Y-m-d'),
                'image_url' => 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&h=600&fit=crop',
                'is_active' => true,
            ],
        ];

        foreach ($products as $productData) {
            Product::create($productData);
        }

        echo "✅ Created " . count($products) . " products for merchant: " . $merchant->business_name . "\n";
    }
}
