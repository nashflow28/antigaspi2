<?php

namespace Database\Seeders;

use App\Models\LoyaltyPoint;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;

class LoyaltyPointSeeder extends Seeder
{
    public function run(): void
    {
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();
        $reservation = Reservation::where('reservation_code', 'RES000001')->first();

        if (! $consumer || ! $reservation) {
            return;
        }

        LoyaltyPoint::updateOrCreate(
            [
                'user_id' => $consumer->id,
                'reference_id' => $reservation->id,
                'earned_from' => 'reservation',
            ],
            [
                'points' => 50,
                'description' => 'Points fidélité pour réservation confirmée.',
                'expires_at' => now()->addMonths(6),
            ]
        );
    }
}
