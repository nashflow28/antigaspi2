<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsDaily;
use App\Models\AnalyticsEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function storeEvents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'events' => ['required', 'array', 'min:1'],
            'events.*.name' => ['required', 'string', 'max:255'],
            'events.*.category' => ['required', 'string', 'max:255'],
            'events.*.properties' => ['nullable', 'array'],
            'events.*.timestamp' => ['nullable', 'integer'],
            'events.*.userId' => ['nullable', 'string', 'max:255'],
            'events.*.sessionId' => ['nullable', 'string', 'max:255'],
        ]);

        $stored = 0;
        $user = $request->user();

        foreach ($validated['events'] as $payload) {
            $event = new AnalyticsEvent([
                'user_id' => $user?->id,
                'external_user_id' => $payload['userId'] ?? null,
                'name' => $payload['name'],
                'category' => $payload['category'],
                'properties' => $payload['properties'] ?? [],
                'session_id' => $payload['sessionId'] ?? null,
                'occurred_at' => $this->resolveOccurredAt($payload['timestamp'] ?? null),
            ]);

            $event->save();
            $stored++;

            $this->aggregateEvent($event);
        }

        return response()->json([
            'success' => true,
            'stored' => $stored,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : now()->subDays(7)->startOfDay();
        $endDate = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : now()->endOfDay();
        $merchantId = $request->query('merchant_id');

        $dailyQuery = AnalyticsDaily::query()
            ->whereBetween('date', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
            ->orderBy('date');

        if ($merchantId !== null) {
            $dailyQuery->where('merchant_id', $merchantId);
        } else {
            $dailyQuery->whereNull('merchant_id');
        }

        $daily = $dailyQuery->get();

        $summary = [
            'total_reservations' => (int) $daily->sum('total_reservations'),
            'total_revenue' => (float) $daily->sum('total_revenue'),
            'products_saved_from_waste' => (int) $daily->sum('products_saved_from_waste'),
            'new_users' => (int) $daily->sum('new_users'),
        ];

        $eventsQuery = AnalyticsEvent::query()
            ->whereBetween('occurred_at', [$startDate, $endDate])
            ->orderByDesc('occurred_at');

        if ($merchantId !== null) {
            $eventsQuery->where('properties->merchantId', $merchantId);
        }

        if ($request->user()) {
            $eventsQuery->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhere('external_user_id', (string) $request->user()->id);
            });
        }

        $eventCount = (clone $eventsQuery)->count();

        $topEvents = (clone $eventsQuery)
            ->select('name', DB::raw('COUNT(*) as count'))
            ->groupBy('name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $eventsByCategory = (clone $eventsQuery)
            ->select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        $recentEvents = (clone $eventsQuery)
            ->limit(20)
            ->get(['id', 'name', 'category', 'properties', 'occurred_at']);

        return response()->json([
            'success' => true,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'merchant_id' => $merchantId,
            ],
            'summary' => array_merge($summary, [
                'event_count' => $eventCount,
            ]),
            'daily_breakdown' => $daily->map(fn (AnalyticsDaily $entry) => [
                'date' => $entry->date->toDateString(),
                'merchant_id' => $entry->merchant_id,
                'total_reservations' => (int) $entry->total_reservations,
                'total_revenue' => (float) $entry->total_revenue,
                'products_saved_from_waste' => (int) $entry->products_saved_from_waste,
                'new_users' => (int) $entry->new_users,
            ])->values(),
            'top_events' => $topEvents,
            'events_by_category' => $eventsByCategory,
            'recent_events' => $recentEvents->map(fn (AnalyticsEvent $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'category' => $event->category,
                'properties' => $event->properties,
                'occurred_at' => $event->occurred_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    private function resolveOccurredAt(?int $timestamp): Carbon
    {
        if ($timestamp === null) {
            return now();
        }

        if ($timestamp > 9999999999) {
            return Carbon::createFromTimestampMs($timestamp);
        }

        return Carbon::createFromTimestamp($timestamp);
    }

    private function aggregateEvent(AnalyticsEvent $event): void
    {
        $eventDate = $event->occurred_at?->copy()->startOfDay() ?? now()->startOfDay();
        $merchantId = Arr::get($event->properties, 'merchantId');

        $this->applyAggregation($event, $eventDate, null);

        if ($merchantId !== null) {
            $this->applyAggregation($event, $eventDate, (int) $merchantId);
        }
    }

    private function applyAggregation(AnalyticsEvent $event, Carbon $date, ?int $merchantId): void
    {
        $dailyQuery = AnalyticsDaily::query()->whereDate('date', $date->toDateString());

        if ($merchantId === null) {
            $dailyQuery->whereNull('merchant_id');
        } else {
            $dailyQuery->where('merchant_id', $merchantId);
        }

        $daily = $dailyQuery->first();

        if (! $daily) {
            $daily = new AnalyticsDaily([
                'date' => $date->toDateString(),
                'merchant_id' => $merchantId,
                'total_reservations' => 0,
                'total_revenue' => 0,
                'products_saved_from_waste' => 0,
                'new_users' => 0,
            ]);
        }

        switch ($event->name) {
            case 'Reservation Created':
                $daily->total_reservations += 1;
                $daily->products_saved_from_waste += (int) Arr::get($event->properties, 'quantity', 0);
                break;
            case 'Purchase':
                $daily->total_revenue += (float) Arr::get($event->properties, 'amount', 0);
                break;
            case 'User Identified':
                if ($merchantId === null) {
                    $createdAt = Arr::get($event->properties, 'createdAt');
                    $isNewUser = Arr::get($event->properties, 'isNewUser') ?? Arr::get($event->properties, 'newUser');

                    if ($isNewUser || ($createdAt && Carbon::parse($createdAt)->isSameDay($date))) {
                        $daily->new_users += 1;
                    }
                }
                break;
            default:
                break;
        }

        $daily->save();
    }
}
