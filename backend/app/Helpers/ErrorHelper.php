<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

class ErrorHelper
{
    /**
     * Return a safe error message for API responses.
     *
     * In debug mode, returns the actual exception message for development.
     * In production, returns the fallback message and logs the real error.
     */
    public static function safeMessage(\Throwable $e, string $fallback = 'Une erreur est survenue'): string
    {
        if (config('app.debug')) {
            return $e->getMessage();
        }

        Log::error($fallback, [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile().':'.$e->getLine(),
        ]);

        return $fallback;
    }

    /**
     * Classify an exception into a safe, user-facing error category.
     *
     * Maps internal exception types to semantic categories that the frontend
     * can use to display localized messages without exposing implementation details.
     *
     * @return string One of: 'validation', 'not_found', 'permission', 'payment', 'conflict', 'rate_limit', 'server'
     */
    public static function classifyException(\Throwable $e): string
    {
        // Validation errors (user input issues)
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return 'validation';
        }

        // Resource not found
        if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
            || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
            return 'not_found';
        }

        // Permission / authorization denied
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException
            || $e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            return 'permission';
        }

        // Authentication failures
        if ($e instanceof \Illuminate\Auth\AuthenticationException
            || $e instanceof \Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException) {
            return 'auth';
        }

        // Rate limiting
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException
            || $e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
            return 'rate_limit';
        }

        // Payment-specific errors
        if ($e instanceof \App\Services\Payments\Exceptions\PaymentException) {
            return 'payment';
        }

        // Database constraint violations (duplicates, FK, etc.)
        if ($e instanceof \Illuminate\Database\QueryException) {
            $sqlState = $e->errorInfo[0] ?? null;

            return match ($sqlState) {
                '23000' => 'conflict',   // Integrity constraint (duplicate entry, FK violation)
                '22001' => 'validation', // Data too long for column
                '22003' => 'validation', // Numeric value out of range
                default => 'server',
            };
        }

        // Everything else is a server error
        return 'server';
    }

    /**
     * Return a safe, classified error response array.
     *
     * Combines safeMessage() and classifyException() for a complete
     * production-safe error response payload.
     *
     * Usage in controllers:
     *   return response()->json(ErrorHelper::safeResponse($e, 'Erreur lors de la création'), 500);
     */
    public static function safeResponse(\Throwable $e, string $fallback = 'Une erreur est survenue'): array
    {
        return [
            'success' => false,
            'message' => self::safeMessage($e, $fallback),
            'error_type' => self::classifyException($e),
        ];
    }
}
