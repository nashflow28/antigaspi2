<?php

return [
    'currency' => env('PAYMENTS_CURRENCY', 'XOF'),

    'paygate' => [
        'base_url' => env('PAYGATE_BASE_URL', 'https://paygateglobal.com/api/v1'),
        'merchant_id' => env('PAYGATE_MERCHANT_ID'),
        'merchant_password' => env('PAYGATE_MERCHANT_PASSWORD'),
        'callback_url' => env('PAYGATE_CALLBACK_URL'),
        'services' => [
            'flooz' => env('PAYGATE_SERVICE_FLOOZ', 'FLOOZ'),
            'tmoney' => env('PAYGATE_SERVICE_TMONEY', 'TMONEY'),
        ],
    ],

    'paystack' => [
        'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'callback_url' => env('PAYSTACK_CALLBACK_URL'),
    ],
];
