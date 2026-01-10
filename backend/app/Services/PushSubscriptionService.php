<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
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
                'driver' => PushSubscription::DRIVER_WEB,
                'last_used_at' => now(),
            ]
        );
    }

    public function registerExpoToken(?User $user, array $data): PushSubscription
    {
        $attributes = [
            'driver' => PushSubscription::DRIVER_EXPO,
            'expo_token' => $data['token'],
            'endpoint' => $data['token'],
            'device_platform' => $data['platform'] ?? null,
            'device_model' => $data['device_model'] ?? null,
            'app_version' => $data['app_version'] ?? null,
            'project_id' => $data['project_id'] ?? null,
            'last_used_at' => now(),
        ];

        if ($user) {
            $attributes['user_id'] = $user->id;
        }

        return PushSubscription::updateOrCreate(
            [
                'expo_token' => $data['token'],
            ],
            $attributes
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

        $webSubscriptions = $subscriptions->where('driver', PushSubscription::DRIVER_WEB);
        $expoSubscriptions = $subscriptions->where('driver', PushSubscription::DRIVER_EXPO);

        if ($webSubscriptions->isNotEmpty()) {
            $this->sendWebPushNotifications($webSubscriptions, $payload);
        }

        if ($expoSubscriptions->isNotEmpty()) {
            $this->sendExpoPushNotifications($expoSubscriptions, $payload);
        }
    }

    protected function makeClient(): ?WebPush
    {
        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject', 'mailto:admin@example.com');

        if (! $publicKey || ! $privateKey) {
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

    protected function sendWebPushNotifications(Collection $subscriptions, array $payload): void
    {
        $webPush = $this->makeClient();

        if (! $webPush) {
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
            if ($report->isSuccess()) {
                continue;
            }

            $endpoint = $report->getRequest()->getUri()->__toString();
            Log::warning('Failed to deliver web push notification', [
                'endpoint' => $endpoint,
                'reason' => $report->getReason(),
            ]);

            PushSubscription::where('endpoint', $endpoint)
                ->where('driver', PushSubscription::DRIVER_WEB)
                ->delete();
        }
    }

    protected function sendExpoPushNotifications(Collection $subscriptions, array $payload): void
    {
        $orderedSubscriptions = $subscriptions->values();

        $messages = $orderedSubscriptions->map(function (PushSubscription $subscription) use ($payload) {
            $message = [
                'to' => $subscription->expo_token,
                'title' => $payload['title'] ?? config('app.name'),
                'body' => $payload['body'] ?? '',
                'data' => $payload['data'] ?? [],
            ];

            if (! empty($payload['sound'])) {
                $message['sound'] = $payload['sound'];
            }

            if (! empty($payload['badge'])) {
                $message['badge'] = $payload['badge'];
            }

            if (! empty($payload['channelId'])) {
                $message['channelId'] = $payload['channelId'];
            }

            return $message;
        });

        foreach ($messages->chunk(100) as $index => $chunk) {
            $chunkSubscriptions = $orderedSubscriptions->slice($index * 100, 100)->values();

            $http = Http::acceptJson()->timeout(10);

            if ($accessToken = config('services.expo.access_token')) {
                $http = $http->withToken($accessToken);
            }

            $response = $http->post('https://exp.host/--/api/v2/push/send', $chunk->all());

            if ($response->failed()) {
                Log::warning('Expo push request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                continue;
            }

            $data = $response->json('data', []);

            foreach ($data as $key => $ticket) {
                $subscription = $chunkSubscriptions->get($key);

                if (! $subscription) {
                    continue;
                }

                if (($ticket['status'] ?? null) === 'ok') {
                    $subscription->forceFill(['last_used_at' => now()])->save();

                    continue;
                }

                $error = $ticket['details']['error'] ?? $ticket['message'] ?? 'unknown_error';

                if (in_array($error, ['DeviceNotRegistered', 'InvalidCredentials'], true)) {
                    Log::info('Removing stale Expo push token', [
                        'token' => $subscription->expo_token,
                        'error' => $error,
                    ]);

                    $subscription->delete();
                } else {
                    Log::warning('Expo push delivery failed', [
                        'token' => $subscription->expo_token,
                        'error' => $error,
                        'message' => $ticket['message'] ?? null,
                    ]);
                }
            }
        }
    }
}
