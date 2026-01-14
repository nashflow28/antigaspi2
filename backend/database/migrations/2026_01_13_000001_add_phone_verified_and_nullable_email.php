<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds phone_verified_at column and makes email nullable
     * to support phone-based registration as primary authentication method.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add phone_verified_at column if it doesn't exist
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            }
        });

        // Make email nullable to support phone-only registration
        // Using raw SQL because Laravel's change() method may not work well with unique constraints
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            // For MySQL
            DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');
        } else {
            // For SQLite and others
            Schema::table('users', function (Blueprint $table) {
                $table->string('email')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $table->dropColumn('phone_verified_at');
            }
        });

        // Note: We don't revert email to NOT NULL as it could break existing data
    }
};
