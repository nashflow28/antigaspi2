<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('delivery_drivers')->cascadeOnDelete();
            $table->foreignId('delivery_id')->nullable()->constrained()->nullOnDelete();

            $table->enum('type', ['delivery', 'bonus', 'tip', 'adjustment', 'withdrawal']);
            $table->decimal('amount', 10, 2);
            $table->string('description', 255)->nullable();

            // For withdrawals
            $table->enum('status', ['pending', 'completed', 'failed'])->default('completed');
            $table->timestamp('processed_at')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index(['driver_id', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_earnings');
    }
};
