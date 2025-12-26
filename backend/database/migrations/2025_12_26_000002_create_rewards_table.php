<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rewards catalog table
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('image_url')->nullable();
            $table->integer('points_required');
            $table->enum('type', ['discount', 'product', 'voucher', 'experience']);
            $table->decimal('value', 10, 2)->nullable(); // Discount amount or product value
            $table->string('value_type')->default('fixed'); // 'fixed' or 'percentage'
            $table->integer('quantity_available')->nullable(); // null = unlimited
            $table->integer('quantity_redeemed')->default(0);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->enum('tier_required', ['bronze', 'silver', 'gold', 'platinum'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'valid_until']);
            $table->index('tier_required');
        });

        // User reward redemptions
        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reward_id')->constrained()->cascadeOnDelete();
            $table->integer('points_spent');
            $table->string('redemption_code', 20)->unique();
            $table->enum('status', ['pending', 'used', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('redemption_code');
        });

        // Add loyalty tier to users
        Schema::table('users', function (Blueprint $table) {
            $table->enum('loyalty_tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze')->after('referral_bonus_awarded');
            $table->integer('lifetime_points')->default(0)->after('loyalty_tier');
            $table->timestamp('tier_updated_at')->nullable()->after('lifetime_points');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['loyalty_tier', 'lifetime_points', 'tier_updated_at']);
        });

        Schema::dropIfExists('reward_redemptions');
        Schema::dropIfExists('rewards');
    }
};
