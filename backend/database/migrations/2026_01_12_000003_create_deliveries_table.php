<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
            $table->foreignId('delivery_zone_id')->nullable()->constrained()->nullOnDelete();

            // Unique delivery code
            $table->string('delivery_code', 20)->unique();

            // Status
            $table->enum('status', [
                'pending',      // En attente d'un livreur
                'searching',    // Recherche d'un livreur
                'assigned',     // Livreur assigné
                'picking_up',   // Livreur en route vers merchant
                'picked_up',    // Colis récupéré
                'delivering',   // En cours de livraison
                'delivered',    // Livré
                'cancelled',    // Annulé
                'failed',        // Échec de livraison
            ])->default('pending');

            // Pickup address (merchant)
            $table->text('pickup_address');
            $table->decimal('pickup_latitude', 10, 8);
            $table->decimal('pickup_longitude', 11, 8);
            $table->text('pickup_instructions')->nullable();

            // Delivery address (consumer)
            $table->text('delivery_address');
            $table->decimal('delivery_latitude', 10, 8);
            $table->decimal('delivery_longitude', 11, 8);
            $table->text('delivery_instructions')->nullable();

            // Consumer contact
            $table->string('recipient_name', 100);
            $table->string('recipient_phone', 20);

            // Pricing
            $table->decimal('delivery_fee', 10, 2);
            $table->decimal('driver_commission', 10, 2);
            $table->decimal('platform_commission', 10, 2);
            $table->decimal('distance_km', 5, 2)->nullable();
            $table->unsignedInteger('estimated_duration_min')->nullable();

            // Event timestamps
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // ETA
            $table->timestamp('estimated_pickup_at')->nullable();
            $table->timestamp('estimated_delivery_at')->nullable();

            // Notes and feedback
            $table->text('cancellation_reason')->nullable();
            $table->enum('cancelled_by', ['consumer', 'merchant', 'driver', 'system'])->nullable();
            $table->text('failure_reason')->nullable();
            $table->text('driver_notes')->nullable();

            // Rating
            $table->unsignedTinyInteger('consumer_rating')->nullable();
            $table->text('consumer_feedback')->nullable();
            $table->unsignedTinyInteger('merchant_rating')->nullable();

            // Proof of delivery
            $table->string('delivery_photo_url', 500)->nullable();
            $table->string('signature_url', 500)->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index(['driver_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
