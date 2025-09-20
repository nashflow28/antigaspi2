<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Notifications\Channels\DatabaseRecordChannel;
use App\Notifications\Channels\PushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class ReservationStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Reservation $reservation)
    {
    }

    public function via(object $notifiable): array
    {
        $channels = [DatabaseRecordChannel::class];

        if (method_exists($notifiable, 'prefersEmailNotifications') && $notifiable->prefersEmailNotifications()) {
            $channels[] = 'mail';
        }

        if (method_exists($notifiable, 'prefersSmsNotifications') && $notifiable->prefersSmsNotifications() && !empty($notifiable->phone)) {
            $channels[] = 'vonage';
        }

        if (method_exists($notifiable, 'prefersPushNotifications') && $notifiable->prefersPushNotifications()) {
            $channels[] = PushChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Mise à jour de votre réservation')
            ->greeting('Bonjour ' . $notifiable->first_name)
            ->line('Le statut de votre réservation #' . $this->reservation->reservation_code . ' a été mis à jour.')
            ->line('Nouveau statut : ' . ucfirst($this->reservation->status))
            ->action('Voir ma réservation', url('/reservations/' . $this->reservation->id))
            ->line('Merci d\'utiliser Antigaspi !');
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $content = sprintf(
            'Antigaspi: Votre réservation #%s est maintenant %s.',
            $this->reservation->reservation_code,
            $this->reservation->status
        );

        return (new VonageMessage())->content($content);
    }

    public function toPushPayload(object $notifiable): array
    {
        return [
            'title' => 'Statut de réservation',
            'body' => sprintf(
                'Votre réservation %s est %s.',
                $this->reservation->reservation_code,
                $this->reservation->status
            ),
            'data' => [
                'reservation_id' => $this->reservation->id,
                'status' => $this->reservation->status,
            ],
        ];
    }

    public function toDatabaseRecord(object $notifiable): array
    {
        $channels = array_filter([
            'mail' => in_array('mail', $this->via($notifiable)),
            'sms' => in_array('vonage', $this->via($notifiable)),
            'push' => in_array(PushChannel::class, $this->via($notifiable)),
        ]);

        return [
            'type' => 'reservation_status',
            'title' => 'Mise à jour de réservation',
            'message' => sprintf(
                'Votre réservation %s est désormais %s.',
                $this->reservation->reservation_code,
                $this->reservation->status
            ),
            'sent_via' => implode(',', array_keys($channels)),
            'sent_at' => now(),
        ];
    }
}
