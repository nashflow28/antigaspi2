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
        Schema::table('reservations', function (Blueprint $table) {
            // Ajouter order_id après id (nullable pour compatibilité avec réservations existantes)
            $table->foreignId('order_id')
                ->nullable()
                ->after('id')
                ->constrained('orders')
                ->onDelete('cascade')
                ->comment('Regroupe plusieurs réservations en une commande');

            // Index pour améliorer les performances des requêtes
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Supprimer la contrainte de clé étrangère et la colonne
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
        });
    }
};
