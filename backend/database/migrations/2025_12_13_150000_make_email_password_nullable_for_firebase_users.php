<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Make email and password nullable to support Firebase phone-only authentication
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Email becomes optional for phone-authenticated users
            $table->string('email')->nullable()->change();
            // Password becomes optional for Firebase-authenticated users
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
        });
    }
};
