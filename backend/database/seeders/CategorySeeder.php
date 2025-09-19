<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Boulangerie',
                'description' => 'Pains, viennoiseries et pâtisseries du jour.',
                'icon' => '🍞',
            ],
            [
                'name' => 'Fruits & Légumes',
                'description' => 'Produits frais invendus chez les primeurs.',
                'icon' => '🥕',
            ],
            [
                'name' => 'Traiteur',
                'description' => 'Plats cuisinés et spécialités salées.',
                'icon' => '🥗',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                array_merge($category, ['is_active' => true])
            );
        }
    }
}
