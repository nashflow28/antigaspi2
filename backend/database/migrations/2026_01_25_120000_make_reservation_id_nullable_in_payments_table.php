<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration makes reservation_id nullable to support wallet recharges
     * which don't have an associated reservation.
     * It also adds customer_email field for wallet recharges.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['reservation_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            // Make the column nullable
            $table->unsignedBigInteger('reservation_id')->nullable()->change();

            // Add customer_email column for wallet recharges
            if (! Schema::hasColumn('payments', 'customer_email')) {
                $table->string('customer_email')->nullable()->after('customer_phone');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            // Re-add the foreign key with nullable support
            $table->foreign('reservation_id')
                ->references('id')
                ->on('reservations')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('reservation_id')->nullable(false)->change();

            if (Schema::hasColumn('payments', 'customer_email')) {
                $table->dropColumn('customer_email');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('reservation_id')
                ->references('id')
                ->on('reservations')
                ->cascadeOnDelete();
        });
    }
};
