<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private channel for user-specific notifications
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for merchant dashboard updates
Broadcast::channel('merchant.{merchantId}', function ($user, $merchantId) {
    return $user->role === 'merchant' &&
           $user->merchant &&
           (int) $user->merchant->id === (int) $merchantId;
});

// Private channel for admin updates
Broadcast::channel('admin', function ($user) {
    return $user->role === 'admin';
});
