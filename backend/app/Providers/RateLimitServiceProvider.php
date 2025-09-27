<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Rate limiting général pour l'API (60 requêtes par minute)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiting pour l'authentification - Plus permissif en testing
        RateLimiter::for('auth', function (Request $request) {
            // En mode test ou développement, permettre plus de requêtes
            $limit = app()->environment(['testing', 'local']) ? 100 : 5;
            return Limit::perMinute($limit)->by($request->ip());
        });

        // Rate limiting pour les endpoints sensibles admin (30 requêtes par minute)
        RateLimiter::for('admin', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiting pour la recherche et navigation (120 requêtes par minute)
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiting pour les actions de modification (20 requêtes par minute)
        RateLimiter::for('write', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiting global de sécurité (1000 requêtes par heure par IP)
        RateLimiter::for('global', function (Request $request) {
            $perMinute = app()->environment(['testing', 'local']) ? 500 : 200;
            return [
                Limit::perMinute($perMinute)->by($request->ip()),
                Limit::perHour(1000)->by($request->ip()),
            ];
        });
    }
}
