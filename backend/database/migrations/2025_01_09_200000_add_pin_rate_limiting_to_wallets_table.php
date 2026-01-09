<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * SEC-002 FIX: Add rate limiting columns for PIN attempts
     */
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->unsignedTinyInteger('pin_attempts')->default(0)->after('pin_hash');
            $table->timestamp('pin_locked_until')->nullable()->after('pin_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn(['pin_attempts', 'pin_locked_until']);
        });
    }
};
