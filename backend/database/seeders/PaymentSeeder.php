<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $reservation = Reservation::where('reservation_code', 'RES000001')->first();

        if (! $reservation) {
            return;
        }

        Payment::updateOrCreate(
            ['transaction_id' => 'PAY-RES000001'],
            [
                'reservation_id' => $reservation->id,
                'amount' => $reservation->total_amount,
                'currency' => 'EUR',
                'payment_method' => 'card',
                'status' => 'completed',
                'provider_response' => [
                    'provider' => 'Stripe',
                    'status' => 'succeeded',
                ],
                'paid_at' => now()->subMinutes(15),
            ]
        );
    }
}
