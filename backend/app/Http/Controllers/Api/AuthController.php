<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Merchant;
use App\Models\RefreshToken;
use App\Services\JwtSecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private JwtSecurityService $jwtService;

    public function __construct(JwtSecurityService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:consumer,merchant',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string',

            // Champs spécifiques aux commerçants
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
            // Créer l'utilisateur
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

            // Si c'est un commerçant, créer le profil merchant
            if ($request->role === 'merchant') {
                Merchant::create([
                    'user_id' => $user->id,
                    'business_name' => $request->business_name,
                    'business_type' => $request->business_type,
                    'siret' => $request->siret,
                    'is_verified' => false,
                ]);
            }

            // Générer le token JWT
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'role' => $user->role,
                        'city' => $user->city,
                        'prefers_email_notifications' => $user->prefers_email_notifications,
                        'prefers_sms_notifications' => $user->prefers_sms_notifications,
                        'prefers_push_notifications' => $user->prefers_push_notifications,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
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

        $credentials = $request->only('email', 'password');

        try {
            // Vérifier si l'utilisateur existe et est actif
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé'
                ], 403);
            }

            // Tenter la connexion
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'role' => $user->role,
                        'city' => $user->city,
                        'prefers_email_notifications' => $user->prefers_email_notifications,
                        'prefers_sms_notifications' => $user->prefers_sms_notifications,
                        'prefers_push_notifications' => $user->prefers_push_notifications,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone' => $user->phone,
                'role' => $user->role,
                'city' => $user->city,
                'address' => $user->address,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'prefers_email_notifications' => $user->prefers_email_notifications,
                'prefers_sms_notifications' => $user->prefers_sms_notifications,
                'prefers_push_notifications' => $user->prefers_push_notifications,
            ];

            // Ajouter les infos commerçant si applicable
            if ($user->role === 'merchant' && $user->merchant) {
                $userData['merchant'] = [
                    'business_name' => $user->merchant->business_name,
                    'business_type' => $user->merchant->business_type,
                    'is_verified' => $user->merchant->is_verified,
                    'total_sales' => $user->merchant->total_sales,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $userData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide',
                'error' => $e->getMessage()
            ], 401);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rafraîchissement du token',
                'error' => $e->getMessage()
            ], 401);
        }
    }

    /**
     * Connexion sécurisée avec rate limiting et détection d'anomalies
     */
    public function secureLogin(Request $request): JsonResponse
    {
        // Rate limiting par IP
        $key = 'login_attempts:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $remainingTime = RateLimiter::availableIn($key);

            Log::warning('Too many login attempts', [
                'ip' => $request->ip(),
                'remaining_time' => $remainingTime,
            ]);

            return response()->json([
                'success' => false,
                'message' => "Trop de tentatives. Réessayez dans {$remainingTime} secondes.",
                'retry_after' => $remainingTime
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                RateLimiter::hit($key, 300); // 5 minutes

                Log::warning('Failed login attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects'
                ], 401);
            }

            // Vérifier le statut du compte
            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte suspendu ou inactif'
                ], 403);
            }

            // Générer les tokens sécurisés
            $tokenData = $this->jwtService->generateTokenPair($user, $request);

            // Effacer les tentatives de connexion après succès
            RateLimiter::clear($key);

            // Log connexion réussie
            Log::info('Successful login', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => $tokenData
            ]);

        } catch (\Exception $e) {
            Log::error('Login error', [
                'error' => $e->getMessage(),
                'email' => $request->email,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
            ], 500);
        }
    }

    /**
     * Rafraîchissement sécurisé du token
     */
    public function secureRefresh(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'refresh_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token requis',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tokenData = $this->jwtService->refreshToken(
                $request->refresh_token,
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Token rafraîchi avec succès',
                'data' => $tokenData
            ]);

        } catch (\Exception $e) {
            Log::warning('Failed token refresh', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 401);
        }
    }

    /**
     * Déconnexion sécurisée avec révocation du token
     */
    public function secureLogout(Request $request): JsonResponse
    {
        try {
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                $payload = JWTAuth::setToken($token)->getPayload();
                $jti = $payload->get('jti');

                // Révoquer le token
                $this->jwtService->revokeToken($jti);
            }

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion'
            ], 500);
        }
    }

    /**
     * Obtenir les sessions actives de l'utilisateur
     */
    public function getActiveSessions(Request $request): JsonResponse
    {
        try {
            $user = $request->get('auth_user');
            $sessions = $this->jwtService->getActiveSessions($user->id);

            // Marquer la session actuelle
            $currentPayload = $request->get('auth_payload');
            $currentJti = $currentPayload['jti'] ?? null;

            foreach ($sessions as &$session) {
                if ($session['jti'] === $currentJti) {
                    $session['is_current'] = true;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $sessions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des sessions'
            ], 500);
        }
    }

    /**
     * Révoquer une session spécifique
     */
    public function revokeSession(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->get('auth_user');
            $success = $this->jwtService->revokeSession($user->id, $request->session_id);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Session révoquée avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Session non trouvée'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la révocation de la session'
            ], 500);
        }
    }

    /**
     * Révoquer toutes les sessions sauf la session actuelle
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        try {
            $user = $request->get('auth_user');
            $currentPayload = $request->get('auth_payload');
            $currentJti = $currentPayload['jti'];

            // Révoquer toutes les autres sessions
            RefreshToken::revokeUserTokensExcept($user->id, $currentJti);

            return response()->json([
                'success' => true,
                'message' => 'Toutes les autres sessions ont été révoquées'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la révocation des sessions'
            ], 500);
        }
    }
}