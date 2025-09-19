<?php

namespace Database\Seeders;

use App\Models\AnalyticsDaily;
use App\Models\Merchant;
use Illuminate\Database\Seeder;

class AnalyticsDailySeeder extends Seeder
{
    public function run(): void
    {
        $merchant = Merchant::first();
        $date = now()->toDateString();

        if ($merchant) {
            AnalyticsDaily::updateOrCreate(
                [
                    'date' => $date,
                    'merchant_id' => $merchant->id,
                ],
                [
                    'total_reservations' => 12,
                    'total_revenue' => 320.75,
                    'products_saved_from_waste' => 24,
                    'new_users' => 3,
                ]
            );
        }

        AnalyticsDaily::updateOrCreate(
            [
                'date' => $date,
                'merchant_id' => null,
            ],
            [
                'total_reservations' => 48,
                'total_revenue' => 1285.40,
                'products_saved_from_waste' => 112,
                'new_users' => 25,
            ]
        );
    }
}
