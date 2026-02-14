<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\JwtSecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Construire la représentation complète de l'utilisateur pour toutes les réponses Auth
     */
    private function formatUser(User $user): array
    {
        // Charger la relation merchant si nécessaire pour éviter les appels supplémentaires
        $user->loadMissing('merchant');

        $userData = [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'address' => $user->address,
            'photo_url' => $user->photo_url,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'prefers_email_notifications' => $user->prefers_email_notifications,
            'prefers_sms_notifications' => $user->prefers_sms_notifications,
            'prefers_push_notifications' => $user->prefers_push_notifications,
        ];

        if ($user->role === 'merchant' && $user->merchant) {
            $userData['merchant'] = [
                'id' => $user->merchant->id,
                'business_name' => $user->merchant->business_name,
                'business_type' => $user->merchant->business_type,
                'description' => $user->merchant->description,
                'siret' => $user->merchant->siret,
                'photo_url' => $user->merchant->photo_url,
                'is_verified' => $user->merchant->is_verified,
                'total_sales' => $user->merchant->total_sales,
            ];
        }

        return $userData;
    }

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
            // 🐛 BUG FIX #18: Phone format validation for international numbers (West Africa priority)
            // Accepts: +228 90 12 34 56, +229 97 12 34 56, +225 07 12 34 56 78, etc.
            'phone' => [
                'nullable',
                'string',
                'regex:/^\+\d{1,4}[\s]?[\d\s]{6,15}$/',
                'max:25',
            ],
            'role' => 'required|in:consumer,merchant',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string',

            // Champs spécifiques aux commerçants
            'business_name' => 'required_if:role,merchant|string|max:255',
            'business_type' => 'required_if:role,merchant|string|max:100',
            'siret' => 'nullable|string|max:20',

            // Code PIN optionnel (4-6 chiffres)
            'pin' => 'nullable|string|digits_between:4,6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // 🐛 BUG FIX #13: Catch unique constraint violation for email
            // Prevents race condition between validation and insertion
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
                'city' => $request->city,
                'address' => $request->address,
            ]);
            // SECURITY: Assign protected fields explicitly (not mass-assignable)
            $user->role = $request->role;
            $user->is_active = true;
            $user->save();

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

            // Définir le code PIN si fourni
            if ($request->filled('pin')) {
                $user->setPin($request->pin);
            }

            // Générer le token JWT
            $token = JWTAuth::fromUser($user);

            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            // 🐛 BUG FIX #13 (continued): Handle duplicate email error specifically
            if ($e->errorInfo[1] == 1062) { // MySQL duplicate entry error code
                return response()->json([
                    'success' => false,
                    'message' => 'Cette adresse email est déjà utilisée',
                    'errors' => [
                        'email' => ['Cette adresse email est déjà utilisée.'],
                    ],
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            // Vérifier si l'utilisateur existe et est actif
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                ], 404);
            }

            if (! $user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé',
                ], 403);
            }

            // Tenter la connexion
            // 🐛 BUG FIX #26: Log failed login attempts for security monitoring and audit trail
            if (! $token = JWTAuth::attempt($credentials)) {
                Log::warning('Failed login attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'timestamp' => now()->toIso8601String(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect',
                ], 401);
            }

            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatUser($user),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 401);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            // 🐛 BUG FIX #14: Handle expired token gracefully during logout
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie',
            ]);

        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            // Token already expired, no need to invalidate it
            Log::info('Logout called with expired token', [
                'ip' => request()->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie',
            ]);

        } catch (\Exception $e) {
            Log::error('Logout error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rafraîchissement du token',
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ], 401);
        }
    }

    /**
     * Connexion sécurisée avec rate limiting et détection d'anomalies
     */
    public function secureLogin(Request $request): JsonResponse
    {
        // Rate limiting par IP
        $key = 'login_attempts:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $remainingTime = RateLimiter::availableIn($key);

            Log::warning('Too many login attempts', [
                'ip' => $request->ip(),
                'remaining_time' => $remainingTime,
            ]);

            return response()->json([
                'success' => false,
                'message' => "Trop de tentatives. Réessayez dans {$remainingTime} secondes.",
                'retry_after' => $remainingTime,
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
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                RateLimiter::hit($key, 300); // 5 minutes

                Log::warning('Failed login attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants incorrects',
                ], 401);
            }

            // Vérifier le statut du compte
            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte suspendu ou inactif',
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
                'data' => $tokenData,
            ]);

        } catch (\Exception $e) {
            Log::error('Login error', [
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
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
                'errors' => $validator->errors(),
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
                'data' => $tokenData,
            ]);

        } catch (\Exception $e) {
            Log::warning('Failed token refresh', [
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => \App\Helpers\ErrorHelper::safeMessage($e, 'Erreur lors du rafraîchissement du token'),
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
                'message' => 'Déconnexion réussie',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
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
                'data' => $sessions,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des sessions',
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
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->get('auth_user');
            $success = $this->jwtService->revokeSession($user->id, $request->session_id);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Session révoquée avec succès',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Session non trouvée',
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la révocation de la session',
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
                'message' => 'Toutes les autres sessions ont été révoquées',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la révocation des sessions',
            ], 500);
        }
    }

    /**
     * Register with phone number (OTP verified)
     * Phone is required, email is optional
     */
    public function registerWithPhone(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:users,email',
            'role' => 'required|in:consumer,merchant',
            'city' => 'nullable|string|max:100',
            'password' => 'nullable|min:6', // Password optionnel pour inscription par téléphone

            // Champs spécifiques aux commerçants
            'business_name' => 'required_if:role,merchant|string|max:255',
            'business_type' => 'required_if:role,merchant|string|max:100',
            'siret' => 'nullable|string|max:20',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
            'first_name.required' => 'Le prénom est requis',
            'last_name.required' => 'Le nom est requis',
            'email.email' => 'L\'adresse email n\'est pas valide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'role.required' => 'Le rôle est requis',
            'role.in' => 'Le rôle doit être consumer ou merchant',
            'business_name.required_if' => 'Le nom du commerce est requis pour les commerçants',
            'business_type.required_if' => 'Le type de commerce est requis pour les commerçants',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Normalize phone number
        $phone = $this->normalizePhone($request->phone);

        // Check if phone is already registered
        $existingUser = User::where('phone', $phone)
            ->orWhere('phone', '+'.$phone)
            ->orWhere('phone', 'LIKE', '%'.substr($phone, -8))
            ->first();

        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Ce numéro de téléphone est déjà utilisé',
                'errors' => [
                    'phone' => ['Ce numéro de téléphone est déjà associé à un compte.'],
                ],
            ], 422);
        }

        // Verify OTP was validated for this phone (check cache/session)
        // Accept verification from either 'registration' or 'login' purpose
        // because user may have tried to login first and discovered they need to register
        $otpService = app(\App\Services\OtpService::class);
        $isVerifiedForRegistration = $otpService->isPhoneVerified($phone, 'registration');
        $isVerifiedForLogin = $otpService->isPhoneVerified($phone, 'login');

        if (! $isVerifiedForRegistration && ! $isVerifiedForLogin) {
            return response()->json([
                'success' => false,
                'message' => 'Le numéro de téléphone n\'a pas été vérifié. Veuillez d\'abord valider votre code OTP.',
                'errors' => [
                    'phone' => ['Numéro non vérifié.'],
                ],
            ], 422);
        }

        try {
            // Create user with phone as primary identifier
            $user = User::create([
                'phone' => $phone,
                'email' => $request->email,
                'password' => $request->password ? Hash::make($request->password) : Hash::make(bin2hex(random_bytes(16))),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'city' => $request->city ?? 'Lomé',
                'phone_verified_at' => now(),
            ]);
            // SECURITY: Assign protected fields explicitly (not mass-assignable)
            $user->role = $request->role;
            $user->is_active = true;
            $user->save();

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

            // Clear OTP verification status after successful registration (both purposes)
            $otpService->clearVerification($phone, 'registration');
            $otpService->clearVerification($phone, 'login');

            // Générer le token JWT
            $token = JWTAuth::fromUser($user);

            $user->refresh();

            Log::info('Phone registration successful', [
                'user_id' => $user->id,
                'phone' => substr($phone, 0, 5).'****',
                'role' => $user->role,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce numéro de téléphone ou email est déjà utilisé',
                    'errors' => [
                        'phone' => ['Ce numéro est déjà associé à un compte.'],
                    ],
                ], 422);
            }

            Log::error('Phone registration DB error', [
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
                'phone' => substr($phone, 0, 5).'****',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Phone registration error', [
                'error' => \App\Helpers\ErrorHelper::safeMessage($e),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
            ], 500);
        }
    }

    /**
     * Login with phone number (existing user)
     * Called after OTP verification for login purpose
     */
    public function loginWithPhone(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Numéro de téléphone invalide',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $this->normalizePhone($request->phone);

        // Verify OTP was validated for this phone
        $otpService = app(\App\Services\OtpService::class);
        if (! $otpService->isPhoneVerified($phone, 'login')) {
            return response()->json([
                'success' => false,
                'message' => 'Le numéro de téléphone n\'a pas été vérifié',
            ], 422);
        }

        // Find user by phone
        $user = User::where('phone', $phone)
            ->orWhere('phone', '+'.$phone)
            ->orWhere('phone', 'LIKE', '%'.substr($phone, -8))
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun compte associé à ce numéro',
                'data' => [
                    'user_exists' => false,
                    'phone' => $phone,
                ],
            ], 404);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Compte désactivé',
            ], 403);
        }

        // Clear verification after successful login
        $otpService->clearVerification($phone, 'login');

        // Generate JWT
        $token = JWTAuth::fromUser($user);

        Log::info('Phone login successful', [
            'user_id' => $user->id,
            'phone' => substr($phone, 0, 5).'****',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ],
        ]);
    }

    /**
     * Normalize phone number for storage and lookup
     */
    private function normalizePhone(string $phone): string
    {
        // Remove non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Remove leading 00 if present
        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        // Add Togo country code if phone is 8 digits
        if (strlen($phone) === 8) {
            $phone = '228'.$phone;
        }

        // Handle 9 digit numbers starting with 0
        if (strlen($phone) === 9 && str_starts_with($phone, '0')) {
            $phone = '228'.substr($phone, 1);
        }

        return $phone;
    }
}
