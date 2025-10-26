<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop foreign key constraint first (needed before dropping indexes)
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign('payments_reservation_id_foreign');
        });

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'reservation_id') && Schema::hasColumn('payments', 'status')) {
                $table->dropIndex('payments_reservation_id_status_index');
            }
            if (Schema::hasColumn('payments', 'reference')) {
                $table->dropIndex('payments_reference_index');
            }
            if (Schema::hasColumn('payments', 'transaction_id')) {
                $table->dropIndex('payments_transaction_id_index');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'status', 'provider_response']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('payment_method', PaymentMethod::values())->nullable()->after('currency');
            $table->enum('status', PaymentStatus::values())->default(PaymentStatus::PENDING->value)->after('transaction_id');
            $table->string('provider')->nullable()->after('status');
            $table->string('checkout_url')->nullable()->after('provider');
            $table->string('customer_phone', 32)->nullable()->after('checkout_url');
            $table->string('reference')->nullable()->after('customer_phone');
            $table->json('payload')->nullable()->after('reference');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['reservation_id', 'status']);
            $table->index('reference');
            $table->index('transaction_id');
        });

        // Re-create foreign key constraint
        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
        });

        // Note: payment_status and latest_payment_id are already added to reservations
        // in migration 2025_10_16_091500_add_core_fields_to_reservations_table.php
    }

    public function down(): void
    {
        // Drop foreign key constraint first
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign('payments_reservation_id_foreign');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_reservation_id_status_index');
            $table->dropIndex('payments_reference_index');
            $table->dropIndex('payments_transaction_id_index');
            $table->dropColumn(['payment_method', 'status', 'provider', 'checkout_url', 'customer_phone', 'reference', 'payload']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('currency');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending')->after('transaction_id');
            $table->json('provider_response')->nullable()->after('status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['reservation_id', 'status']);
            $table->index('transaction_id');
        });

        // Re-create foreign key constraint
        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
        });
    }
};
