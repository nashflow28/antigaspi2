<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// BUG FIX #21: Schedule daily cleanup of expired JWT refresh tokens
// Runs every day at 2:00 AM to prevent token table bloat
Schedule::command('tokens:clean-expired')->daily()->at('02:00');
