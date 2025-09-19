<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $merchant = Merchant::first();
        $bakery = Category::where('name', 'Boulangerie')->first();
        $produce = Category::where('name', 'Fruits & Légumes')->first();

        if (! $merchant || ! $bakery || ! $produce) {
            return;
        }

        $products = [
            [
                'name' => 'Panier anti-gaspi – Boulangerie',
                'description' => 'Assortiment de pains et viennoiseries de la veille.',
                'original_price' => 15.00,
                'discounted_price' => 5.00,
                'quantity_available' => 5,
                'expiration_date' => now()->addDay(),
                'image_url' => 'https://example.com/images/panier-boulangerie.jpg',
                'category_id' => $bakery->id,
            ],
            [
                'name' => 'Panier fruits & légumes de saison',
                'description' => 'Fruits et légumes légèrement défraîchis mais délicieux.',
                'original_price' => 18.00,
                'discounted_price' => 6.50,
                'quantity_available' => 8,
                'expiration_date' => now()->addDays(2),
                'image_url' => 'https://example.com/images/panier-legumes.jpg',
                'category_id' => $produce->id,
            ],
        ];

        foreach ($products as $productData) {
            Product::updateOrCreate(
                ['name' => $productData['name']],
                array_merge($productData, [
                    'merchant_id' => $merchant->id,
                    'is_active' => true,
                ])
            );
        }
    }
}
