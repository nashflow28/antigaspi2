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
        // Ajouter seulement les index manquants essentiels avec les vraies colonnes
        $this->addIndexIfNotExists('products', 'merchant_id');
        $this->addIndexIfNotExists('products', 'category_id');
        $this->addIndexIfNotExists('products', 'is_active');
        $this->addIndexIfNotExists('products', 'expiration_date');
        $this->addIndexIfNotExists('products', ['merchant_id', 'is_active'], 'products_merchant_active_index');

        $this->addIndexIfNotExists('reservations', 'user_id');
        $this->addIndexIfNotExists('reservations', 'product_id');
        $this->addIndexIfNotExists('reservations', 'status');
        $this->addIndexIfNotExists('reservations', ['user_id', 'status'], 'reservations_user_status_index');

        $this->addIndexIfNotExists('reviews', 'user_id');
        $this->addIndexIfNotExists('reviews', 'product_id');
        $this->addIndexIfNotExists('reviews', 'merchant_id');
        $this->addIndexIfNotExists('reviews', 'rating');
        $this->addIndexIfNotExists('reviews', 'is_approved');

        $this->addIndexIfNotExists('loyalty_points', 'user_id');
        $this->addIndexIfNotExists('loyalty_points', 'earned_from');
        $this->addIndexIfNotExists('loyalty_points', 'expires_at');

        $this->addIndexIfNotExists('merchants', 'user_id');
        $this->addIndexIfNotExists('merchants', 'city');

        $this->addIndexIfNotExists('notifications', 'user_id');
        $this->addIndexIfNotExists('notifications', 'read_at');
    }

    /**
     * Helper method to add index only if it doesn't exist
     */
    private function addIndexIfNotExists($table, $columns, $indexName = null)
    {
        $columns = is_array($columns) ? $columns : [$columns];
        $indexName = $indexName ?: $table . '_' . implode('_', $columns) . '_index';

        // Check if index exists
        $exists = collect(DB::select("SHOW INDEX FROM {$table}"))
            ->where('Key_name', $indexName)
            ->isNotEmpty();

        if (!$exists) {
            $columnsList = implode(', ', array_map(function($col) { return "`{$col}`"; }, $columns));
            DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` ({$columnsList})");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Pas de rollback nécessaire
    }
};
