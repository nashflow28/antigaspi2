<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        // Mettre à jour les données de test pour le Togo

        // Mise à jour des utilisateurs avec des villes du Togo
        DB::table('users')->where('city', 'Abidjan')->update(['city' => 'Lomé']);

        // Mise à jour des adresses dans les merchants
        DB::table('merchants')
            ->where('id', 1)
            ->update([
                'business_name' => 'Boulangerie du Grand Marché',
                'category' => 'Boulangerie',
                'latitude' => 6.1319,
                'longitude' => 1.2228,
            ]);

        DB::table('merchants')
            ->where('id', 2)
            ->update([
                'business_name' => 'Superette Nyékonakpoè',
                'category' => 'Épicerie',
                'latitude' => 6.1677,
                'longitude' => 1.2176,
            ]);

        // Ajouter des merchants togolais supplémentaires si la table a de la place
        if (DB::table('merchants')->count() < 5) {
            // Insérer de nouveaux marchands togolais
            $togoMerchants = [
                [
                    'user_id' => DB::table('users')->where('role', 'merchant')->first()->id ?? 2,
                    'business_name' => 'Marché de Kpalimé',
                    'category' => 'Marché traditionnel',
                    'siret' => 'TG001234567',
                    'latitude' => 6.9000,
                    'longitude' => 0.6333,
                    'opening_hours' => json_encode([
                        'monday' => '05:00-18:00',
                        'tuesday' => '05:00-18:00',
                        'wednesday' => '05:00-18:00',
                        'thursday' => '05:00-18:00',
                        'friday' => '05:00-18:00',
                        'saturday' => '05:00-18:00',
                        'sunday' => '05:00-15:00'
                    ]),
                    'is_verified' => true,
                    'created_at' => now(),
                    'total_sales' => 45000
                ],
                [
                    'user_id' => DB::table('users')->where('role', 'merchant')->skip(1)->first()->id ?? 2,
                    'business_name' => 'Poissonnerie du Port',
                    'category' => 'Poissonnerie',
                    'siret' => 'TG001234568',
                    'latitude' => 6.1286,
                    'longitude' => 1.2216,
                    'opening_hours' => json_encode([
                        'monday' => '04:00-17:00',
                        'tuesday' => '04:00-17:00',
                        'wednesday' => '04:00-17:00',
                        'thursday' => '04:00-17:00',
                        'friday' => '04:00-17:00',
                        'saturday' => '04:00-17:00',
                        'sunday' => 'Fermé'
                    ]),
                    'is_verified' => true,
                    'created_at' => now(),
                    'total_sales' => 67000
                ]
            ];

            foreach ($togoMerchants as $merchant) {
                try {
                    DB::table('merchants')->insert($merchant);
                } catch (\Exception $e) {
                    // Ignorer si erreur (ex: contrainte unique)
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        // Revenir aux données Côte d'Ivoire
        DB::table('users')->where('city', 'Lomé')->update(['city' => 'Abidjan']);

        // Restaurer les coordonnées d'Abidjan
        DB::table('merchants')
            ->where('id', 1)
            ->update([
                'business_name' => 'Boulangerie Martin',
                'latitude' => 5.3474,
                'longitude' => -3.9857,
            ]);

        DB::table('merchants')
            ->where('id', 2)
            ->update([
                'business_name' => 'Superette Bella',
                'latitude' => 5.3097,
                'longitude' => -4.0130,
            ]);
    }
};