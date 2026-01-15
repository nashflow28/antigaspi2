<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create user_devices table for device-based authentication
     * Tracks which devices are authorized for each user
     */
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('device_id', 100)->comment('Unique device identifier from mobile app');
            $table->string('device_name', 255)->nullable()->comment('Human readable device name');
            $table->string('device_model', 100)->nullable()->comment('Device model (e.g., Samsung Galaxy S21)');
            $table->string('device_brand', 100)->nullable()->comment('Device brand');
            $table->enum('device_type', ['android', 'ios', 'web'])->default('android');
            $table->string('os_version', 50)->nullable()->comment('OS version');
            $table->string('app_version', 20)->nullable()->comment('App version');
            $table->string('push_token', 255)->nullable()->comment('FCM push notification token');
            $table->timestamp('otp_verified_at')->nullable()->comment('When OTP was last verified for this device');
            $table->timestamp('last_login_at')->nullable()->comment('Last activity on this device');
            $table->boolean('is_active')->default(true)->comment('Whether this device session is active');
            $table->string('ip_address', 45)->nullable()->comment('Last known IP address');
            $table->timestamps();

            // Unique constraint: one device_id per user
            $table->unique(['user_id', 'device_id']);

            // Index for quick lookup
            $table->index(['device_id']);
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
