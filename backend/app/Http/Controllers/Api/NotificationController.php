<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification as NotificationModel;
use App\Models\User;
use App\Notifications\AdminBroadcastNotification;
use App\Services\PushSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(private readonly PushSubscriptionService $pushService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = NotificationModel::where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->boolean('unread')) {
            $query->where('is_read', false);
        }

        $notifications = $query->paginate(min($request->integer('per_page', 20) ?: 20, 100));

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead(Request $request, NotificationModel $notification): JsonResponse
    {
        Gate::authorize('update', $notification);

        $notification->update([
            'is_read' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        NotificationModel::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
            ]);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Get unread notification count for badge
     */
    public function getBadgeCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = NotificationModel::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|url',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
            'content_encoding' => 'nullable|string',
        ]);

        $subscription = $this->pushService->subscribe($request->user(), $data);

        return response()->json([
            'success' => true,
            'data' => $subscription,
        ], 201);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', Rule::in(['android', 'ios', 'web', 'unknown'])],
            'device_model' => ['nullable', 'string', 'max:255'],
            'app_version' => ['nullable', 'string', 'max:50'],
            'project_id' => ['nullable', 'string', 'max:255'],
        ]);

        $subscription = $this->pushService->registerExpoToken($request->user(), $data);

        return response()->json([
            'success' => true,
            'data' => $subscription,
        ], 201);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|url',
        ]);

        $removed = $this->pushService->unsubscribe($request->user(), $data['endpoint']);

        return response()->json([
            'success' => $removed,
        ]);
    }

    public function getLegacyPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->normalizeLegacyPreferences(
                $user->notification_settings ?? []
            ),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|boolean',
            'sms' => 'required|boolean',
            'push' => 'required|boolean',
        ]);

        $user = $request->user();
        $user->fill([
            'prefers_email_notifications' => $data['email'],
            'prefers_sms_notifications' => $data['sms'],
            'prefers_push_notifications' => $data['push'],
        ]);
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user->only([
                'prefers_email_notifications',
                'prefers_sms_notifications',
                'prefers_push_notifications',
            ]),
        ]);
    }

    public function updateLegacyPreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'new_products' => ['required', 'boolean'],
            'reservations' => ['required', 'boolean'],
            'promotions' => ['required', 'boolean'],
            'expiring_products' => ['required', 'boolean'],
            'quiet_hours_enabled' => ['required', 'boolean'],
            'quiet_hours_start' => ['required', 'date_format:H:i'],
            'quiet_hours_end' => ['required', 'date_format:H:i'],
        ]);

        $user = $request->user();
        $user->notification_settings = $data;
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $this->normalizeLegacyPreferences($data),
        ]);
    }

    public function broadcast(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs',
            ], 403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:1000'],
            'channels' => ['nullable', 'array'],
            'channels.*' => ['string', Rule::in(['database', 'mail', 'sms', 'push'])],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::in(['consumer', 'merchant', 'admin'])],
            'action_url' => ['nullable', 'url'],
            'payload' => ['nullable', 'array'],
        ]);

        $channels = $data['channels'] ?? ['database', 'push'];
        $channels[] = 'database';
        $channels = array_values(array_unique($channels));

        $roles = array_filter($data['roles'] ?? []);

        $query = User::query()
            ->where('is_active', true);

        if (!empty($roles)) {
            $query->whereIn('role', $roles);
        }

        $recipientCount = 0;

        $query->chunkById(500, function ($users) use (&$recipientCount, $channels, $data) {
            $recipientCount += $users->count();

            NotificationFacade::send(
                $users,
                new AdminBroadcastNotification(
                    $data['title'],
                    $data['message'],
                    $channels,
                    $data['action_url'] ?? null,
                    $data['payload'] ?? []
                )
            );
        });

        return response()->json([
            'success' => true,
            'data' => [
                'recipient_count' => $recipientCount,
                'channels' => $channels,
            ],
        ], 202);
    }

    private function normalizeLegacyPreferences(array $settings): array
    {
        $defaults = [
            'enabled' => true,
            'new_products' => true,
            'reservations' => true,
            'promotions' => true,
            'expiring_products' => true,
            'quiet_hours_enabled' => false,
            'quiet_hours_start' => '22:00',
            'quiet_hours_end' => '08:00',
        ];

        $normalized = array_merge($defaults, $settings);

        $normalized['enabled'] = (bool) $normalized['enabled'];
        $normalized['new_products'] = (bool) $normalized['new_products'];
        $normalized['reservations'] = (bool) $normalized['reservations'];
        $normalized['promotions'] = (bool) $normalized['promotions'];
        $normalized['expiring_products'] = (bool) $normalized['expiring_products'];
        $normalized['quiet_hours_enabled'] = (bool) $normalized['quiet_hours_enabled'];

        foreach (['quiet_hours_start', 'quiet_hours_end'] as $key) {
            if (!is_string($normalized[$key]) || !preg_match('/^\d{2}:\d{2}$/', $normalized[$key])) {
                $normalized[$key] = $defaults[$key];
            }
        }

        return $normalized;
    }
}
