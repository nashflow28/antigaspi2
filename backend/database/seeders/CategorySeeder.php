<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'id' => 1,
                'name' => 'Boulangerie',
                'description' => 'Pains, viennoiseries et pâtisseries',
                'icon' => '🥖',
                'is_active' => true,
            ],
            [
                'id' => 2,
                'name' => 'Fruits et Légumes',
                'description' => 'Produits frais de saison',
                'icon' => '🍎',
                'is_active' => true,
            ],
            [
                'id' => 3,
                'name' => 'Produits Laitiers',
                'description' => 'Lait, yaourts, fromages',
                'icon' => '🧀',
                'is_active' => true,
            ],
            [
                'id' => 4,
                'name' => 'Épicerie',
                'description' => 'Produits secs et conserves',
                'icon' => '🛒',
                'is_active' => true,
            ],
            [
                'id' => 5,
                'name' => 'Viande et Poisson',
                'description' => 'Produits carnés et fruits de mer',
                'icon' => '🥩',
                'is_active' => true,
            ],
            [
                'id' => 6,
                'name' => 'Boissons',
                'description' => 'Boissons chaudes et froides',
                'icon' => '☕',
                'is_active' => true,
            ],
            [
                'id' => 7,
                'name' => 'Pâtisserie',
                'description' => 'Gâteaux et desserts',
                'icon' => '🍰',
                'is_active' => true,
            ],
            [
                'id' => 8,
                'name' => 'Traiteur',
                'description' => 'Plats préparés et repas',
                'icon' => '🍱',
                'is_active' => true,
            ],
            [
                'id' => 9,
                'name' => 'Autre',
                'description' => 'Autres produits alimentaires',
                'icon' => '📦',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['id' => $category['id']],
                $category
            );
        }
    }
}
