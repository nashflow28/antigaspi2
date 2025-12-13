<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FirebaseAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
                'expires_in' => auth()->factory()->getTTL() * 60,
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
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'firebase_uid' => 'required|string|unique:users,firebase_uid',
            'phone' => 'required|string|unique:users,phone',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'role' => 'required|in:consumer,merchant',
        ]);

        try {
            // Create new user
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'firebase_uid' => $request->firebase_uid,
                'phone_verified_at' => now(),
                'role' => $request->role,
                'city' => 'Lome', // Default city for Togo
                'password' => bcrypt(Str::random(32)), // Random password (not used for phone auth)
            ]);

            // Generate JWT token
            $token = JWTAuth::fromUser($user);

            Log::info('Firebase registration successful', [
                'user_id' => $user->id,
                'role' => $user->role,
                'phone' => $user->phone,
            ]);

            return response()->json([
                'status' => 'success',
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => auth()->factory()->getTTL() * 60,
                'user' => $user,
                'message' => 'Compte cree avec succes',
            ]);

        } catch (Exception $e) {
            Log::error('Firebase registration failed', [
                'error' => $e->getMessage(),
                'phone' => $request->phone,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la creation du compte: ' . $e->getMessage(),
            ], 500);
        }
    }
}
