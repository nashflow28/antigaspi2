<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();
        $product = Product::where('name', 'Panier anti-gaspi – Boulangerie')->first();
        $merchant = Merchant::first();

        if (! $consumer || ! $product || ! $merchant) {
            return;
        }

        Review::updateOrCreate(
            [
                'user_id' => $consumer->id,
                'product_id' => $product->id,
            ],
            [
                'merchant_id' => $merchant->id,
                'rating' => 5,
                'title' => 'Excellent panier',
                'comment' => 'Les viennoiseries étaient encore moelleuses, je recommande !',
                'is_verified_purchase' => true,
            ]
        );
    }
}
