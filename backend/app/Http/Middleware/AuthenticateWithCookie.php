<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class AuthenticateWithCookie
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            // Essayer d'abord de récupérer le token depuis le cookie
            $token = $request->cookie('access_token');

            // Si pas de cookie, essayer l'en-tête Authorization (pour compatibilité)
            if (!$token) {
                $authHeader = $request->header('Authorization');
                if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                    $token = substr($authHeader, 7);
                }
            }

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token non fourni'
                ], 401);
            }

            // Vérifier et authentifier l'utilisateur
            $user = JWTAuth::setToken($token)->authenticate();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            // Vérifier que le compte est actif
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé'
                ], 403);
            }

            // Ajouter l'utilisateur à la requête
            $request->merge(['auth_user' => $user]);
            $request->setUserResolver(function () use ($user) {
                return $user;
            });

        } catch (TokenExpiredException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token expiré',
                'error' => 'token_expired'
            ], 401);

        } catch (TokenInvalidException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide',
                'error' => 'token_invalid'
            ], 401);

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token absent',
                'error' => 'token_absent'
            ], 401);
        }

        return $next($request);
    }
}