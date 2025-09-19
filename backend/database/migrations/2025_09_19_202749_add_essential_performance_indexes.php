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
        // Ajouter seulement les index essentiels et existants
        $this->addIndexSafe('products', 'is_active');
        $this->addIndexSafe('products', 'expiration_date');
        $this->addIndexSafe('reservations', 'status');
        $this->addIndexSafe('reviews', 'rating');
        $this->addIndexSafe('reviews', 'is_approved');
        $this->addIndexSafe('loyalty_points', 'earned_from');
        $this->addIndexSafe('loyalty_points', 'expires_at');
    }

    /**
     * Helper method to safely add index
     */
    private function addIndexSafe($table, $column)
    {
        try {
            // Vérifier que la table et la colonne existent
            $exists = DB::select("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$table}' AND COLUMN_NAME = '{$column}'");

            if (!empty($exists)) {
                $indexName = $table . '_' . $column . '_index';

                // Vérifier si l'index n'existe pas déjà
                $indexExists = collect(DB::select("SHOW INDEX FROM {$table}"))
                    ->where('Key_name', $indexName)
                    ->isNotEmpty();

                if (!$indexExists) {
                    DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` (`{$column}`)");
                }
            }
        } catch (\Exception $e) {
            // Ignorer les erreurs silencieusement
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Pas de rollback
    }
};
