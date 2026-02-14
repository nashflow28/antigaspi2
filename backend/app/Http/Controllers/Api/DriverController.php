<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryDriver;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    /**
     * Get driver profile
     */
    public function profile(): JsonResponse
    {
        $user = Auth::user();
        $driver = DeliveryDriver::where('user_id', $user->id)->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        $driver->load(['zone', 'user']);

        return response()->json([
            'success' => true,
            'data' => [
                'driver' => $driver,
                'stats' => [
                    'today' => [
                        'deliveries' => $driver->getDeliveryCountForPeriod('today'),
                        'earnings' => $driver->getEarningsForPeriod('today'),
                    ],
                    'week' => [
                        'deliveries' => $driver->getDeliveryCountForPeriod('week'),
                        'earnings' => $driver->getEarningsForPeriod('week'),
                    ],
                    'month' => [
                        'deliveries' => $driver->getDeliveryCountForPeriod('month'),
                        'earnings' => $driver->getEarningsForPeriod('month'),
                    ],
                    'total' => [
                        'deliveries' => $driver->total_deliveries,
                        'earnings' => $driver->total_earnings,
                    ],
                ],
            ],
        ]);
    }

    /**
     * Register as driver
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_type' => 'required|in:moto,velo,voiture,pied',
            'vehicle_plate' => 'nullable|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'delivery_zone_id' => 'nullable|exists:delivery_zones,id',
            'id_card_url' => 'nullable|url|max:500',
            'license_url' => 'nullable|url|max:500',
            'photo_url' => 'nullable|url|max:500',
        ]);

        $user = Auth::user();

        // Check if already a driver
        if (DeliveryDriver::where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous êtes déjà inscrit comme livreur',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Create driver profile
            $driver = DeliveryDriver::create([
                'user_id' => $user->id,
                'vehicle_type' => $request->vehicle_type,
                'vehicle_plate' => $request->vehicle_plate,
                'license_number' => $request->license_number,
                'delivery_zone_id' => $request->delivery_zone_id,
                'id_card_url' => $request->id_card_url,
                'license_url' => $request->license_url,
                'photo_url' => $request->photo_url,
                'is_verified' => false, // Will be verified by admin
            ]);

            // SECURITY: Assign role explicitly (not mass-assignable)
            $user->role = 'driver';
            $user->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie. Votre compte sera vérifié sous 24-48h.',
                'data' => $driver->load('zone'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
            ], 500);
        }
    }

    /**
     * Update driver profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_type' => 'sometimes|in:moto,velo,voiture,pied',
            'vehicle_plate' => 'nullable|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'delivery_zone_id' => 'nullable|exists:delivery_zones,id',
            'photo_url' => 'nullable|url|max:500',
        ]);

        $driver = DeliveryDriver::where('user_id', Auth::id())->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        $driver->update($request->only([
            'vehicle_type',
            'vehicle_plate',
            'license_number',
            'delivery_zone_id',
            'photo_url',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour',
            'data' => $driver->fresh(['zone']),
        ]);
    }

    /**
     * Toggle availability
     */
    public function toggleAvailability(): JsonResponse
    {
        $driver = DeliveryDriver::where('user_id', Auth::id())->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        if (! $driver->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte n\'est pas encore vérifié',
            ], 400);
        }

        if (! $driver->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé',
            ], 400);
        }

        // Check if driver has active delivery
        if ($driver->is_available && $driver->getActiveDelivery()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez une livraison en cours',
            ], 400);
        }

        $isAvailable = $driver->toggleAvailability();

        return response()->json([
            'success' => true,
            'message' => $isAvailable ? 'Vous êtes maintenant disponible' : 'Vous êtes maintenant hors ligne',
            'data' => [
                'is_available' => $isAvailable,
            ],
        ]);
    }

    /**
     * Update location
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $driver = DeliveryDriver::where('user_id', Auth::id())->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        $driver->updateLocation($request->latitude, $request->longitude);

        return response()->json([
            'success' => true,
            'data' => [
                'latitude' => $driver->current_latitude,
                'longitude' => $driver->current_longitude,
                'updated_at' => $driver->last_location_update,
            ],
        ]);
    }

    /**
     * Get earnings
     */
    public function earnings(Request $request): JsonResponse
    {
        $driver = DeliveryDriver::where('user_id', Auth::id())->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        $period = $request->query('period', 'month');

        $earnings = $driver->earnings()
            ->forPeriod($period)
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        $summary = [
            'total' => $driver->earnings()->forPeriod($period)->sum('amount'),
            'deliveries' => $driver->earnings()->forPeriod($period)->deliveries()->sum('amount'),
            'bonuses' => $driver->earnings()->forPeriod($period)->where('type', 'bonus')->sum('amount'),
            'tips' => $driver->earnings()->forPeriod($period)->where('type', 'tip')->sum('amount'),
            'withdrawals' => abs($driver->earnings()->forPeriod($period)->withdrawals()->sum('amount')),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'earnings' => $earnings,
                'summary' => $summary,
            ],
        ]);
    }

    /**
     * Get statistics
     */
    public function stats(): JsonResponse
    {
        $driver = DeliveryDriver::where('user_id', Auth::id())->first();

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Profil livreur non trouvé',
            ], 404);
        }

        // Get daily stats for last 7 days
        $dailyStats = DB::table('deliveries')
            ->select(
                DB::raw('DATE(delivered_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(driver_commission) as earnings')
            )
            ->where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->where('delivered_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Get rating breakdown
        $ratingBreakdown = DB::table('deliveries')
            ->select('consumer_rating', DB::raw('COUNT(*) as count'))
            ->where('driver_id', $driver->id)
            ->whereNotNull('consumer_rating')
            ->groupBy('consumer_rating')
            ->get()
            ->pluck('count', 'consumer_rating');

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_deliveries' => $driver->total_deliveries,
                    'total_earnings' => $driver->total_earnings,
                    'rating' => $driver->rating,
                    'member_since' => $driver->created_at,
                ],
                'daily_stats' => $dailyStats,
                'rating_breakdown' => $ratingBreakdown,
                'current_status' => [
                    'is_available' => $driver->is_available,
                    'is_online' => $driver->is_online,
                    'active_delivery' => $driver->getActiveDelivery()?->load('reservation.product'),
                ],
            ],
        ]);
    }
}
