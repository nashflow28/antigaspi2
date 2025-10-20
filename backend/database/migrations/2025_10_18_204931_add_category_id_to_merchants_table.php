<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            // Ajouter category_id comme clé étrangère vers categories
            $table->foreignId('category_id')->nullable()->after('business_type')->constrained()->nullOnDelete();
        });

        // Mapper les business_type existants vers les catégories
        $businessTypeToCategoryMapping = [
            'bakery' => 1,           // Boulangerie
            'boulangerie' => 1,      // Boulangerie
            'primeur' => 2,          // Fruits et Légumes
            'produce' => 2,          // Fruits et Légumes
            'fruits' => 2,           // Fruits et Légumes
            'dairy' => 3,            // Produits Laitiers
            'laiterie' => 3,         // Produits Laitiers
            'grocery' => 4,          // Épicerie
            'épicerie' => 4,         // Épicerie
            'epicerie' => 4,         // Épicerie
            'butcher' => 5,          // Viande et Poisson
            'boucherie' => 5,        // Viande et Poisson
            'fishmonger' => 5,       // Viande et Poisson
            'bar' => 6,              // Boissons
            'cafe' => 6,             // Boissons
            'café' => 6,             // Boissons
            'pastry' => 7,           // Pâtisserie
            'patisserie' => 7,       // Pâtisserie
            'pâtisserie' => 7,       // Pâtisserie
            'restaurant' => 8,       // Traiteur
            'catering' => 8,         // Traiteur
            'traiteur' => 8,         // Traiteur
            'marché' => 4,           // Marché → Épicerie
            'marche' => 4,           // Marché → Épicerie
            'market' => 4,           // Marché → Épicerie
        ];

        // Mettre à jour les merchants existants
        $merchants = DB::table('merchants')->get();
        foreach ($merchants as $merchant) {
            $businessType = strtolower($merchant->business_type ?? '');
            $categoryId = null;

            // Chercher une correspondance dans le mapping
            foreach ($businessTypeToCategoryMapping as $type => $catId) {
                if (str_contains($businessType, $type)) {
                    $categoryId = $catId;
                    break;
                }
            }

            // Si aucune correspondance, utiliser la catégorie "Autre" (id 9)
            if (!$categoryId) {
                $categoryId = 9;
            }

            DB::table('merchants')
                ->where('id', $merchant->id)
                ->update(['category_id' => $categoryId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
