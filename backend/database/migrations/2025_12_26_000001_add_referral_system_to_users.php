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
        // Check which columns need to be added
        $addReferralCode = ! Schema::hasColumn('users', 'referral_code');
        $addReferredBy = ! Schema::hasColumn('users', 'referred_by');
        $addReferralBonus = ! Schema::hasColumn('users', 'referral_bonus_awarded');

        if ($addReferralCode || $addReferredBy || $addReferralBonus) {
            Schema::table('users', function (Blueprint $table) use ($addReferralCode, $addReferredBy, $addReferralBonus) {
                // Unique referral code for each user
                if ($addReferralCode) {
                    $table->string('referral_code', 10)->unique()->nullable();
                }
                // Who referred this user (nullable = organic signup)
                if ($addReferredBy) {
                    $table->unsignedBigInteger('referred_by')->nullable();
                }
                // Track if referral bonus was already awarded
                if ($addReferralBonus) {
                    $table->boolean('referral_bonus_awarded')->default(false);
                }
            });
        }

        // Add foreign key constraint only for MySQL (not SQLite)
        if ($addReferredBy && config('database.default') !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('referred_by')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only try to drop foreign key for non-SQLite databases
        if (config('database.default') !== 'sqlite' && Schema::hasColumn('users', 'referred_by')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['referred_by']);
            });
        }

        $columns = [];
        if (Schema::hasColumn('users', 'referral_code')) {
            $columns[] = 'referral_code';
        }
        if (Schema::hasColumn('users', 'referred_by')) {
            $columns[] = 'referred_by';
        }
        if (Schema::hasColumn('users', 'referral_bonus_awarded')) {
            $columns[] = 'referral_bonus_awarded';
        }

        if (! empty($columns)) {
            Schema::table('users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
