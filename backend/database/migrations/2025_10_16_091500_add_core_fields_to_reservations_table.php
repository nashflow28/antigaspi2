<?php

use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds core business logic fields to reservations table that are required
     * by the Reservation model for basic functionality (without full Phase 8 features).
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Payment status tracking (required for business logic)
            $table->enum('payment_status', PaymentStatus::values())
                ->default(PaymentStatus::PENDING->value)
                ->after('status');

            // Lifecycle timestamps (required for confirm, complete, cancel methods)
            $table->timestamp('ready_at')->nullable()->after('confirmed_at');
            $table->timestamp('completed_at')->nullable()->after('ready_at');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');

            // Pickup scheduling fields (required for merchant workflow)
            $table->date('pickup_date')->nullable()->after('cancelled_at');
            $table->time('pickup_time')->nullable()->after('pickup_date');

            // Merchant communication field
            $table->text('merchant_notes')->nullable()->after('notes');

            // Payment reference (nullable for on-site payments)
            // Note: Does NOT create payments table or foreign key constraint
            // to avoid Phase 8 dependencies
            $table->unsignedBigInteger('latest_payment_id')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'latest_payment_id',
                'ready_at',
                'completed_at',
                'cancelled_at',
                'pickup_date',
                'pickup_time',
                'merchant_notes',
            ]);
        });
    }
};
