<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Merchant;
use App\Services\FirebaseAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;
use Exception;

/**
 * Firebase Authentication Controller
 * Handles phone authentication via Firebase and JWT token generation
 */
class FirebaseAuthController extends Controller
{
    private FirebaseAuthService $firebaseAuth;

    public function __construct(FirebaseAuthService $firebaseAuth)
    {
        $this->firebaseAuth = $firebaseAuth;
    }

    /**
     * Login with Firebase ID token
     *
     * If user exists: returns JWT token
     * If user is new: returns status 'new_user' with phone and firebase_uid
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'firebase_token' => 'required|string',
        ]);

        try {
            // Verify Firebase token
            $firebaseUser = $this->firebaseAuth->verifyIdToken($request->firebase_token);
            $firebaseUid = $firebaseUser['uid'];
            $phone = $firebaseUser['phone'];

            Log::info('Firebase login attempt', [
                'firebase_uid' => $firebaseUid,
                'phone' => $phone,
            ]);

            // Find existing user by firebase_uid or phone
            $user = User::where('firebase_uid', $firebaseUid)
                ->orWhere('phone', $phone)
                ->first();

            if (!$user) {
                // New user - return status for profile completion
                return response()->json([
                    'status' => 'new_user',
                    'phone' => $phone,
                    'firebase_uid' => $firebaseUid,
                    'message' => 'Nouvel utilisateur - completion de profil requise',
                ]);
            }

            // Update firebase_uid if not yet linked
            if (!$user->firebase_uid) {
                $user->firebase_uid = $firebaseUid;
                $user->phone_verified_at = now();
                $user->save();
            }

            // Generate JWT token
            $token = JWTAuth::fromUser($user);

            Log::info('Firebase login successful', [
                'user_id' => $user->id,
                'role' => $user->role,
            ]);

            return response()->json([
                'status' => 'success',
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $user->load(['merchant']),
            ]);

        } catch (Exception $e) {
            Log::error('Firebase login failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Complete registration for new phone-authenticated users
     *
     * SECURITY: Requires firebase_token to be re-verified to prevent
     * attackers from forging firebase_uid/phone fields
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'firebase_token' => 'required|string', // SECURITY: Token required for verification
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'role' => 'required|in:consumer,merchant',
            // Optional merchant fields
            'business_name' => 'required_if:role,merchant|string|max:255',
            'business_type' => 'nullable|string|max:100',
        ]);

        try {
            // SECURITY: Verify Firebase token to get authenticated uid and phone
            // This prevents attackers from forging the firebase_uid/phone fields
            $firebaseUser = $this->firebaseAuth->verifyIdToken($request->firebase_token);
            $firebaseUid = $firebaseUser['uid'];
            $phone = $firebaseUser['phone'];

            // Check if user already exists (race condition protection)
            $existingUser = User::where('firebase_uid', $firebaseUid)
                ->orWhere('phone', $phone)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Un compte existe deja avec ce numero de telephone',
                ], 409);
            }

            // Use transaction to ensure atomicity
            $result = DB::transaction(function () use ($request, $firebaseUid, $phone) {
                // Create new user (email and password are nullable for Firebase users)
                $user = User::create([
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'email' => $request->email, // Can be null
                    'phone' => $phone, // From verified Firebase token
                    'firebase_uid' => $firebaseUid, // From verified Firebase token
                    'phone_verified_at' => now(),
                    'role' => $request->role,
                    'city' => 'Lome', // Default city for Togo
                    'password' => null, // No password for Firebase users
                    'is_active' => true,
                ]);

                // If merchant role, create merchant profile
                if ($request->role === 'merchant') {
                    Merchant::create([
                        'user_id' => $user->id,
                        'business_name' => $request->business_name,
                        'business_type' => $request->business_type ?? 'general',
                        'is_verified' => false,
                    ]);
                }

                return $user;
            });

            // Generate JWT token
            $token = JWTAuth::fromUser($result);

            Log::info('Firebase registration successful', [
                'user_id' => $result->id,
                'role' => $result->role,
                'phone' => $result->phone,
            ]);

            return response()->json([
                'status' => 'success',
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $result->load(['merchant']),
                'message' => 'Compte cree avec succes',
            ]);

        } catch (Exception $e) {
            Log::error('Firebase registration failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la creation du compte: ' . $e->getMessage(),
            ], 500);
        }
    }
}
