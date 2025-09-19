<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoyaltyPointController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $targetUserId = $user->id;
        if (($user->isAdmin() || $user->isMerchant()) && $request->filled('user_id')) {
            $targetUserId = (int) $request->input('user_id');
        }

        if (!$user->isAdmin() && !$user->isMerchant() && $targetUserId !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez consulter que vos propres points'
            ], 403);
        }

        $points = LoyaltyPoint::where('user_id', $targetUserId)
            ->latest('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'balance' => $points->sum('points'),
            'data' => $points,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->isAdmin() && !$user->isMerchant()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les administrateurs ou commerçants peuvent attribuer des points'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'points' => 'required|integer|min:1',
            'earned_from' => 'nullable|string|max:255',
            'reference_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'expires_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $loyaltyPoint = LoyaltyPoint::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Points attribués',
            'data' => $loyaltyPoint,
            'balance' => $this->calculateBalance($data['user_id']),
        ], 201);
    }

    public function redeem(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $validator = Validator::make($request->all(), [
            'points' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $targetUserId = $user->id;
        if (($user->isAdmin() || $user->isMerchant()) && $request->filled('user_id')) {
            $targetUserId = (int) $request->input('user_id');
        }

        if (!$user->isAdmin() && !$user->isMerchant() && $targetUserId !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas consommer les points d’un autre utilisateur'
            ], 403);
        }

        $currentBalance = $this->calculateBalance($targetUserId);

        if ($currentBalance < $data['points']) {
            return response()->json([
                'success' => false,
                'message' => 'Solde de points insuffisant',
                'balance' => $currentBalance,
            ], 422);
        }

        $redeemEntry = LoyaltyPoint::create([
            'user_id' => $targetUserId,
            'points' => -$data['points'],
            'earned_from' => 'redeem',
            'reference_id' => null,
            'description' => $data['description'] ?? 'Consommation de points',
            'expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Points consommés',
            'data' => $redeemEntry,
            'balance' => $this->calculateBalance($targetUserId),
        ]);
    }

    public function balance(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $targetUserId = $user->id;
        if (($user->isAdmin() || $user->isMerchant()) && $request->filled('user_id')) {
            $targetUserId = (int) $request->input('user_id');
        }

        if (!$user->isAdmin() && !$user->isMerchant() && $targetUserId !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez consulter que votre solde'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'balance' => $this->calculateBalance($targetUserId),
        ]);
    }

    protected function calculateBalance(int $userId): int
    {
        return (int) LoyaltyPoint::where('user_id', $userId)->sum('points');
    }
}
