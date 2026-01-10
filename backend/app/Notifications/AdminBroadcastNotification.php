<?php

namespace App\Notifications;

use App\Notifications\Channels\DatabaseRecordChannel;
use App\Notifications\Channels\PushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class AdminBroadcastNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, string>  $channels
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly array $channels = ['database'],
        private readonly ?string $actionUrl = null,
        private readonly array $payload = []
    ) {}

    public function via(object $notifiable): array
    {
        $channels = [];

        if (in_array('database', $this->channels, true)) {
            $channels[] = DatabaseRecordChannel::class;
        }

        if (
            in_array('mail', $this->channels, true)
            && method_exists($notifiable, 'prefersEmailNotifications')
            && $notifiable->prefersEmailNotifications()
        ) {
            $channels[] = 'mail';
        }

        if (
            in_array('sms', $this->channels, true)
            && method_exists($notifiable, 'prefersSmsNotifications')
            && $notifiable->prefersSmsNotifications()
            && ! empty($notifiable->phone)
        ) {
            $channels[] = 'vonage';
        }

        if (
            in_array('push', $this->channels, true)
            && method_exists($notifiable, 'prefersPushNotifications')
            && $notifiable->prefersPushNotifications()
        ) {
            $channels[] = PushChannel::class;
        }

        if (empty($channels)) {
            $channels[] = DatabaseRecordChannel::class;
        }

        return array_values(array_unique($channels));
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Bonjour '.($notifiable->first_name ?? ''))
            ->line($this->message);

        if ($this->actionUrl) {
            $mail->action('Voir plus', $this->actionUrl);
        }

        return $mail->line('Merci d\'utiliser Antigaspi.');
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $content = $this->title.': '.$this->message;

        if (mb_strlen($content) > 160) {
            $content = mb_substr($content, 0, 157).'...';
        }

        return (new VonageMessage)->content($content);
    }

    public function toPushPayload(object $notifiable): array
    {
        $payload = [
            'title' => $this->title,
            'body' => $this->message,
            'data' => array_merge(['type' => 'admin_broadcast'], $this->payload),
        ];

        if ($this->actionUrl) {
            $payload['data']['action_url'] = $this->actionUrl;
        }

        return $payload;
    }

    public function toDatabaseRecord(object $notifiable): array
    {
        $channels = array_values(array_intersect(['mail', 'sms', 'push'], $this->channels));

        return [
            'type' => 'admin_broadcast',
            'title' => $this->title,
            'message' => $this->message,
            'sent_via' => empty($channels) ? 'database' : implode(',', $channels),
            'sent_at' => now(),
        ];
    }
}
