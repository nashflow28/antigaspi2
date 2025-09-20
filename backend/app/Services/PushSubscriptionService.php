<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushSubscriptionService
{
    public function subscribe(User $user, array $data): PushSubscription
    {
        return PushSubscription::updateOrCreate(
            [
                'endpoint' => $data['endpoint'],
            ],
            [
                'user_id' => $user->id,
                'public_key' => $data['public_key'],
                'auth_token' => $data['auth_token'],
                'content_encoding' => $data['content_encoding'] ?? null,
            ]
        );
    }

    public function unsubscribe(User $user, string $endpoint): bool
    {
        return (bool) PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->delete();
    }

    public function send(User $user, array $payload): void
    {
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = $this->makeClient();

        if (!$webPush) {
            Log::warning('Push notification skipped: VAPID credentials missing');
            return;
        }

        $jsonPayload = json_encode($payload);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding ?? 'aes128gcm',
                ]),
                $jsonPayload
            );
        }

        foreach ($webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                Log::warning('Failed to deliver push notification', [
                    'endpoint' => $endpoint,
                    'reason' => $report->getReason(),
                ]);

                PushSubscription::where('endpoint', $endpoint)->delete();
            }
        }
    }

    protected function makeClient(): ?WebPush
    {
        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject', 'mailto:admin@example.com');

        if (!$publicKey || !$privateKey) {
            return null;
        }

        return new WebPush([
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ], [
            'TTL' => config('services.webpush.ttl', 900),
        ]);
    }
}
