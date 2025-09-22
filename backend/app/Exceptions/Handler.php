<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Illuminate\Support\Facades\Log;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * Les types d'exceptions qui ne doivent pas être rapportées
     */
    protected $dontReport = [
        AuthenticationException::class,
        ValidationException::class,
        NotFoundHttpException::class,
        ModelNotFoundException::class,
        TokenExpiredException::class,
        TokenInvalidException::class,
    ];

    /**
     * Les inputs qui ne doivent jamais être flashés dans la session
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'wallet_pin',
        'pin',
        'cvv',
        'card_number',
    ];

    /**
     * Enregistrer les exceptions
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if ($this->shouldLogException($e)) {
                Log::error('Application Exception', [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => collect($e->getTrace())->take(5)->toArray(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                    'ip' => request()->ip(),
                    'user_id' => auth()->id(),
                ]);
            }
        });
    }

    /**
     * Convertir une exception en réponse JSON
     */
    public function render($request, Throwable $exception)
    {
        // Forcer les réponses JSON pour les routes API
        if ($request->is('api/*') || $request->wantsJson()) {
            return $this->handleApiException($request, $exception);
        }

        return parent::render($request, $exception);
    }

    /**
     * Gérer les exceptions API
     */
    private function handleApiException($request, Throwable $exception)
    {
        $response = [
            'success' => false,
            'message' => 'Une erreur est survenue',
        ];

        // Gestion spécifique par type d'exception
        if ($exception instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $exception->errors(),
            ], 422);
        }

        if ($exception instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
                'error' => 'unauthenticated',
            ], 401);
        }

        if ($exception instanceof TokenExpiredException) {
            return response()->json([
                'success' => false,
                'message' => 'Token expiré',
                'error' => 'token_expired',
            ], 401);
        }

        if ($exception instanceof TokenInvalidException) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide',
                'error' => 'token_invalid',
            ], 401);
        }

        if ($exception instanceof JWTException) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur d\'authentification',
                'error' => 'jwt_error',
            ], 401);
        }

        if ($exception instanceof ModelNotFoundException) {
            $model = strtolower(class_basename($exception->getModel()));
            return response()->json([
                'success' => false,
                'message' => "Ressource {$model} non trouvée",
                'error' => 'not_found',
            ], 404);
        }

        if ($exception instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Route non trouvée',
                'error' => 'route_not_found',
            ], 404);
        }

        if ($exception instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Méthode non autorisée',
                'error' => 'method_not_allowed',
                'allowed_methods' => $exception->getHeaders()['Allow'] ?? '',
            ], 405);
        }

        if ($exception instanceof TooManyRequestsHttpException) {
            $retryAfter = $exception->getHeaders()['Retry-After'] ?? 60;
            return response()->json([
                'success' => false,
                'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                'error' => 'rate_limit_exceeded',
                'retry_after' => $retryAfter,
            ], 429);
        }

        // En mode debug, afficher plus de détails
        if (config('app.debug')) {
            $response['debug'] = [
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => collect($exception->getTrace())->take(5)->toArray(),
            ];
        } else {
            // En production, message générique
            $response['message'] = $this->getProductionMessage($exception);
        }

        // Déterminer le code de statut HTTP
        $statusCode = $this->getStatusCode($exception);

        return response()->json($response, $statusCode);
    }

    /**
     * Déterminer si l'exception doit être loguée
     */
    private function shouldLogException(Throwable $exception): bool
    {
        // Ne pas logger les exceptions communes
        $dontLog = [
            ValidationException::class,
            NotFoundHttpException::class,
            ModelNotFoundException::class,
            AuthenticationException::class,
            TokenExpiredException::class,
        ];

        foreach ($dontLog as $type) {
            if ($exception instanceof $type) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtenir un message d'erreur approprié pour la production
     */
    private function getProductionMessage(Throwable $exception): string
    {
        // Messages personnalisés pour certains types d'erreurs
        $messages = [
            \PDOException::class => 'Erreur de base de données',
            \RuntimeException::class => 'Erreur d\'exécution',
            \LogicException::class => 'Erreur logique',
            \ErrorException::class => 'Erreur système',
        ];

        foreach ($messages as $class => $message) {
            if ($exception instanceof $class) {
                return $message;
            }
        }

        return 'Une erreur est survenue. Veuillez réessayer plus tard.';
    }

    /**
     * Obtenir le code de statut HTTP approprié
     */
    private function getStatusCode(Throwable $exception): int
    {
        if (method_exists($exception, 'getStatusCode')) {
            return $exception->getStatusCode();
        }

        $statusCodes = [
            ValidationException::class => 422,
            AuthenticationException::class => 401,
            ModelNotFoundException::class => 404,
            NotFoundHttpException::class => 404,
            MethodNotAllowedHttpException::class => 405,
            TooManyRequestsHttpException::class => 429,
            \PDOException::class => 503,
        ];

        foreach ($statusCodes as $class => $code) {
            if ($exception instanceof $class) {
                return $code;
            }
        }

        return 500;
    }
}