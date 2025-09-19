<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CategorySeeder::class,
            MerchantSeeder::class,
            ProductSeeder::class,
            ReservationSeeder::class,
            ReviewSeeder::class,
            LoyaltyPointSeeder::class,
            NotificationSeeder::class,
            PaymentSeeder::class,
            AnalyticsDailySeeder::class,
        ]);
    }
}
