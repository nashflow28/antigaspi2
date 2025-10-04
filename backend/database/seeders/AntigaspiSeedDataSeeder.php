<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Category;

class AntigaspiSeedDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Import des données Antigaspi depuis JSON...');

        // Chemins des fichiers JSON
        $boutiquesPath = base_path('../antigaspi_seed_data/boutiques.json');
        $produitsPath = base_path('../antigaspi_seed_data/produits.json');

        // Vérifier que les fichiers existent
        if (!file_exists($boutiquesPath)) {
            $this->command->error("❌ Fichier boutiques.json introuvable: {$boutiquesPath}");
            return;
        }

        if (!file_exists($produitsPath)) {
            $this->command->error("❌ Fichier produits.json introuvable: {$produitsPath}");
            return;
        }

        // Charger les données JSON
        $boutiquesData = json_decode(file_get_contents($boutiquesPath), true);
        $produitsData = json_decode(file_get_contents($produitsPath), true);

        if (!isset($boutiquesData['boutiques'])) {
            $this->command->error("❌ Format JSON invalide pour boutiques.json");
            return;
        }

        if (!isset($produitsData['produits'])) {
            $this->command->error("❌ Format JSON invalide pour produits.json");
            return;
        }

        $this->command->info("📦 " . count($boutiquesData['boutiques']) . " boutiques à importer");
        $this->command->info("📦 " . count($produitsData['produits']) . " produits à importer");

        // Mapping des catégories
        $categoryMapping = [
            'boulangerie' => 'Boulangerie',
            'restaurant' => 'Plats cuisinés',
            'fruits_legumes' => 'Fruits & Légumes',
            'supermarche' => 'Épicerie',
            'boucherie' => 'Viandes & Poissons',
        ];

        // Stocker les merchants créés avec leur ID d'origine
        $merchantsMap = [];

        // Import des boutiques
        $this->command->info("\n🏪 Import des boutiques...");

        foreach ($boutiquesData['boutiques'] as $boutique) {
            // Créer un utilisateur merchant pour cette boutique
            $email = strtolower(str_replace(' ', '.', $boutique['nom'])) . '@antigaspi.tg';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => explode(' ', $boutique['nom'])[0],
                    'last_name' => implode(' ', array_slice(explode(' ', $boutique['nom']), 1)) ?: 'Shop',
                    'password' => Hash::make('password'),
                    'role' => 'merchant',
                    'city' => 'Lomé',
                    'phone' => $boutique['telephone'] ?? null,
                ]
            );

            // Créer le merchant
            $merchant = Merchant::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $boutique['nom'],
                    'business_type' => $boutique['categorie'],
                    'is_verified' => true,
                    'verification_date' => now(),
                ]
            );

            // Stocker le mapping
            $merchantsMap[$boutique['id']] = $merchant->id;

            $this->command->info("  ✅ {$boutique['nom']} (ID: {$merchant->id}, User: {$user->email})");
        }

        // Import des produits
        $this->command->info("\n📦 Import des produits...");

        foreach ($produitsData['produits'] as $produit) {
            // Récupérer le merchant_id réel depuis le mapping
            if (!isset($merchantsMap[$produit['boutique_id']])) {
                $this->command->warn("  ⚠️  Boutique ID {$produit['boutique_id']} introuvable pour produit: {$produit['nom']}");
                continue;
            }

            $merchantId = $merchantsMap[$produit['boutique_id']];

            // Trouver la catégorie
            $merchant = Merchant::find($merchantId);
            $categoryName = $categoryMapping[$merchant->business_type] ?? 'Autres';
            $category = Category::where('name', $categoryName)->first();

            // Créer le produit
            $product = Product::create([
                'merchant_id' => $merchantId,
                'category_id' => $category?->id,
                'name' => $produit['nom'],
                'description' => $produit['description'] ?? null,
                'original_price' => $produit['prix_original'],
                'discounted_price' => $produit['prix'],
                'quantity_available' => $produit['quantite_disponible'],
                'expiration_date' => $produit['date_expiration'],
                'image_url' => $produit['image'] ?? null,
                'is_active' => true,
            ]);

            $this->command->info("  ✅ {$produit['nom']} - {$produit['prix']} F CFA (Boutique: {$merchant->business_name})");
        }

        $this->command->info("\n✅ Import terminé!");
        $this->command->info("📊 Statistiques:");
        $this->command->info("   - Boutiques: " . count($merchantsMap));
        $this->command->info("   - Produits: " . Product::count());
        $this->command->info("\n💡 Comptes merchants créés:");

        foreach ($boutiquesData['boutiques'] as $boutique) {
            $email = strtolower(str_replace(' ', '.', $boutique['nom'])) . '@antigaspi.tg';
            $this->command->info("   📧 {$email} / password: password");
        }
    }
}
