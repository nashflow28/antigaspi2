<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('is_approved')->default(true)->after('is_verified_purchase');
            $table->timestamp('approved_at')->nullable()->after('is_approved');
            $table->index(['merchant_id', 'is_approved']);
            $table->index(['product_id', 'is_approved']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['reviews_merchant_id_is_approved_index']);
            $table->dropIndex(['reviews_product_id_is_approved_index']);
            $table->dropColumn(['is_approved', 'approved_at']);
        });
    }
};
