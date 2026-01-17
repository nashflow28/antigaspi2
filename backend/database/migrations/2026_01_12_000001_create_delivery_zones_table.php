<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_zones', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('city', 100);
            $table->decimal('base_fee', 10, 2)->default(500.00);
            $table->decimal('price_per_km', 10, 2)->default(150.00);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->decimal('max_distance_km', 5, 2)->default(15.00);
            $table->boolean('is_active')->default(true);
            $table->json('polygon')->nullable()->comment('GeoJSON polygon pour définir la zone');
            $table->timestamps();

            $table->index('city');
            $table->index('is_active');
        });

        // Insert default zones for Lomé
        DB::table('delivery_zones')->insert([
            [
                'name' => 'Centre-ville Lomé',
                'city' => 'Lomé',
                'base_fee' => 500.00,
                'price_per_km' => 150.00,
                'min_order_amount' => 1000.00,
                'max_distance_km' => 5.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bè - Adidogomé',
                'city' => 'Lomé',
                'base_fee' => 600.00,
                'price_per_km' => 175.00,
                'min_order_amount' => 1500.00,
                'max_distance_km' => 8.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Agoè - Zongo',
                'city' => 'Lomé',
                'base_fee' => 750.00,
                'price_per_km' => 200.00,
                'min_order_amount' => 2000.00,
                'max_distance_km' => 10.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Périphérie Lomé',
                'city' => 'Lomé',
                'base_fee' => 1000.00,
                'price_per_km' => 250.00,
                'min_order_amount' => 2500.00,
                'max_distance_km' => 15.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_zones');
    }
};
