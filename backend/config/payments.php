<?php

return [
    'currency' => env('PAYMENTS_CURRENCY', 'XOF'),

    /*
    |--------------------------------------------------------------------------
    | PayGate Global Configuration (Togo Mobile Money)
    |--------------------------------------------------------------------------
    |
    | PayGate Global is the primary payment gateway for Flooz and TMoney
    | in Togo. It provides a simple API for mobile money payments.
    |
    | API Documentation: https://paygateglobal.com/guide
    |
    */
    'paygate' => [
        'base_url' => env('PAYGATE_BASE_URL', 'https://paygateglobal.com/api/v1'),
        'auth_token' => env('PAYGATE_AUTH_TOKEN'),
        'callback_url' => env('PAYGATE_CALLBACK_URL'),
        'networks' => [
            'flooz' => 'FLOOZ',
            'tmoney' => 'TMONEY',
        ],
        // Status codes from PayGate API
        'status_codes' => [
            'init_success' => 0,
            'init_invalid_token' => 2,
            'init_invalid_params' => 4,
            'init_duplicate' => 6,
            'payment_success' => 0,
            'payment_pending' => 2,
            'payment_expired' => 4,
            'payment_cancelled' => 6,
        ],
    ],

    'paystack' => [
        'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'callback_url' => env('PAYSTACK_CALLBACK_URL'),
    ],

    'fedapay' => [
        'base_url' => env('FEDAPAY_BASE_URL', 'https://api.fedapay.com/v1'),
        'api_key' => env('FEDAPAY_API_KEY'),
        'callback_url' => env('FEDAPAY_CALLBACK_URL'),
        'default_country' => env('FEDAPAY_DEFAULT_COUNTRY', 'TG'),
    ],

    'cinetpay' => [
        'base_url' => env('CINETPAY_BASE_URL', 'https://api-checkout.cinetpay.com/v2'),
        'api_key' => env('CINETPAY_API_KEY'),
        'site_id' => env('CINETPAY_SITE_ID'),
        'notify_url' => env('CINETPAY_NOTIFY_URL'),
        'return_url' => env('CINETPAY_RETURN_URL'),
        'callback_url' => env('CINETPAY_CALLBACK_URL'),
    ],
];
