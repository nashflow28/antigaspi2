<?php

namespace App\Services;

use App\Events\NewNotification;
use App\Events\ReservationStatusChanged;
use App\Models\Notification;
use App\Models\Reservation;
use Illuminate\Support\Facades\Log;

class BroadcastService
{
    /**
     * Broadcast a new notification
     */
    public function broadcastNotification(Notification $notification): void
    {
        try {
            if (config('broadcasting.default') !== 'null') {
                broadcast(new NewNotification($notification));
                Log::info('Notification broadcasted', ['notification_id' => $notification->id]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast notification', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Broadcast reservation status change
     */
    public function broadcastReservationStatusChange(
        Reservation $reservation,
        string $oldStatus,
        string $newStatus
    ): void {
        try {
            if (config('broadcasting.default') !== 'null') {
                broadcast(new ReservationStatusChanged($reservation, $oldStatus, $newStatus));
                Log::info('Reservation status change broadcasted', [
                    'reservation_id' => $reservation->id,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast reservation status change', [
                'reservation_id' => $reservation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send a custom event to a user
     */
    public function sendToUser(int $userId, string $event, array $data): void
    {
        try {
            if (config('broadcasting.default') !== 'null') {
                // Use Pusher directly for custom events
                $pusher = new \Pusher\Pusher(
                    config('broadcasting.connections.pusher.key'),
                    config('broadcasting.connections.pusher.secret'),
                    config('broadcasting.connections.pusher.app_id'),
                    config('broadcasting.connections.pusher.options')
                );

                $pusher->trigger('private-user.' . $userId, $event, $data);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send custom event to user', [
                'user_id' => $userId,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if broadcasting is enabled
     */
    public function isEnabled(): bool
    {
        return config('broadcasting.default') !== 'null' &&
               !empty(config('broadcasting.connections.pusher.key'));
    }
}
