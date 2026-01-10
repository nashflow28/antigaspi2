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
        Schema::table('reviews', function (Blueprint $table) {
            $table->text('merchant_response')->nullable()->after('comment');
            $table->timestamp('merchant_response_at')->nullable()->after('merchant_response');
            $table->timestamp('merchant_response_updated_at')->nullable()->after('merchant_response_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn([
                'merchant_response',
                'merchant_response_at',
                'merchant_response_updated_at',
            ]);
        });
    }
};
