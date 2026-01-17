<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Default PIN for test users (hashed)
     * PIN: 1234
     */
    private function getDefaultPin(): string
    {
        return Hash::make('1234');
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin user (phone: +22891000001, PIN: 1234)
        User::updateOrCreate(
            ['email' => 'admin@antigaspi.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'System',
                'name' => 'Admin System',
                'password' => Hash::make('password'),
                'phone' => '22891000001', // Togo format without +
                'role' => 'admin',
                'city' => 'Lomé',
                'address' => '1 Boulevard du 13 Janvier, Lomé',
                'is_active' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(), // Phone verified for new auth flow
                'pin' => $this->getDefaultPin(), // PIN: 1234
            ]
        );

        // Merchant user (phone: +22890123456, PIN: 1234)
        $merchantUser = User::updateOrCreate(
            ['email' => 'boulangerie.martin@email.com'],
            [
                'first_name' => 'Martin',
                'last_name' => 'Boulanger',
                'name' => 'Martin Boulanger',
                'password' => Hash::make('password'),
                'phone' => '22890123456', // Togo format without +
                'role' => 'merchant',
                'city' => 'Lomé',
                'address' => '15 Boulevard du 13 Janvier, Lomé',
                'is_active' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(), // Phone verified for new auth flow
                'pin' => $this->getDefaultPin(), // PIN: 1234
            ]
        );

        Merchant::updateOrCreate(
            ['user_id' => $merchantUser->id],
            [
                'business_name' => 'Boulangerie du Centre',
                'business_type' => 'bakery',
                'siret' => '12345678901234',
                'latitude' => 6.1319, // Lomé coordinates
                'longitude' => 1.2228,
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

        // Consumer user (phone: +22890654321, PIN: 1234)
        User::updateOrCreate(
            ['email' => 'jean.dupont@email.com'],
            [
                'first_name' => 'Jean',
                'last_name' => 'Dupont',
                'name' => 'Jean Dupont',
                'password' => Hash::make('password'),
                'phone' => '22890654321', // Togo format without +
                'role' => 'consumer',
                'city' => 'Lomé',
                'address' => '25 Rue de la Paix, Lomé',
                'is_active' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(), // Phone verified for new auth flow
                'pin' => $this->getDefaultPin(), // PIN: 1234
            ]
        );
    }
}
