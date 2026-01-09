<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Models\Reservation;
use App\Notifications\Channels\DatabaseRecordChannel;
use App\Notifications\Channels\PushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Reservation $reservation,
        private readonly Payment $payment
    ) {
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
        $productName = $this->reservation->product?->name ?? 'Produit';
        $amount = number_format($this->payment->amount, 0, ',', ' ');

        return (new MailMessage())
            ->subject('Paiement confirmé - Geladal')
            ->greeting('Bonjour ' . ($notifiable->first_name ?? 'Client'))
            ->line('Votre paiement de ' . $amount . ' XOF a été confirmé avec succès !')
            ->line('Réservation : #' . $this->reservation->reservation_code)
            ->line('Produit : ' . $productName)
            ->line('Méthode : ' . $this->getPaymentMethodLabel())
            ->action('Voir ma réservation', url('/reservations/' . $this->reservation->id))
            ->line('Vous pouvez maintenant récupérer votre commande chez le commerçant.')
            ->line('Merci d\'utiliser Geladal !');
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $amount = number_format($this->payment->amount, 0, ',', ' ');

        $content = sprintf(
            'Geladal: Paiement de %s XOF confirmé pour la réservation #%s. Vous pouvez récupérer votre commande.',
            $amount,
            $this->reservation->reservation_code
        );

        return (new VonageMessage())->content($content);
    }

    public function toPushPayload(object $notifiable): array
    {
        $amount = number_format($this->payment->amount, 0, ',', ' ');

        return [
            'title' => 'Paiement confirmé !',
            'body' => sprintf(
                'Votre paiement de %s XOF pour la réservation #%s a été confirmé.',
                $amount,
                $this->reservation->reservation_code
            ),
            'data' => [
                'type' => 'payment_confirmed',
                'reservation_id' => $this->reservation->id,
                'payment_id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'status' => 'success',
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

        $amount = number_format($this->payment->amount, 0, ',', ' ');

        return [
            'type' => 'payment_confirmed',
            'title' => 'Paiement confirmé',
            'message' => sprintf(
                'Votre paiement de %s XOF pour la réservation #%s a été confirmé avec succès.',
                $amount,
                $this->reservation->reservation_code
            ),
            'sent_via' => implode(',', array_keys($channels)),
            'sent_at' => now(),
        ];
    }

    private function getPaymentMethodLabel(): string
    {
        $method = $this->payment->payment_method;

        if (is_string($method)) {
            return match ($method) {
                'flooz' => 'Flooz (Moov)',
                'tmoney' => 'TMoney',
                'wallet' => 'Portefeuille Geladal',
                'on_site' => 'Sur place',
                default => ucfirst($method),
            };
        }

        return match ($method) {
            \App\Enums\PaymentMethod::FLOOZ => 'Flooz (Moov)',
            \App\Enums\PaymentMethod::TMONEY => 'TMoney',
            \App\Enums\PaymentMethod::WALLET => 'Portefeuille Geladal',
            \App\Enums\PaymentMethod::ON_SITE => 'Sur place',
            default => $method->value ?? 'Mobile Money',
        };
    }
}
