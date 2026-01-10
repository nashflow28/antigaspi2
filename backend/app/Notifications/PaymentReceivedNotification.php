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

/**
 * Notification sent to merchants when they receive a payment
 */
class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Reservation $reservation,
        private readonly Payment $payment
    ) {}

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
        $productName = $this->reservation->product?->name ?? 'Produit';
        $customerName = $this->getCustomerName();
        $amount = number_format($this->payment->amount, 0, ',', ' ');

        return (new MailMessage)
            ->subject('Nouveau paiement reçu - Geladal')
            ->greeting('Bonjour '.($notifiable->first_name ?? 'Commerçant'))
            ->line('Vous avez reçu un nouveau paiement !')
            ->line('Montant : '.$amount.' XOF')
            ->line('Client : '.$customerName)
            ->line('Réservation : #'.$this->reservation->reservation_code)
            ->line('Produit : '.$productName)
            ->line('Méthode : '.$this->getPaymentMethodLabel())
            ->action('Voir mes réservations', url('/merchant/reservations'))
            ->line('N\'oubliez pas de préparer la commande pour le retrait.');
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $amount = number_format($this->payment->amount, 0, ',', ' ');

        $content = sprintf(
            'Geladal: Paiement de %s XOF reçu pour #%s. Préparez la commande!',
            $amount,
            $this->reservation->reservation_code
        );

        return (new VonageMessage)->content($content);
    }

    public function toPushPayload(object $notifiable): array
    {
        $amount = number_format($this->payment->amount, 0, ',', ' ');
        $customerName = $this->getCustomerName();

        return [
            'title' => 'Paiement reçu ! 💰',
            'body' => sprintf(
                '%s XOF de %s pour la réservation #%s',
                $amount,
                $customerName,
                $this->reservation->reservation_code
            ),
            'data' => [
                'type' => 'payment_received',
                'reservation_id' => $this->reservation->id,
                'payment_id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'customer_name' => $customerName,
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
        $customerName = $this->getCustomerName();

        return [
            'type' => 'payment_received',
            'title' => 'Paiement reçu',
            'message' => sprintf(
                'Paiement de %s XOF reçu de %s pour la réservation #%s.',
                $amount,
                $customerName,
                $this->reservation->reservation_code
            ),
            'sent_via' => implode(',', array_keys($channels)),
            'sent_at' => now(),
        ];
    }

    private function getCustomerName(): string
    {
        $user = $this->reservation->user;

        if (! $user) {
            return 'Client';
        }

        $name = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));

        return $name ?: ($user->name ?? 'Client');
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
