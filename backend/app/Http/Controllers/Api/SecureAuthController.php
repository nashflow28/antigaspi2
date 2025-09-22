<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Merchant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Cookie;

class SecureAuthController extends Controller
{
    /**
     * Durée de vie des tokens en minutes
     */
    private const ACCESS_TOKEN_TTL = 15; // 15 minutes
    private const REFRESH_TOKEN_TTL = 10080; // 7 jours

    /**
     * Inscription avec httpOnly cookies
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:consumer,merchant',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string',
            'business_name' => 'required_if:role,merchant|string|max:255',
            'business_type' => 'required_if:role,merchant|string|max:100',
            'siret' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
                'role' => $request->role,
                'city' => $request->city,
                'address' => $request->address,
                'is_active' => true,
            ]);

            if ($request->role === 'merchant') {
                Merchant::create([
                    'user_id' => $user->id,
                    'business_name' => $request->business_name,
                    'business_type' => $request->business_type,
                    'siret' => $request->siret,
                    'is_verified' => false,
                ]);
            }

            // Générer les tokens
            $accessToken = JWTAuth::customClaims(['type' => 'access'])->fromUser($user);
            $refreshToken = JWTAuth::customClaims([
                'type' => 'refresh',
                'access_jti' => JWTAuth::setToken($accessToken)->getPayload()->get('jti')
            ])->setTTL(self::REFRESH_TOKEN_TTL)->fromUser($user);

            // Créer les cookies httpOnly
            $accessCookie = Cookie::make(
                'access_token',
                $accessToken,
                self::ACCESS_TOKEN_TTL,
                '/',
                null,
                true, // secure (HTTPS only en production)
                true, // httpOnly
                false, // raw
                'strict' // sameSite
            );

            $refreshCookie = Cookie::make(
                'refresh_token',
                $refreshToken,
                self::REFRESH_TOKEN_TTL,
                '/',
                null,
                true, // secure
                true, // httpOnly
                false, // raw
                'strict' // sameSite
            );

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'data' => [
                    'user' => $this->getUserData($user)
                ]
            ], 201)->withCookie($accessCookie)->withCookie($refreshCookie);

        } catch (\Exception $e) {
            Log::error('Registration error', [
                'error' => $e->getMessage(),
                'email' => $request->email
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription'
            ], 500);
        }
    }

    /**
     * Connexion avec httpOnly cookies et rate limiting
     */
    public function login(Request $request): JsonResponse
    {
        $key = 'login_attempts:' . $request->ip();

        // Rate limiting
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            Log::warning('Too many login attempts', [
                'ip' => $request->ip(),
                'email' => $request->email ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
                'retry_after' => $seconds
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                RateLimiter::hit($key, 300);
                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects'
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé'
                ], 403);
            }

            if (!Hash::check($request->password, $user->password)) {
                RateLimiter::hit($key, 300);

                Log::warning('Failed login attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects'
                ], 401);
            }

            // Générer les tokens
            $accessToken = JWTAuth::customClaims(['type' => 'access'])->fromUser($user);
            $refreshToken = JWTAuth::customClaims([
                'type' => 'refresh',
                'access_jti' => JWTAuth::setToken($accessToken)->getPayload()->get('jti')
            ])->setTTL(self::REFRESH_TOKEN_TTL)->fromUser($user);

            // Effacer le rate limiter après succès
            RateLimiter::clear($key);

            // Log de connexion réussie
            Log::info('Successful login', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip()
            ]);

            // Créer les cookies httpOnly
            $accessCookie = Cookie::make(
                'access_token',
                $accessToken,
                self::ACCESS_TOKEN_TTL,
                '/',
                null,
                config('app.env') === 'production',
                true,
                false,
                'strict'
            );

            $refreshCookie = Cookie::make(
                'refresh_token',
                $refreshToken,
                self::REFRESH_TOKEN_TTL,
                '/',
                null,
                config('app.env') === 'production',
                true,
                false,
                'strict'
            );

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'user' => $this->getUserData($user)
                ]
            ])->withCookie($accessCookie)->withCookie($refreshCookie);

        } catch (\Exception $e) {
            Log::error('Login error', [
                'error' => $e->getMessage(),
                'email' => $request->email
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion'
            ], 500);
        }
    }

    /**
     * Obtenir les informations de l'utilisateur depuis le cookie
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $token = $request->cookie('access_token');

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token non trouvé'
                ], 401);
            }

            $user = JWTAuth::setToken($token)->authenticate();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->getUserData($user)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide'
            ], 401);
        }
    }

    /**
     * Rafraîchir le token depuis le cookie
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $refreshToken = $request->cookie('refresh_token');

            if (!$refreshToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Refresh token non trouvé'
                ], 401);
            }

            // Vérifier que c'est bien un refresh token
            $payload = JWTAuth::setToken($refreshToken)->getPayload();

            if ($payload->get('type') !== 'refresh') {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide'
                ], 401);
            }

            // Obtenir l'utilisateur depuis le refresh token
            $user = JWTAuth::setToken($refreshToken)->authenticate();

            // Générer un nouveau access token
            $accessToken = JWTAuth::customClaims(['type' => 'access'])->fromUser($user);

            $accessCookie = Cookie::make(
                'access_token',
                $accessToken,
                self::ACCESS_TOKEN_TTL,
                '/',
                null,
                config('app.env') === 'production',
                true,
                false,
                'strict'
            );

            return response()->json([
                'success' => true,
                'message' => 'Token rafraîchi avec succès',
                'data' => [
                    'user' => $this->getUserData($user)
                ]
            ])->withCookie($accessCookie);

        } catch (\Exception $e) {
            Log::warning('Token refresh failed', [
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rafraîchissement du token'
            ], 401);
        }
    }

    /**
     * Déconnexion avec suppression des cookies
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Invalider le token si présent
            $token = $request->cookie('access_token');
            if ($token) {
                try {
                    JWTAuth::setToken($token)->invalidate();
                } catch (\Exception $e) {
                    // Ignorer l'erreur si le token est déjà invalide
                }
            }

            // Supprimer les cookies
            $accessCookie = Cookie::forget('access_token');
            $refreshCookie = Cookie::forget('refresh_token');

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ])->withCookie($accessCookie)->withCookie($refreshCookie);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion'
            ], 500);
        }
    }

    /**
     * Vérifier si l'utilisateur est authentifié
     */
    public function check(Request $request): JsonResponse
    {
        try {
            $token = $request->cookie('access_token');

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'authenticated' => false
                ]);
            }

            $user = JWTAuth::setToken($token)->authenticate();

            return response()->json([
                'success' => true,
                'authenticated' => true,
                'user' => $this->getUserData($user)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'authenticated' => false
            ]);
        }
    }

    /**
     * Formater les données utilisateur
     */
    private function getUserData(User $user): array
    {
        $data = [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'address' => $user->address,
            'is_active' => $user->is_active,
            'prefers_email_notifications' => $user->prefers_email_notifications,
            'prefers_sms_notifications' => $user->prefers_sms_notifications,
            'prefers_push_notifications' => $user->prefers_push_notifications,
            'created_at' => $user->created_at
        ];

        if ($user->role === 'merchant' && $user->merchant) {
            $data['merchant'] = [
                'business_name' => $user->merchant->business_name,
                'business_type' => $user->merchant->business_type,
                'is_verified' => $user->merchant->is_verified,
                'total_sales' => $user->merchant->total_sales,
            ];
        }

        return $data;
    }
}