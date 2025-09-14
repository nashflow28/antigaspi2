<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class ApiAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // Vérifier le token JWT dans l'en-tête Authorization
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide ou utilisateur non trouvé'
                ], 401);
            }

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token manquant ou invalide',
                'error' => $e->getMessage()
            ], 401);
        }

        return $next($request);
    }
}