<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // 🐛 BUG FIX #33: Only add pickup fields, payment_status already exists from migration 2025_10_16_091500
            if (!Schema::hasColumn('reservations', 'pickup_date')) {
                $table->date('pickup_date')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('reservations', 'pickup_time')) {
                $table->time('pickup_time')->nullable()->after('pickup_date');
            }
            // Note: payment_status already added by 2025_10_16_091500_add_core_fields_to_reservations_table.php
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Only drop pickup fields, leave payment_status (managed by other migration)
            $table->dropColumn(['pickup_date', 'pickup_time']);
        });
    }
};
