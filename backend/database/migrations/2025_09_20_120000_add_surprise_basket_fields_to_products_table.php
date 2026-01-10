<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_surprise_basket')->default(false)->after('is_active');
            $table->unsignedInteger('min_items')->nullable()->after('is_surprise_basket');
            $table->unsignedInteger('max_items')->nullable()->after('min_items');
            $table->decimal('total_original_value', 10, 2)->nullable()->after('max_items');
            $table->text('surprise_description')->nullable()->after('total_original_value');

            $table->index(['merchant_id', 'is_surprise_basket', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['merchant_id', 'is_surprise_basket', 'is_active']);
            $table->dropColumn([
                'is_surprise_basket',
                'min_items',
                'max_items',
                'total_original_value',
                'surprise_description',
            ]);
        });
    }
};
