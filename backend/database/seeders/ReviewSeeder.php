<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer le consumer de test
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();

        if (!$consumer) {
            $this->command->warn('Consumer consumer@antigaspi.com not found. Skipping review seeding.');
            return;
        }

        // Récupérer les produits du merchant (Boulangerie du Centre, merchant_id = 1)
        $products = Product::where('merchant_id', 1)->get();

        if ($products->isEmpty()) {
            $this->command->warn('No products found for merchant_id=1. Skipping review seeding.');
            return;
        }

        // Créer des avis avec différentes notes et commentaires
        $reviewsData = [
            [
                'product' => $products[0] ?? null,
                'rating' => 5,
                'title' => 'Excellent pain frais!',
                'comment' => 'Le pain était vraiment délicieux et encore chaud. Merci pour cette belle initiative anti-gaspi!',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(2),
            ],
            [
                'product' => $products[1] ?? null,
                'rating' => 5,
                'title' => 'Croissants parfaits',
                'comment' => 'Croissants excellents, croustillants à l\'extérieur et moelleux à l\'intérieur. Prix imbattable!',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(3),
                'merchant_response' => 'Merci beaucoup pour ce retour positif! Nous sommes ravis que nos croissants vous aient plu. À bientôt!',
                'merchant_response_at' => now()->subDays(2)->addHours(5),
            ],
            [
                'product' => $products[0] ?? null,
                'rating' => 4,
                'title' => 'Très bon rapport qualité/prix',
                'comment' => 'Pain de bonne qualité même en fin de journée. Une petite étoile en moins car il manquait un peu de croustillant.',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(5),
            ],
            [
                'product' => $products[2] ?? null,
                'rating' => 5,
                'title' => 'Super concept!',
                'comment' => 'J\'adore pouvoir acheter des produits frais à prix réduit. C\'est bon pour le portefeuille et pour la planète!',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(7),
                'merchant_response' => 'Merci infiniment! C\'est exactement notre mission: réduire le gaspillage tout en rendant les bons produits accessibles. 🌍',
                'merchant_response_at' => now()->subDays(6)->addHours(3),
            ],
            [
                'product' => $products[1] ?? null,
                'rating' => 3,
                'title' => 'Correct mais pas exceptionnel',
                'comment' => 'Les croissants étaient bons mais un peu secs. Peut-être un peu trop vieux?',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(10),
            ],
            [
                'product' => $products[3] ?? null,
                'rating' => 5,
                'title' => 'Top!',
                'comment' => 'Livraison rapide, produits frais. Je recommande vivement cette boulangerie!',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(1),
            ],
            [
                'product' => $products[0] ?? null,
                'rating' => 4,
                'title' => 'Bien',
                'comment' => 'Bonne initiative. Le pain est de qualité et le prix est très attractif.',
                'is_verified_purchase' => false,
                'created_at' => now()->subDays(4),
                'merchant_response' => 'Merci pour votre avis! N\'hésitez pas à revenir nous voir. Nous mettons en ligne de nouveaux produits chaque jour.',
                'merchant_response_at' => now()->subDays(3)->addHours(8),
            ],
            [
                'product' => $products[2] ?? null,
                'rating' => 5,
                'title' => 'Parfait pour moi!',
                'comment' => 'Je suis une maman de 3 enfants et ces prix me permettent d\'acheter du pain frais tous les jours. Merci!',
                'is_verified_purchase' => true,
                'created_at' => now()->subHours(12),
            ],
            [
                'product' => $products[4] ?? null,
                'rating' => 4,
                'title' => 'Satisfait',
                'comment' => 'Produit conforme à la description. Je reviendrai.',
                'is_verified_purchase' => true,
                'created_at' => now()->subHours(6),
            ],
            [
                'product' => $products[1] ?? null,
                'rating' => 5,
                'title' => 'Meilleurs croissants de Lomé!',
                'comment' => 'Sérieusement, ces croissants sont incroyables. Et en plus à moitié prix? C\'est un rêve!',
                'is_verified_purchase' => true,
                'created_at' => now()->subDays(8),
            ],
        ];

        foreach ($reviewsData as $data) {
            if (!$data['product']) {
                continue;
            }

            DB::table('reviews')->insert([
                'user_id' => $consumer->id,
                'merchant_id' => 1, // Boulangerie du Centre
                'product_id' => $data['product']->id,
                'rating' => $data['rating'],
                'title' => $data['title'],
                'comment' => $data['comment'],
                'merchant_response' => $data['merchant_response'] ?? null,
                'merchant_response_at' => $data['merchant_response_at'] ?? null,
                'is_verified_purchase' => $data['is_verified_purchase'],
                'is_approved' => true,
                'approved_at' => $data['created_at'],
                'created_at' => $data['created_at'],
                'updated_at' => $data['created_at'],
            ]);
        }

        $this->command->info('✅ ' . count($reviewsData) . ' avis créés avec succès');
    }
}
