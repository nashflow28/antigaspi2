<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

/**
 * Firebase Authentication Service
 * Verifies Firebase ID tokens using Google's public keys
 *
 * Note: This service uses REST API approach instead of kreait/firebase-php
 * due to dependency conflicts with lcobucci/jwt versions
 */
class FirebaseAuthService
{
    private const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    private const CACHE_KEY = 'firebase_google_certs';
    private const CACHE_TTL = 3600; // 1 hour

    private string $projectId;

    public function __construct()
    {
        $this->projectId = config('services.firebase.project_id');
    }

    /**
     * Verify a Firebase ID token and extract user information
     *
     * @param string $idToken The Firebase ID token to verify
     * @return array User information extracted from the token
     * @throws Exception If token is invalid or verification fails
     */
    public function verifyIdToken(string $idToken): array
    {
        try {
            // Get Google's public keys
            $publicKeys = $this->getGooglePublicKeys();

            // Decode token header to get the key ID (kid)
            $tokenParts = explode('.', $idToken);
            if (count($tokenParts) !== 3) {
                throw new Exception('Invalid token format');
            }

            $header = json_decode(base64_decode(strtr($tokenParts[0], '-_', '+/')), true);
            if (!isset($header['kid'])) {
                throw new Exception('Token header missing kid');
            }

            $kid = $header['kid'];
            if (!isset($publicKeys[$kid])) {
                throw new Exception('Unknown key ID');
            }

            // Verify and decode the token
            $decoded = JWT::decode($idToken, new Key($publicKeys[$kid], 'RS256'));

            // Verify issuer
            $expectedIssuer = 'https://securetoken.google.com/' . $this->projectId;
            if ($decoded->iss !== $expectedIssuer) {
                throw new Exception('Invalid token issuer');
            }

            // Verify audience
            if ($decoded->aud !== $this->projectId) {
                throw new Exception('Invalid token audience');
            }

            // Verify expiration
            if ($decoded->exp < time()) {
                throw new Exception('Token has expired');
            }

            // Verify auth_time
            if ($decoded->auth_time > time()) {
                throw new Exception('Invalid auth_time');
            }

            // Extract user information
            return [
                'uid' => $decoded->sub,
                'phone' => $decoded->phone_number ?? null,
                'email' => $decoded->email ?? null,
                'email_verified' => $decoded->email_verified ?? false,
                'name' => $decoded->name ?? null,
                'picture' => $decoded->picture ?? null,
                'provider_id' => $decoded->firebase->sign_in_provider ?? null,
            ];

        } catch (Exception $e) {
            Log::error('Firebase token verification failed', [
                'error' => $e->getMessage(),
                'project_id' => $this->projectId,
            ]);
            throw new Exception('Token Firebase invalide: ' . $e->getMessage());
        }
    }

    /**
     * Get Google's public keys for JWT verification
     * Keys are cached to avoid repeated HTTP requests
     *
     * @return array Array of public keys indexed by key ID
     * @throws Exception If unable to fetch keys
     */
    private function getGooglePublicKeys(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $response = Http::get(self::GOOGLE_CERTS_URL);

            if (!$response->successful()) {
                throw new Exception('Unable to fetch Google public keys');
            }

            return $response->json();
        });
    }

    /**
     * Clear cached Google public keys
     * Useful if keys have been rotated and cached version is stale
     */
    public function clearKeyCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
