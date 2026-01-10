<?php

namespace App\Notifications\Channels;

use App\Services\PushSubscriptionService;
use Illuminate\Notifications\Notification;

class PushChannel
{
    public function __construct(private readonly PushSubscriptionService $pushService) {}

    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toPushPayload')) {
            return;
        }

        $payload = $notification->toPushPayload($notifiable);

        if (empty($payload)) {
            return;
        }

        $this->pushService->send($notifiable, $payload);
    }
}
