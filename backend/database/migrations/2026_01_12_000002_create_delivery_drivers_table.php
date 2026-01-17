<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add driver role to users table
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('consumer', 'merchant', 'admin', 'driver') DEFAULT 'consumer'");

        Schema::create('delivery_drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('vehicle_type', ['moto', 'velo', 'voiture', 'pied'])->default('moto');
            $table->string('vehicle_plate', 20)->nullable();
            $table->string('license_number', 50)->nullable();

            // Status
            $table->boolean('is_available')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);

            // Current position
            $table->decimal('current_latitude', 10, 8)->nullable();
            $table->decimal('current_longitude', 11, 8)->nullable();
            $table->timestamp('last_location_update')->nullable();

            // Work zone
            $table->foreignId('delivery_zone_id')->nullable()->constrained()->nullOnDelete();

            // Statistics
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->unsignedInteger('total_deliveries')->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);

            // Documents (URLs)
            $table->string('id_card_url', 500)->nullable();
            $table->string('license_url', 500)->nullable();
            $table->string('photo_url', 500)->nullable();

            // Verification
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            $table->index(['is_available', 'is_verified', 'is_active'], 'idx_drivers_available');
            $table->index(['current_latitude', 'current_longitude'], 'idx_drivers_location');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_drivers');

        // Revert users role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('consumer', 'merchant', 'admin') DEFAULT 'consumer'");
    }
};
