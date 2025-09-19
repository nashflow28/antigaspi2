<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'email' => 'admin@antigaspi.com',
                'first_name' => 'Admin',
                'last_name' => 'System',
                'role' => 'admin',
                'phone' => '+33 1 23 45 67 89',
                'city' => 'Paris',
                'address' => '10 Rue de la République',
            ],
            [
                'email' => 'merchant@antigaspi.com',
                'first_name' => 'Marc',
                'last_name' => 'Commerçant',
                'role' => 'merchant',
                'phone' => '+33 6 11 22 33 44',
                'city' => 'Lyon',
                'address' => '25 Avenue des Marchands',
            ],
            [
                'email' => 'consumer@antigaspi.com',
                'first_name' => 'Claire',
                'last_name' => 'Consommatrice',
                'role' => 'consumer',
                'phone' => '+33 7 55 66 77 88',
                'city' => 'Marseille',
                'address' => '8 Boulevard des Consommateurs',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password' => Hash::make(match ($userData['role']) {
                        'admin' => 'admin123',
                        'merchant' => 'merchant123',
                        default => 'consumer123',
                    }),
                    'email_verified_at' => now(),
                    'preferences' => $userData['role'] === 'consumer' ? ['newsletter' => true] : null,
                    'is_active' => true,
                ])
            );
        }
    }
}
