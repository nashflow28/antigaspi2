<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleApiRequests
{
    /**
     * Limites de taux par type d'endpoint
     */
    private const RATE_LIMITS = [
        'auth' => [
            'attempts' => 5,
            'decay' => 300, // 5 minutes
        ],
        'public' => [
            'attempts' => 60,
            'decay' => 60, // 1 minute
        ],
        'user' => [
            'attempts' => 100,
            'decay' => 60, // 1 minute
        ],
        'merchant' => [
            'attempts' => 200,
            'decay' => 60, // 1 minute
        ],
        'admin' => [
            'attempts' => 500,
            'decay' => 60, // 1 minute
        ],
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $type = 'public'): Response
    {
        $key = $this->resolveRequestSignature($request, $type);
        $maxAttempts = self::RATE_LIMITS[$type]['attempts'] ?? 60;
        $decaySeconds = self::RATE_LIMITS[$type]['decay'] ?? 60;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                'retry_after' => $seconds
            ], 429, [
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => now()->addSeconds($seconds)->timestamp,
                'Retry-After' => $seconds,
            ]);
        }

        RateLimiter::hit($key, $decaySeconds);

        $response = $next($request);

        // Ajouter les en-têtes de rate limit
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, $maxAttempts));
        $response->headers->set('X-RateLimit-Reset', RateLimiter::availableAt($key));

        return $response;
    }

    /**
     * Générer une signature unique pour la requête
     */
    private function resolveRequestSignature(Request $request, string $type): string
    {
        // Pour les endpoints d'authentification, limiter par IP
        if ($type === 'auth') {
            return sprintf('throttle:%s:%s', $type, $request->ip());
        }

        // Pour les utilisateurs authentifiés, limiter par utilisateur
        if ($request->user()) {
            return sprintf('throttle:%s:user:%d', $type, $request->user()->id);
        }

        // Pour les requêtes publiques, limiter par IP
        return sprintf('throttle:%s:%s:%s',
            $type,
            $request->ip(),
            $request->fingerprint()
        );
    }
}