<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;

trait CreatesApplication
{
    public function createApplication()
    {
        $app = require __DIR__ . '/../bootstrap/app.php';

        if (method_exists($app, 'loadEnvironmentFrom') && file_exists(__DIR__ . '/../.env.example')) {
            $app->loadEnvironmentFrom('.env.example');
        }

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
