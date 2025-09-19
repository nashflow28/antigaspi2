<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('total_reservations')->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->unsignedInteger('products_saved_from_waste')->default(0);
            $table->unsignedInteger('new_users')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['date', 'merchant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily');
    }
};
