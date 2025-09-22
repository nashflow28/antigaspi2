<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->string('driver')->default('web')->after('user_id');
            $table->string('expo_token')->nullable()->after('auth_token');
            $table->string('device_platform')->nullable()->after('expo_token');
            $table->string('device_model')->nullable()->after('device_platform');
            $table->string('app_version')->nullable()->after('device_model');
            $table->string('project_id')->nullable()->after('app_version');
            $table->timestamp('last_used_at')->nullable()->after('project_id');

            $table->index('driver', 'push_subscriptions_driver_index');
            $table->index('expo_token', 'push_subscriptions_expo_token_index');
        });
    }

    public function down(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->dropIndex('push_subscriptions_driver_index');
            $table->dropIndex('push_subscriptions_expo_token_index');

            $table->dropColumn([
                'driver',
                'expo_token',
                'device_platform',
                'device_model',
                'app_version',
                'project_id',
                'last_used_at',
            ]);
        });
    }
};
