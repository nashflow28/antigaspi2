<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('prefers_email_notifications')->default(true);
            $table->boolean('prefers_sms_notifications')->default(false);
            $table->boolean('prefers_push_notifications')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'prefers_email_notifications',
                'prefers_sms_notifications',
                'prefers_push_notifications',
            ]);
        });
    }
};
