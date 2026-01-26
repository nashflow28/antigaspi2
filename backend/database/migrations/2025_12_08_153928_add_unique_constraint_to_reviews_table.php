<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute une contrainte d'unicité pour empêcher un utilisateur
     * de laisser plusieurs avis sur le même produit/commerçant
     */
    public function up(): void
    {
        // D'abord, supprimer les doublons existants (garder le plus récent)
        // Utilise une approche compatible SQLite et MySQL
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: Utiliser une sous-requête pour trouver les IDs à supprimer
            DB::statement('
                DELETE FROM reviews
                WHERE id IN (
                    SELECT r1.id
                    FROM reviews r1, reviews r2
                    WHERE r1.id < r2.id
                    AND r1.user_id = r2.user_id
                    AND r1.merchant_id = r2.merchant_id
                    AND (r1.product_id = r2.product_id OR (r1.product_id IS NULL AND r2.product_id IS NULL))
                )
            ');
        } else {
            // MySQL: Syntaxe DELETE JOIN native
            DB::statement('
                DELETE r1 FROM reviews r1
                INNER JOIN reviews r2
                WHERE r1.id < r2.id
                AND r1.user_id = r2.user_id
                AND r1.merchant_id = r2.merchant_id
                AND (r1.product_id = r2.product_id OR (r1.product_id IS NULL AND r2.product_id IS NULL))
            ');
        }

        Schema::table('reviews', function (Blueprint $table) {
            // Contrainte unique sur user_id + merchant_id + product_id
            // Note: MySQL traite les NULL comme distincts dans les index uniques
            // donc on utilise un index composite qui gère les deux cas
            $table->unique(['user_id', 'merchant_id', 'product_id'], 'reviews_unique_user_merchant_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique('reviews_unique_user_merchant_product');
        });
    }
};
