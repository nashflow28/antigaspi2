<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surprise_basket_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surprise_basket_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();

            $table->index('surprise_basket_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surprise_basket_items');
    }
};
