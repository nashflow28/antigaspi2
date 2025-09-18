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
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token', 255)->unique();
            $table->string('jti', 255)->index(); // JWT ID pour lier access et refresh token
            $table->timestamp('expires_at');
            $table->boolean('revoked')->default(false);
            $table->string('device_fingerprint', 255)->nullable(); // Empreinte appareil
            $table->string('ip_address', 45)->nullable(); // Support IPv6
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            // Index pour les performances
            $table->index(['user_id', 'revoked']);
            $table->index(['token', 'revoked']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
