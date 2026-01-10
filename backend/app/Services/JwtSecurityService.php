<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Token;

class JwtSecurityService
{
    const REFRESH_TOKEN_TTL_DAYS = 30;

    const MAX_TOKENS_PER_USER = 5;

    /**
     * Génère un access token et refresh token sécurisés
     */
    public function generateTokenPair(User $user, Request $request): array
    {
        // Nettoyer les anciens tokens expirés
        $this->cleanupExpiredTokens($user->id);

        // Limiter le nombre de sessions simultanées
        $this->limitUserSessions($user->id);

        // Générer l'access token avec claims personnalisés
        $customClaims = [
            'role' => $user->role,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'device_id' => $this->generateDeviceFingerprint($request),
            'session_id' => Str::uuid(),
        ];

        $accessToken = JWTAuth::customClaims($customClaims)->fromUser($user);
        $payload = JWTAuth::setToken($accessToken)->getPayload();
        $jti = $payload->get('jti');

        // Générer le refresh token
        $refreshTokenString = $this->generateSecureRefreshToken();

        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => Hash::make($refreshTokenString),
            'jti' => $jti,
            'expires_at' => now()->addDays(self::REFRESH_TOKEN_TTL_DAYS),
            'device_fingerprint' => $this->generateDeviceFingerprint($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshTokenString,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60, // en secondes
            'refresh_expires_in' => self::REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
            'user' => $user->only(['id', 'email', 'first_name', 'last_name', 'role']),
        ];
    }

    /**
     * Rafraîchit un access token en utilisant le refresh token
     */
    public function refreshToken(string $refreshTokenString, Request $request): array
    {
        // Rechercher le refresh token par hash
        $refreshToken = RefreshToken::valid()->get()->first(function ($token) use ($refreshTokenString) {
            return Hash::check($refreshTokenString, $token->token);
        });

        if (! $refreshToken) {
            throw new \Exception('Refresh token invalide ou expiré');
        }

        // Vérifier l'empreinte d'appareil pour sécurité supplémentaire
        $currentFingerprint = $this->generateDeviceFingerprint($request);
        if ($refreshToken->device_fingerprint !== $currentFingerprint) {
            $refreshToken->revoke();
            throw new \Exception('Appareil non reconnu');
        }

        $user = $refreshToken->user;

        // Révoquer l'ancien refresh token
        $refreshToken->revoke();

        // Générer une nouvelle paire de tokens
        return $this->generateTokenPair($user, $request);
    }

    /**
     * Révoque tous les tokens d'un utilisateur
     */
    public function revokeAllUserTokens(int $userId): void
    {
        RefreshToken::revokeAllUserTokens($userId);

        // Ajouter tous les JTI actifs à la blacklist
        $activeTokens = RefreshToken::byUser($userId)->get();
        foreach ($activeTokens as $token) {
            try {
                JWTAuth::setToken($token->jti)->invalidate();
            } catch (\Exception $e) {
                // Token déjà invalidé ou expiré
            }
        }
    }

    /**
     * Révoque un token spécifique
     */
    public function revokeToken(string $jti): void
    {
        RefreshToken::where('jti', $jti)->update(['revoked' => true]);

        try {
            JWTAuth::setToken($jti)->invalidate();
        } catch (\Exception $e) {
            // Token déjà invalidé
        }
    }

    /**
     * Valide un access token et vérifie sa sécurité
     */
    public function validateAccessToken(string $token, Request $request): array
    {
        try {
            JWTAuth::setToken($token);
            $payload = JWTAuth::getPayload();
            $user = JWTAuth::authenticate();

            if (! $user) {
                throw new \Exception('Utilisateur non trouvé');
            }

            // Vérifier si le refresh token associé est toujours valide
            $jti = $payload->get('jti');
            $refreshToken = RefreshToken::where('jti', $jti)->valid()->first();

            if (! $refreshToken) {
                throw new \Exception('Session expirée');
            }

            // Vérifier l'empreinte d'appareil si disponible
            $tokenDeviceId = $payload->get('device_id');
            $currentDeviceId = $this->generateDeviceFingerprint($request);

            if ($tokenDeviceId && $tokenDeviceId !== $currentDeviceId) {
                throw new \Exception('Appareil non reconnu');
            }

            return [
                'valid' => true,
                'user' => $user,
                'payload' => $payload->toArray(),
                'session_info' => $refreshToken->getDeviceInfo(),
            ];

        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Génère une empreinte d'appareil basée sur la requête
     */
    private function generateDeviceFingerprint(Request $request): string
    {
        $data = [
            'user_agent' => $request->userAgent(),
            'accept_language' => $request->header('Accept-Language'),
            'accept_encoding' => $request->header('Accept-Encoding'),
            'ip_class' => $this->getIpClass($request->ip()),
        ];

        return hash('sha256', serialize($data));
    }

    /**
     * Obtient la classe d'IP (pour IPv4, garde les 3 premiers octets)
     */
    private function getIpClass(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);

            return implode('.', array_slice($parts, 0, 3)).'.0';
        }

        // Pour IPv6, garder seulement le préfixe
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);

            return implode(':', array_slice($parts, 0, 4)).'::';
        }

        return 'unknown';
    }

    /**
     * Génère un refresh token sécurisé
     */
    private function generateSecureRefreshToken(): string
    {
        return Str::random(64).'.'.time().'.'.Str::random(32);
    }

    /**
     * Nettoie les tokens expirés
     */
    private function cleanupExpiredTokens(int $userId): void
    {
        RefreshToken::byUser($userId)->expired()->delete();
    }

    /**
     * Limite le nombre de sessions simultanées par utilisateur
     */
    private function limitUserSessions(int $userId): void
    {
        $activeTokensCount = RefreshToken::byUser($userId)->valid()->count();

        if ($activeTokensCount >= self::MAX_TOKENS_PER_USER) {
            // Supprimer les plus anciens tokens
            $oldestTokens = RefreshToken::byUser($userId)
                ->valid()
                ->orderBy('created_at')
                ->limit($activeTokensCount - self::MAX_TOKENS_PER_USER + 1)
                ->get();

            foreach ($oldestTokens as $token) {
                $token->revoke();
            }
        }
    }

    /**
     * Obtient les sessions actives d'un utilisateur
     */
    public function getActiveSessions(int $userId): array
    {
        $sessions = RefreshToken::byUser($userId)
            ->valid()
            ->orderBy('created_at', 'desc')
            ->get();

        return $sessions->map(function ($token) {
            return [
                'id' => $token->id,
                'device_fingerprint' => $token->device_fingerprint,
                'ip_address' => $token->ip_address,
                'user_agent' => $token->user_agent,
                'created_at' => $token->created_at,
                'expires_at' => $token->expires_at,
                'is_current' => false, // À déterminer par le contrôleur
            ];
        })->toArray();
    }

    /**
     * Révoque une session spécifique
     */
    public function revokeSession(int $userId, int $sessionId): bool
    {
        $token = RefreshToken::where('id', $sessionId)
            ->where('user_id', $userId)
            ->first();

        if ($token) {
            $this->revokeToken($token->jti);

            return true;
        }

        return false;
    }
}
