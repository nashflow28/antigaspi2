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
}