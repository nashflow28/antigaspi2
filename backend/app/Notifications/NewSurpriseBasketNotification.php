<?php

namespace App\Notifications;

use App\Models\Product;
use App\Notifications\Channels\DatabaseRecordChannel;
use App\Notifications\Channels\PushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class NewSurpriseBasketNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Product $basket) {}

    public function via(object $notifiable): array
    {
        $channels = [DatabaseRecordChannel::class];

        if (method_exists($notifiable, 'prefersEmailNotifications') && $notifiable->prefersEmailNotifications()) {
            $channels[] = 'mail';
        }

        if (method_exists($notifiable, 'prefersSmsNotifications') && $notifiable->prefersSmsNotifications() && ! empty($notifiable->phone)) {
            $channels[] = 'vonage';
        }

        if (method_exists($notifiable, 'prefersPushNotifications') && $notifiable->prefersPushNotifications()) {
            $channels[] = PushChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nouveau panier surprise disponible !')
            ->greeting('Bonjour '.$notifiable->first_name)
            ->line('Un nouveau panier surprise vient d\'être publié par '.$this->basket->merchant?->business_name.'.')
            ->line('Panier : '.$this->basket->name)
            ->line('Prix : '.number_format($this->basket->discounted_price, 2).' FCFA')
            ->action('Réserver maintenant', url('/surprise-baskets/'.$this->basket->id))
            ->line('Dépêchez-vous avant qu\'il ne disparaisse !');
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $content = sprintf(
            'Antigaspi: Nouveau panier "%s" à %s FCFA chez %s. Réservez vite !',
            $this->basket->name,
            number_format($this->basket->discounted_price, 0),
            $this->basket->merchant?->business_name
        );

        return (new VonageMessage)->content($content);
    }

    public function toPushPayload(object $notifiable): array
    {
        return [
            'title' => 'Nouveau panier surprise',
            'body' => sprintf(
                '%s est disponible pour %s FCFA.',
                $this->basket->name,
                number_format($this->basket->discounted_price, 0)
            ),
            'data' => [
                'basket_id' => $this->basket->id,
                'type' => 'surprise_basket',
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
            'type' => 'surprise_basket',
            'title' => 'Nouveau panier surprise',
            'message' => sprintf(
                '%s chez %s est disponible pour %s FCFA.',
                $this->basket->name,
                $this->basket->merchant?->business_name,
                number_format($this->basket->discounted_price, 0)
            ),
            'sent_via' => implode(',', array_keys($channels)),
            'sent_at' => now(),
        ];
    }
}
