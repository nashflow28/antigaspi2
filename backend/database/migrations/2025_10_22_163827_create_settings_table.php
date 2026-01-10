<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->enum('type', ['string', 'integer', 'boolean', 'decimal', 'json'])->default('string');
            $table->string('group')->default('general');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('group');
            $table->index('key');
        });

        // Seed default settings
        DB::table('settings')->insert([
            // General Settings
            [
                'key' => 'site_name',
                'value' => 'Antigaspi',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Nom de la plateforme',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'site_description',
                'value' => 'Plateforme Anti-Gaspillage Alimentaire pour l\'Afrique de l\'Ouest',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Description courte de la plateforme',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'contact_email',
                'value' => 'contact@antigaspi.com',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Email de contact principal',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'support_phone',
                'value' => '+228 90 00 00 00',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Numéro de téléphone support',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Commission Settings
            [
                'key' => 'commission_rate',
                'value' => '10',
                'type' => 'decimal',
                'group' => 'commission',
                'description' => 'Taux de commission plateforme (%)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'min_commission_amount',
                'value' => '50',
                'type' => 'integer',
                'group' => 'commission',
                'description' => 'Commission minimum en XOF',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'currency',
                'value' => 'XOF',
                'type' => 'string',
                'group' => 'commission',
                'description' => 'Devise de la plateforme',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Reservation Settings
            [
                'key' => 'max_reservation_duration',
                'value' => '24',
                'type' => 'integer',
                'group' => 'reservation',
                'description' => 'Durée maximale d\'une réservation (heures)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'auto_cancel_pending_after',
                'value' => '2',
                'type' => 'integer',
                'group' => 'reservation',
                'description' => 'Annulation automatique après X heures',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Notification Settings
            [
                'key' => 'notifications_enabled',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Activer les notifications système',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'email_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Activer les notifications par email',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'sms_notifications',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Activer les notifications par SMS',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Maintenance Settings
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'maintenance',
                'description' => 'Activer le mode maintenance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'maintenance_message',
                'value' => 'La plateforme est en maintenance. Nous serons de retour bientôt.',
                'type' => 'string',
                'group' => 'maintenance',
                'description' => 'Message affiché pendant la maintenance',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // System Limits
            [
                'key' => 'max_upload_size_mb',
                'value' => '5',
                'type' => 'integer',
                'group' => 'limits',
                'description' => 'Taille maximale des fichiers (MB)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_products_per_merchant',
                'value' => '100',
                'type' => 'integer',
                'group' => 'limits',
                'description' => 'Nombre maximum de produits par commerçant',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
