<?php

namespace App\Notifications\Channels;

use App\Models\Notification as NotificationModel;
use Illuminate\Notifications\Notification;

class DatabaseRecordChannel
{
    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toDatabaseRecord')) {
            return;
        }

        $data = $notification->toDatabaseRecord($notifiable);

        if (empty($data)) {
            return;
        }

        NotificationModel::create([
            'user_id' => $notifiable->id,
            'type' => $data['type'] ?? null,
            'title' => $data['title'] ?? '',
            'message' => $data['message'] ?? '',
            'sent_via' => $data['sent_via'] ?? null,
            'sent_at' => $data['sent_at'] ?? now(),
        ]);
    }
}
