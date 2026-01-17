<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasColumn('reservations', 'delivery_type')) {
                $table->enum('delivery_type', ['pickup', 'delivery'])->default('pickup')->after('status');
            }
            if (! Schema::hasColumn('reservations', 'delivery_address')) {
                $table->text('delivery_address')->nullable()->after('delivery_type');
            }
            if (! Schema::hasColumn('reservations', 'delivery_latitude')) {
                $table->decimal('delivery_latitude', 10, 8)->nullable()->after('delivery_address');
            }
            if (! Schema::hasColumn('reservations', 'delivery_longitude')) {
                $table->decimal('delivery_longitude', 11, 8)->nullable()->after('delivery_latitude');
            }
            if (! Schema::hasColumn('reservations', 'delivery_fee')) {
                $table->decimal('delivery_fee', 10, 2)->default(0)->after('delivery_longitude');
            }
            if (! Schema::hasColumn('reservations', 'delivery_instructions')) {
                $table->text('delivery_instructions')->nullable()->after('delivery_fee');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $columns = ['delivery_type', 'delivery_address', 'delivery_latitude', 'delivery_longitude', 'delivery_fee', 'delivery_instructions'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('reservations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
