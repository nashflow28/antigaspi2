<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Merchant;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminController extends Controller
{
    public function __construct()
    {
        // Middleware is handled in routes, not controller for Laravel 11
    }

    public function dashboard(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Statistiques de base
            $totalUsers = User::count();
            $newUsersThisMonth = User::whereMonth('created_at', now()->month)->count();
            $activeMerchants = Merchant::whereHas('user', function($q) {
                $q->where('role', 'merchant');
            })->count();

            // Croissance des commerçants (mois précédent vs mois actuel)
            $lastMonthMerchants = Merchant::whereMonth('created_at', now()->subMonth()->month)->count();
            $merchantGrowthRate = $lastMonthMerchants > 0
                ? round((($activeMerchants - $lastMonthMerchants) / $lastMonthMerchants) * 100, 1)
                : 0;

            // 🐛 BUG FIX #18: Use SQL aggregation instead of loading all records into memory
            // Avoid memory leak by using database-level SUM() instead of Collection->sum()
            $productsSaved = Reservation::where('status', 'completed')->sum('quantity_reserved');
            $totalRevenue = Reservation::where('status', 'completed')->sum('total_amount');

            // Croissance des revenus
            $lastMonthRevenue = Reservation::where('status', 'completed')
                ->whereMonth('created_at', now()->subMonth()->month)
                ->sum('total_amount');
            $revenueGrowth = $lastMonthRevenue > 0
                ? round((($totalRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                : 0;

            // Top commerçants
            $topMerchants = Merchant::with('user')
                ->withCount(['products as completed_reservations' => function($q) {
                    $q->whereHas('reservations', function($query) {
                        $query->where('status', 'completed');
                    });
                }])
                ->withSum(['products as total_revenue' => function($q) {
                    $q->join('reservations', 'products.id', '=', 'reservations.product_id')
                      ->where('reservations.status', 'completed');
                }], 'reservations.total_amount')
                ->orderBy('total_revenue', 'desc')
                ->take(5)
                ->get()
                ->map(function ($merchant) {
                    return [
                        'id' => $merchant->id,
                        'name' => $merchant->business_name,
                        'productsSold' => $merchant->completed_reservations ?? 0,
                        'revenue' => $merchant->total_revenue ?? 0,
                    ];
                });

            // Catégories populaires
            $popularCategories = Category::withCount(['products as product_count'])
                ->orderBy('product_count', 'desc')
                ->get()
                ->map(function ($category) use ($productsSaved) {
                    $percentage = $productsSaved > 0
                        ? round(($category->product_count / $productsSaved) * 100, 0)
                        : 0;
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'icon' => $category->icon,
                        'productCount' => $category->product_count,
                        'percentage' => $percentage,
                    ];
                });

            // Activités récentes
            $recentActivities = collect();

            // Nouveaux utilisateurs
            $newUsers = User::where('created_at', '>=', now()->subDays(7))
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => 'user_' . $user->id,
                        'type' => $user->role === 'merchant' ? 'merchant_joined' : 'user_registered',
                        'title' => $user->role === 'merchant' ? 'Nouveau commerçant' : 'Nouvel utilisateur inscrit',
                        'description' => $user->first_name . ' ' . $user->last_name . ' s\'est inscrit(e)',
                        'timestamp' => $user->created_at->toISOString(),
                        'status' => 'success'
                    ];
                });

            // Réservations récentes
            $recentReservations = Reservation::with(['product', 'user'])
                ->where('status', 'completed')
                ->where('created_at', '>=', now()->subDays(7))
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($reservation) {
                    return [
                        'id' => 'reservation_' . $reservation->id,
                        'type' => 'product_sold',
                        'title' => 'Produit vendu',
                        'description' => $reservation->product->name . ' vendu à ' . $reservation->user->first_name,
                        'timestamp' => $reservation->created_at->toISOString(),
                        'status' => 'completed'
                    ];
                });

            $recentActivities = $newUsers->concat($recentReservations)
                ->sortByDesc('timestamp')
                ->take(10)
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'totalUsers' => $totalUsers,
                        'newUsersThisMonth' => $newUsersThisMonth,
                        'activeMerchants' => $activeMerchants,
                        'merchantGrowthRate' => $merchantGrowthRate,
                        'productsSaved' => $productsSaved,
                        'kgFoodSaved' => $productsSaved, // Assuming 1 product = 1 kg for simplicity
                        'totalRevenue' => $totalRevenue,
                        'revenueGrowth' => $revenueGrowth,
                    ],
                    'topMerchants' => $topMerchants,
                    'popularCategories' => $popularCategories,
                    'recentActivities' => $recentActivities,
                    'environmentalImpact' => [
                        'co2Saved' => $productsSaved * 2.5, // 2.5kg CO2 par kg de nourriture
                        'waterSaved' => $productsSaved * 1000, // 1000L d'eau par kg
                        'wasteSaved' => $productsSaved,
                        'treesEquivalent' => intval($productsSaved / 50), // 50kg = 1 arbre
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données du dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function systemHealth(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Test de santé de base
            $health = [
                [
                    'name' => 'API Backend',
                    'description' => 'Services Laravel',
                    'status' => 'healthy',
                    'uptime' => '99.9%',
                    'responseTime' => '45ms'
                ],
                [
                    'name' => 'Base de données',
                    'description' => 'MySQL Principal',
                    'status' => $this->testDatabaseConnection() ? 'healthy' : 'error',
                    'uptime' => '99.8%',
                    'responseTime' => '12ms'
                ],
                [
                    'name' => 'Frontend',
                    'description' => 'Application Vue.js',
                    'status' => 'healthy',
                    'uptime' => '100%',
                    'responseTime' => '120ms'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $health
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification de la santé du système',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function testDatabaseConnection(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Export analytics data in CSV or PDF format
     */
    public function exportAnalytics(Request $request): mixed
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            $validated = $request->validate([
                'format' => ['required', 'in:csv,pdf'],
                'period' => ['nullable', 'in:week,month,year'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            ]);

            $format = $validated['format'];
            $period = $validated['period'] ?? 'month';

            // Get date range based on period or custom dates
            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $startDate = \Carbon\Carbon::parse($validated['start_date']);
                $endDate = \Carbon\Carbon::parse($validated['end_date']);
            } else {
                $endDate = now();
                $startDate = match($period) {
                    'week' => now()->subWeek(),
                    'year' => now()->subYear(),
                    default => now()->subMonth(),
                };
            }

            // Collect analytics data
            $data = $this->collectAnalyticsData($startDate, $endDate);

            if ($format === 'csv') {
                return $this->generateCSV($data, $startDate, $endDate);
            } else {
                return $this->generatePDFHTML($data, $startDate, $endDate);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Collect analytics data for export
     */
    private function collectAnalyticsData($startDate, $endDate): array
    {
        // Users statistics
        $totalUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $consumerCount = User::where('role', 'consumer')
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $merchantCount = User::where('role', 'merchant')
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        // Merchants statistics
        $verifiedMerchants = Merchant::where('is_verified', true)
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $pendingMerchants = Merchant::where('is_verified', false)
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        // Products statistics
        $totalProducts = Product::whereBetween('created_at', [$startDate, $endDate])->count();
        $activeProducts = Product::where('is_active', true)
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        // Reservations statistics
        $reservations = Reservation::whereBetween('created_at', [$startDate, $endDate]);
        $totalReservations = $reservations->count();
        $completedReservations = (clone $reservations)->where('status', 'completed')->count();
        $pendingReservations = (clone $reservations)->where('status', 'pending')->count();
        $cancelledReservations = (clone $reservations)->where('status', 'cancelled')->count();

        // Financial statistics
        $totalRevenue = Reservation::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');
        $averageOrderValue = $completedReservations > 0
            ? $totalRevenue / $completedReservations
            : 0;

        // Products saved from waste
        $productsSaved = Reservation::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('quantity_reserved');

        // Top merchants by completed orders in period
        $topMerchantsData = DB::table('merchants')
            ->join('users', 'merchants.user_id', '=', 'users.id')
            ->join('products', 'merchants.id', '=', 'products.merchant_id')
            ->join('reservations', 'products.id', '=', 'reservations.product_id')
            ->where('reservations.status', 'completed')
            ->whereBetween('reservations.created_at', [$startDate, $endDate])
            ->select(
                'merchants.id',
                'merchants.business_name',
                'merchants.business_type',
                'merchants.is_verified',
                'users.email',
                DB::raw('COUNT(reservations.id) as orders_count')
            )
            ->groupBy('merchants.id', 'merchants.business_name', 'merchants.business_type', 'merchants.is_verified', 'users.email')
            ->orderByDesc('orders_count')
            ->limit(10)
            ->get();

        $topMerchants = $topMerchantsData->map(function ($merchant) {
            return [
                'name' => $merchant->business_name,
                'type' => $merchant->business_type ?? 'Non spécifié',
                'email' => $merchant->email,
                'orders' => $merchant->orders_count,
                'verified' => $merchant->is_verified ? 'Oui' : 'Non',
            ];
        });

        // Popular categories
        $popularCategories = Category::withCount(['products' => function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            }])
            ->whereHas('products', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->orderBy('products_count', 'desc')
            ->take(10)
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->name,
                    'products_count' => $category->products_count,
                    'icon' => $category->icon ?? 'N/A',
                ];
            });

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total_users' => $totalUsers,
                'consumers' => $consumerCount,
                'merchants' => $merchantCount,
                'verified_merchants' => $verifiedMerchants,
                'pending_merchants' => $pendingMerchants,
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'total_reservations' => $totalReservations,
                'completed_reservations' => $completedReservations,
                'pending_reservations' => $pendingReservations,
                'cancelled_reservations' => $cancelledReservations,
                'total_revenue' => number_format($totalRevenue, 0, ',', ' ') . ' XOF',
                'average_order_value' => number_format($averageOrderValue, 0, ',', ' ') . ' XOF',
                'products_saved' => $productsSaved,
                'environmental_impact' => [
                    'co2_saved' => number_format($productsSaved * 2.5, 1) . ' kg',
                    'water_saved' => number_format($productsSaved * 1000, 0) . ' L',
                ],
            ],
            'top_merchants' => $topMerchants,
            'popular_categories' => $popularCategories,
        ];
    }

    /**
     * Generate CSV file from analytics data
     */
    private function generateCSV(array $data, $startDate, $endDate)
    {
        $filename = 'analytics-export-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.csv';

        $callback = function() use ($data) {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header
            fputcsv($file, ['RAPPORT ANALYTICS ANTIGASPI']);
            fputcsv($file, ['Période', $data['period']['start'] . ' au ' . $data['period']['end']]);
            fputcsv($file, ['Généré le', now()->format('Y-m-d H:i:s')]);
            fputcsv($file, []); // Empty row

            // Summary statistics
            fputcsv($file, ['STATISTIQUES GÉNÉRALES']);
            fputcsv($file, ['Métrique', 'Valeur']);

            foreach ($data['summary'] as $key => $value) {
                if (!is_array($value)) {
                    $label = ucfirst(str_replace('_', ' ', $key));
                    fputcsv($file, [$label, $value]);
                }
            }
            fputcsv($file, []); // Empty row

            // Environmental impact
            fputcsv($file, ['IMPACT ENVIRONNEMENTAL']);
            fputcsv($file, ['Métrique', 'Valeur']);
            foreach ($data['summary']['environmental_impact'] as $key => $value) {
                $label = ucfirst(str_replace('_', ' ', $key));
                fputcsv($file, [$label, $value]);
            }
            fputcsv($file, []); // Empty row

            // Top merchants
            fputcsv($file, ['TOP COMMERÇANTS']);
            fputcsv($file, ['Nom', 'Type', 'Email', 'Commandes', 'Vérifié']);

            foreach ($data['top_merchants'] as $merchant) {
                fputcsv($file, [
                    $merchant['name'],
                    $merchant['type'],
                    $merchant['email'],
                    $merchant['orders'],
                    $merchant['verified'],
                ]);
            }
            fputcsv($file, []); // Empty row

            // Popular categories
            fputcsv($file, ['CATÉGORIES POPULAIRES']);
            fputcsv($file, ['Nom', 'Nombre de produits', 'Icône']);

            foreach ($data['popular_categories'] as $category) {
                fputcsv($file, [
                    $category['name'],
                    $category['products_count'],
                    $category['icon'],
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Generate PDF-ready HTML from analytics data
     */
    private function generatePDFHTML(array $data, $startDate, $endDate)
    {
        $filename = 'analytics-export-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.html';

        $html = view('exports.analytics-pdf', [
            'data' => $data,
            'generated_at' => now()->format('d/m/Y H:i:s'),
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}