<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@antigaspi.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'System',
                'name' => 'Admin System',
                'password' => Hash::make('admin123'),
                'phone' => '+33100000001',
                'role' => 'admin',
                'city' => 'Paris',
                'address' => '1 Avenue de la République, Paris',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $merchantUser = User::updateOrCreate(
            ['email' => 'merchant@antigaspi.com'],
            [
                'first_name' => 'Marc',
                'last_name' => 'Commerçant',
                'name' => 'Marc Commerçant',
                'password' => Hash::make('merchant123'),
                'phone' => '+33100000002',
                'role' => 'merchant',
                'city' => 'Lyon',
                'address' => '12 Rue des Commerçants, Lyon',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        Merchant::updateOrCreate(
            ['user_id' => $merchantUser->id],
            [
                'business_name' => 'Boulangerie du Centre',
                'business_type' => 'bakery',
                'siret' => '12345678901234',
                'latitude' => 45.764043,
                'longitude' => 4.835659,
                'opening_hours' => [
                    'monday' => ['07:30', '19:00'],
                    'tuesday' => ['07:30', '19:00'],
                    'wednesday' => ['07:30', '19:00'],
                    'thursday' => ['07:30', '19:00'],
                    'friday' => ['07:30', '19:00'],
                    'saturday' => ['08:00', '18:00'],
                ],
                'is_verified' => true,
                'verification_date' => now()->subDays(10),
                'total_sales' => 15000,
            ]
        );

        User::updateOrCreate(
            ['email' => 'consumer@antigaspi.com'],
            [
                'first_name' => 'Claire',
                'last_name' => 'Consommatrice',
                'name' => 'Claire Consommatrice',
                'password' => Hash::make('consumer123'),
                'phone' => '+33100000003',
                'role' => 'consumer',
                'city' => 'Marseille',
                'address' => '5 Rue des Consommateurs, Marseille',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
