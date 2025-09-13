<?php

namespace Database\Seeders;

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
        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@antigaspi.com'],
            [
                'name' => 'Admin System',
                'email' => 'admin@antigaspi.com',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]
        );

        // Create test merchant user
        User::updateOrCreate(
            ['email' => 'merchant@antigaspi.com'],
            [
                'name' => 'Marc Commerçant',
                'email' => 'merchant@antigaspi.com',
                'password' => Hash::make('merchant123'),
                'email_verified_at' => now(),
            ]
        );

        // Create test consumer user
        User::updateOrCreate(
            ['email' => 'consumer@antigaspi.com'],
            [
                'name' => 'Claire Consommatrice',
                'email' => 'consumer@antigaspi.com',
                'password' => Hash::make('consumer123'),
                'email_verified_at' => now(),
            ]
        );
    }
}
