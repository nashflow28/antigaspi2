<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\PushSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(private readonly PushSubscriptionService $pushService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Notification::where('user_id', $user->id)
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

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        Gate::authorize('update', $notification);

        $notification->update([
            'is_read' => true,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
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
