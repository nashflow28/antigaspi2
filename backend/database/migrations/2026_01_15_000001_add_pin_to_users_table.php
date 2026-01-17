<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add PIN fields to users table for device-based authentication
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'pin_hash')) {
                $table->string('pin_hash', 255)->nullable()->after('password');
            }
            if (! Schema::hasColumn('users', 'pin_set_at')) {
                $table->timestamp('pin_set_at')->nullable()->after('pin_hash');
            }
            if (! Schema::hasColumn('users', 'current_device_id')) {
                $table->string('current_device_id', 100)->nullable()->after('pin_set_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['pin_hash', 'pin_set_at', 'current_device_id']);
        });
    }
};
