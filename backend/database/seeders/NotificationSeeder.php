<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();

        if (! $consumer) {
            return;
        }

        $notifications = [
            [
                'type' => 'reservation',
                'title' => 'Confirmation de réservation',
                'message' => 'Votre panier est confirmé ! Rendez-vous en boutique avant la fermeture.',
                'is_read' => false,
                'sent_via' => 'email',
                'sent_at' => now()->subHour(),
            ],
            [
                'type' => 'loyalty',
                'title' => 'Nouveaux points fidélité',
                'message' => 'Vous venez de gagner 50 points fidélité.',
                'is_read' => false,
                'sent_via' => 'push',
                'sent_at' => now()->subMinutes(30),
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::updateOrCreate(
                [
                    'user_id' => $consumer->id,
                    'title' => $notification['title'],
                ],
                array_merge($notification, [
                    'user_id' => $consumer->id,
                ])
            );
        }
    }
}
