<?php

namespace App\Providers;

use App\Services\Payments\PaymentGatewayManager;
use App\Services\Payments\PaymentService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayManager::class, function ($app) {
            return new PaymentGatewayManager($app['config']->get('payments', []));
        });

        $this->app->singleton(PaymentService::class, function ($app) {
            return new PaymentService($app->make(PaymentGatewayManager::class));
        });
    }

    public function boot(): void
    {
        Gate::define('admin', function ($user) {
            return $user->role === 'admin';
        });
    }
}
