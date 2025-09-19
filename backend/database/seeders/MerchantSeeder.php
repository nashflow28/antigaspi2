<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Seeder;

class MerchantSeeder extends Seeder
{
    public function run(): void
    {
        $merchantUser = User::where('email', 'merchant@antigaspi.com')->first();

        if (! $merchantUser) {
            return;
        }

        Merchant::updateOrCreate(
            ['user_id' => $merchantUser->id],
            [
                'business_name' => 'Au Bon Panier',
                'business_type' => 'Epicerie fine',
                'siret' => '12345678900011',
                'latitude' => 45.764043,
                'longitude' => 4.835659,
                'opening_hours' => [
                    'monday' => ['08:00', '19:00'],
                    'tuesday' => ['08:00', '19:00'],
                    'wednesday' => ['08:00', '19:00'],
                    'thursday' => ['08:00', '19:00'],
                    'friday' => ['08:00', '19:30'],
                    'saturday' => ['09:00', '19:30'],
                ],
                'is_verified' => true,
                'verification_date' => now()->subDays(7),
                'total_sales' => 15230.45,
            ]
        );
    }
}
