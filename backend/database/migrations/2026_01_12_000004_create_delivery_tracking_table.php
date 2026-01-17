<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('delivery_drivers')->cascadeOnDelete();

            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('accuracy', 6, 2)->nullable()->comment('GPS accuracy in meters');
            $table->decimal('speed', 5, 2)->nullable()->comment('Speed in km/h');
            $table->decimal('heading', 5, 2)->nullable()->comment('Direction in degrees');
            $table->decimal('altitude', 7, 2)->nullable();

            $table->timestamp('recorded_at')->useCurrent();

            $table->index(['delivery_id', 'recorded_at']);
            $table->index(['driver_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_tracking');
    }
};
