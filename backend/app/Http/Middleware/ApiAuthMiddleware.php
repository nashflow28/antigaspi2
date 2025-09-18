<?php

namespace App\Http\Middleware;

use App\Services\JwtSecurityService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApiAuthMiddleware
{
    private JwtSecurityService $jwtService;

    public function __construct(JwtSecurityService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function handle(Request $request, Closure $next, ...$permissions)
    {
        // Vérifier la présence du token
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorizedResponse('Token d\'authentification requis');
        }

        $token = substr($authHeader, 7);

        // Rate limiting par IP
        if ($this->isRateLimited($request)) {
            return $this->tooManyRequestsResponse();
        }

        // Valider le token avec le service de sécurité
        $validation = $this->jwtService->validateAccessToken($token, $request);

        if (!$validation['valid']) {
            // Log les tentatives d'authentification échouées
            $this->logFailedAuth($request, $validation['error']);

            return $this->unauthorizedResponse($validation['error']);
        }

        $user = $validation['user'];
        $payload = $validation['payload'];

        // Vérifier les permissions si spécifiées
        if (!empty($permissions) && !$this->hasPermissions($user, $permissions)) {
            return $this->forbiddenResponse('Permissions insuffisantes');
        }

        // Vérifier si le compte est actif
        if ($user->status !== 'active') {
            return $this->unauthorizedResponse('Compte suspendu ou inactif');
        }

        // Mettre à jour la dernière activité
        $this->updateLastActivity($user);

        // Ajouter les informations à la requête
        $request->merge([
            'auth_user' => $user,
            'auth_payload' => $payload,
            'auth_session' => $validation['session_info'],
        ]);

        return $next($request);
    }

    private function hasPermissions($user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            switch ($permission) {
                case 'admin':
                    if ($user->role !== 'admin') return false;
                    break;
                case 'merchant':
                    if (!in_array($user->role, ['admin', 'merchant'])) return false;
                    break;
                case 'consumer':
                    if (!in_array($user->role, ['admin', 'consumer'])) return false;
                    break;
                default:
                    // Permission personnalisée
                    if (!$user->hasPermission($permission)) return false;
                    break;
            }
        }
        return true;
    }

    private function isRateLimited(Request $request): bool
    {
        $key = 'rate_limit:auth:' . $request->ip();
        $attempts = Cache::get($key, 0);

        if ($attempts >= 60) { // 60 tentatives par minute
            return true;
        }

        Cache::put($key, $attempts + 1, 60);
        return false;
    }

    private function updateLastActivity($user): void
    {
        // Mise à jour asynchrone pour éviter de ralentir la requête
        Cache::put("user_last_activity:{$user->id}", now(), 3600);
    }

    private function logFailedAuth(Request $request, string $error): void
    {
        Log::warning('Failed authentication attempt', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'error' => $error,
            'url' => $request->fullUrl(),
            'timestamp' => now(),
        ]);
    }

    private function unauthorizedResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'code' => 'UNAUTHORIZED'
        ], 401);
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'code' => 'FORBIDDEN'
        ], 403);
    }

    private function tooManyRequestsResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Trop de tentatives. Veuillez réessayer plus tard.',
            'code' => 'RATE_LIMITED'
        ], 429);
    }
}