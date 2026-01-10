<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsDaily;
use App\Models\AnalyticsEvent;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

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

    /**
     * Statistiques en temps réel pour le tableau de bord merchant
     */
    public function merchantStats(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants',
                ], 403);
            }

            $merchantId = $user->merchant->id;

            // Statistiques produits
            $totalProducts = Product::where('merchant_id', $merchantId)->count();
            $activeProducts = Product::where('merchant_id', $merchantId)
                ->where('is_active', true)
                ->where('quantity_available', '>', 0)
                ->where('expiration_date', '>=', now()->toDateString())
                ->count();

            // Statistiques réservations
            $reservations = Reservation::whereHas('product', function ($query) use ($merchantId) {
                $query->where('merchant_id', $merchantId);
            });

            $totalReservations = (clone $reservations)->count();
            $pendingReservations = (clone $reservations)->where('status', 'pending')->count();
            $confirmedReservations = (clone $reservations)->where('status', 'confirmed')->count();
            $completedReservations = (clone $reservations)->where('status', 'completed')->count();

            // Revenus du jour - BUG FIX #2 & #5: Inclure completed + confirmed payés
            // Compte les réservations complétées aujourd'hui OU confirmées et payées aujourd'hui
            $todaysRevenue = (clone $reservations)
                ->where(function ($query) {
                    $query->where(function ($q) {
                        // Réservations complétées aujourd'hui
                        $q->where('status', 'completed')
                            ->whereDate('completed_at', now()->toDateString());
                    })->orWhere(function ($q) {
                        // Réservations confirmées et payées (wallet) aujourd'hui
                        $q->where('status', 'confirmed')
                            ->where('payment_status', 'success')
                            ->whereDate('confirmed_at', now()->toDateString());
                    });
                })
                ->sum('total_amount');

            // Total des ventes (depuis merchant.total_sales)
            $totalSales = $user->merchant->total_sales;

            return response()->json([
                'success' => true,
                'data' => [
                    'active_products' => $activeProducts,
                    'pending_reservations' => $pendingReservations,
                    'todays_revenue' => (float) $todaysRevenue,
                    'total_products' => $totalProducts,
                    'total_reservations' => $totalReservations,
                    'confirmed_reservations' => $confirmedReservations,
                    'completed_reservations' => $completedReservations,
                    'total_sales' => (float) $totalSales,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revenue chart data for merchant (évolution CA)
     */
    public function merchantRevenueChart(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants',
                ], 403);
            }

            $merchantId = $user->merchant->id;
            $period = $request->query('period', 'week'); // week, month, quarter

            $days = match ($period) {
                'week' => 7,
                'month' => 30,
                'quarter' => 90,
                default => 7,
            };

            // Récupérer les revenus par jour - BUG FIX #2 & #5: Completed + confirmed payés
            // On utilise COALESCE pour prendre completed_at ou confirmed_at selon le cas
            $revenues = Reservation::whereHas('product', function ($query) use ($merchantId) {
                $query->where('merchant_id', $merchantId);
            })
                ->where(function ($query) {
                    $query->where('status', 'completed')
                        ->orWhere(function ($q) {
                            $q->where('status', 'confirmed')
                                ->where('payment_status', 'success');
                        });
                })
                ->where(function ($query) use ($days) {
                    $query->where(function ($q) use ($days) {
                        $q->whereNotNull('completed_at')
                            ->where('completed_at', '>=', now()->subDays($days));
                    })->orWhere(function ($q) use ($days) {
                        $q->whereNull('completed_at')
                            ->whereNotNull('confirmed_at')
                            ->where('confirmed_at', '>=', now()->subDays($days));
                    });
                })
                ->selectRaw('DATE(COALESCE(completed_at, confirmed_at)) as date, SUM(total_amount) as revenue')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'days' => $days,
                    'chart_data' => $revenues->map(fn ($item) => [
                        'date' => $item->date,
                        'revenue' => (float) $item->revenue,
                    ]),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des revenus',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Top products chart data for merchant
     */
    public function merchantProductsChart(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants',
                ], 403);
            }

            $merchantId = $user->merchant->id;
            $limit = $request->query('limit', 10);

            // Top produits les plus réservés - BUG FIX #5: Inclure confirmed payés
            $topProducts = Reservation::join('products', 'reservations.product_id', '=', 'products.id')
                ->where('products.merchant_id', $merchantId)
                ->where(function ($query) {
                    $query->where('reservations.status', 'completed')
                        ->orWhere(function ($q) {
                            $q->where('reservations.status', 'confirmed')
                                ->where('reservations.payment_status', 'success');
                        });
                })
                ->selectRaw('products.id, products.name, SUM(reservations.quantity_reserved) as total_sold')
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_sold')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'chart_data' => $topProducts->map(fn ($item) => [
                        'product_id' => $item->id,
                        'product_name' => $item->name,
                        'total_sold' => (int) $item->total_sold,
                    ]),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des produits',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reservations trend chart data for merchant
     */
    public function merchantReservationsChart(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user->isMerchant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux commerçants',
                ], 403);
            }

            $merchantId = $user->merchant->id;
            $period = $request->query('period', 'week');

            $days = match ($period) {
                'week' => 7,
                'month' => 30,
                'quarter' => 90,
                default => 7,
            };

            // Tendance des réservations - BUG FIX #3: Exclure les réservations annulées
            $reservations = Reservation::whereHas('product', function ($query) use ($merchantId) {
                $query->where('merchant_id', $merchantId);
            })
                ->whereNotIn('status', ['cancelled'])
                ->where('created_at', '>=', now()->subDays($days))
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'days' => $days,
                    'chart_data' => $reservations->map(fn ($item) => [
                        'date' => $item->date,
                        'count' => (int) $item->count,
                    ]),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des réservations',
                'error' => $e->getMessage(),
            ], 500);
        }
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

        $geographicQuery = Reservation::query()
            ->selectRaw(
                "COALESCE(NULLIF(TRIM(users.city), ''), 'Non renseigné') as city, ".
                'COUNT(*) as reservation_count, '.
                'SUM(reservations.total_amount) as total_revenue'
            )
            ->leftJoin('users', 'reservations.user_id', '=', 'users.id')
            ->join('products', 'reservations.product_id', '=', 'products.id')
            ->where('reservations.status', 'completed')
            ->whereBetween('reservations.created_at', [$startDate, $endDate])
            ->groupBy('city')
            ->orderByDesc('reservation_count')
            ->limit(10);

        if ($merchantId !== null) {
            $geographicQuery->where('products.merchant_id', $merchantId);
        }

        $geographicRaw = $geographicQuery->get();
        $totalGeoReservations = max((int) $geographicRaw->sum('reservation_count'), 0);

        $geographicDistribution = $geographicRaw->map(function ($entry) use ($totalGeoReservations) {
            $reservationCount = (int) $entry->reservation_count;
            $revenue = (float) ($entry->total_revenue ?? 0);
            $percentage = $totalGeoReservations > 0
                ? round(($reservationCount / $totalGeoReservations) * 100, 2)
                : 0.0;

            return [
                'city' => $entry->city,
                'reservation_count' => $reservationCount,
                'total_revenue' => $revenue,
                'percentage' => $percentage,
            ];
        })->values();

        $merchantBaseQuery = Reservation::query()
            ->join('products', 'reservations.product_id', '=', 'products.id')
            ->join('merchants', 'products.merchant_id', '=', 'merchants.id')
            ->where('reservations.status', 'completed');

        if ($merchantId !== null) {
            $merchantBaseQuery->where('products.merchant_id', $merchantId);
        }

        $merchantPerformanceRaw = (clone $merchantBaseQuery)
            ->selectRaw(
                'products.merchant_id as merchant_id, '.
                'merchants.business_name as merchant_name, '.
                'COUNT(*) as reservation_count, '.
                'SUM(reservations.total_amount) as total_revenue, '.
                'AVG(reservations.total_amount) as average_order_value'
            )
            ->whereBetween('reservations.created_at', [$startDate, $endDate])
            ->groupBy('products.merchant_id', 'merchants.business_name')
            ->orderByDesc('total_revenue')
            ->limit($merchantId !== null ? 5 : 10)
            ->get();

        $periodLength = max($startDate->diffInDays($endDate) + 1, 1);
        $previousPeriodEnd = (clone $startDate)->subDay()->endOfDay();
        $previousPeriodStart = (clone $previousPeriodEnd)->subDays($periodLength - 1)->startOfDay();

        $previousMerchantRevenue = (clone $merchantBaseQuery)
            ->whereBetween('reservations.created_at', [$previousPeriodStart, $previousPeriodEnd])
            ->selectRaw('products.merchant_id as merchant_id, SUM(reservations.total_amount) as total_revenue')
            ->groupBy('products.merchant_id')
            ->pluck('total_revenue', 'merchant_id');

        $merchantPerformance = $merchantPerformanceRaw->map(function ($entry) use ($previousMerchantRevenue, $merchantId) {
            $currentRevenue = (float) ($entry->total_revenue ?? 0);
            $previousRevenue = (float) ($previousMerchantRevenue[$entry->merchant_id] ?? 0);
            $growthRate = $previousRevenue > 0
                ? round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 2)
                : null;

            return [
                'merchant_id' => (int) $entry->merchant_id,
                'merchant_name' => $entry->merchant_name,
                'reservation_count' => (int) $entry->reservation_count,
                'total_revenue' => $currentRevenue,
                'average_order_value' => (float) ($entry->average_order_value ?? 0),
                'growth_rate' => $growthRate,
                'is_selected' => $merchantId !== null && (int) $entry->merchant_id === (int) $merchantId,
            ];
        });

        if ($merchantId !== null && $merchantPerformance->isEmpty()) {
            $merchant = Merchant::find($merchantId);

            if ($merchant) {
                $merchantPerformance = collect([[
                    'merchant_id' => (int) $merchant->id,
                    'merchant_name' => $merchant->business_name ?? 'Commerçant',
                    'reservation_count' => 0,
                    'total_revenue' => 0.0,
                    'average_order_value' => 0.0,
                    'growth_rate' => null,
                    'is_selected' => true,
                ]]);
            }
        }

        $merchantPerformance = $merchantPerformance->values();

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
            'geographic_distribution' => $geographicDistribution,
            'merchant_performance' => $merchantPerformance,
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
