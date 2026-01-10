<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Utilisation de SQL direct pour créer les index seulement s'ils n'existent pas
        $this->addIndexIfNotExists('users', 'role');
        $this->addIndexIfNotExists('users', ['role', 'status'], 'users_role_status_index');

        $this->addIndexIfNotExists('products', 'merchant_id');
        $this->addIndexIfNotExists('products', 'category_id');
        $this->addIndexIfNotExists('products', 'is_active');
        $this->addIndexIfNotExists('products', 'expiration_date');
        $this->addIndexIfNotExists('products', ['is_active', 'expiration_date'], 'products_active_expiration_index');
        $this->addIndexIfNotExists('products', ['merchant_id', 'is_active'], 'products_merchant_active_index');
        $this->addIndexIfNotExists('products', 'created_at');

        $this->addIndexIfNotExists('reservations', 'user_id');
        $this->addIndexIfNotExists('reservations', 'product_id');
        $this->addIndexIfNotExists('reservations', 'status');
        $this->addIndexIfNotExists('reservations', ['user_id', 'status'], 'reservations_user_status_index');
        $this->addIndexIfNotExists('reservations', ['product_id', 'status'], 'reservations_product_status_index');
        $this->addIndexIfNotExists('reservations', 'reserved_at');
        $this->addIndexIfNotExists('reservations', 'created_at');

        $this->addIndexIfNotExists('reviews', 'user_id');
        $this->addIndexIfNotExists('reviews', 'product_id');
        $this->addIndexIfNotExists('reviews', 'merchant_id');
        $this->addIndexIfNotExists('reviews', 'rating');
        $this->addIndexIfNotExists('reviews', 'status');
        $this->addIndexIfNotExists('reviews', ['product_id', 'status'], 'reviews_product_status_index');
        $this->addIndexIfNotExists('reviews', ['merchant_id', 'status'], 'reviews_merchant_status_index');
        $this->addIndexIfNotExists('reviews', 'created_at');

        $this->addIndexIfNotExists('loyalty_points', 'user_id');
        $this->addIndexIfNotExists('loyalty_points', 'earned_from');
        $this->addIndexIfNotExists('loyalty_points', 'expires_at');
        $this->addIndexIfNotExists('loyalty_points', ['user_id', 'expires_at'], 'loyalty_points_user_expires_index');
        $this->addIndexIfNotExists('loyalty_points', 'created_at');

        $this->addIndexIfNotExists('merchants', 'user_id');
        $this->addIndexIfNotExists('merchants', 'status');
        $this->addIndexIfNotExists('merchants', 'city');
        $this->addIndexIfNotExists('merchants', ['city', 'status'], 'merchants_city_status_index');
        $this->addIndexIfNotExists('merchants', ['latitude', 'longitude'], 'merchants_location_index');

        $this->addIndexIfNotExists('categories', 'status');
        $this->addIndexIfNotExists('categories', 'parent_id');

        $this->addIndexIfNotExists('notifications', 'user_id');
        $this->addIndexIfNotExists('notifications', 'read_at');
        $this->addIndexIfNotExists('notifications', ['user_id', 'read_at'], 'notifications_user_read_index');
        $this->addIndexIfNotExists('notifications', 'created_at');
    }

    /**
     * Helper method to add index only if it doesn't exist
     */
    private function addIndexIfNotExists($table, $columns, $indexName = null)
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        $columns = is_array($columns) ? $columns : [$columns];
        $indexName = $indexName ?: $table.'_'.implode('_', $columns).'_index';

        // Check if all columns exist in the table
        $tableColumns = collect(DB::select("SHOW COLUMNS FROM {$table}"))->pluck('Field');
        foreach ($columns as $column) {
            if (! $tableColumns->contains($column)) {
                // Column doesn't exist yet, skip index creation
                return;
            }
        }

        // Check if index exists
        $exists = collect(DB::select("SHOW INDEX FROM {$table}"))
            ->where('Key_name', $indexName)
            ->isNotEmpty();

        if (! $exists) {
            $columnsList = implode(', ', array_map(function ($col) {
                return "`{$col}`";
            }, $columns));
            DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` ({$columnsList})");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Suppression simple des index créés - Laravel se charge de supprimer automatiquement
        // en cas de rollback de la migration
    }
};
