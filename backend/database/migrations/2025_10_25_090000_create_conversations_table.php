<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('archived_by_consumer')->default(false);
            $table->boolean('archived_by_merchant')->default(false);
            $table->timestamp('last_message_at')->nullable()->index();
            $table->string('last_message_preview')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['consumer_id', 'merchant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
