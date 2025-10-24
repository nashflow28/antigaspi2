<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 🐛 BUG FIX #31: Add performance indexes for favorites table
     */
    public function up(): void
    {
        Schema::table('favorites', function (Blueprint $table) {
            // Add index on created_at for ORDER BY queries
            $table->index('created_at', 'favorites_created_at_index');

            // Add composite index on (user_id, created_at) for optimized user favorites listing
            // This index will be used when querying user favorites ordered by creation date
            $table->index(['user_id', 'created_at'], 'favorites_user_id_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('favorites', function (Blueprint $table) {
            $table->dropIndex('favorites_created_at_index');
            $table->dropIndex('favorites_user_id_created_at_index');
        });
    }
};
