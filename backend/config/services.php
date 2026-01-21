<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'vonage' => [
        'key' => env('VONAGE_KEY'),
        'secret' => env('VONAGE_SECRET'),
        'sms_from' => env('VONAGE_SMS_FROM', 'Antigaspi'),
    ],

    'webpush' => [
        'public_key' => env('WEB_PUSH_PUBLIC_KEY'),
        'private_key' => env('WEB_PUSH_PRIVATE_KEY'),
        'subject' => env('WEB_PUSH_SUBJECT', 'mailto:support@example.com'),
        'ttl' => env('WEB_PUSH_TTL', 900),
    ],

    'expo' => [
        'access_token' => env('EXPO_ACCESS_TOKEN'),
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS.TG (smsvas.fr) - SMS Service for Togo
    |--------------------------------------------------------------------------
    */
    'sms' => [
        'token' => env('SMS_TG_TOKEN'),
        'sender' => env('SMS_TG_SENDER', 'Antigaspi'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Test/Demo Accounts - OTP Bypass
    |--------------------------------------------------------------------------
    | Phone numbers in this list will:
    | - NOT receive actual SMS (bypass SMS sending)
    | - Accept fixed OTP code: 123456
    | Format: normalized phone numbers (e.g., 22899000001)
    */
    'test_phones' => [
        // Admin
        '22899000001', // Admin System

        // Merchants (Commerçants)
        '22890854244', // Pierre Martin - Boulangerie
        '745678901',   // Bella Traoré - Superette (CI)
        '756789012',   // Aminata Ouattara - Restaurant (CI)
        '22890868657', // Yao N'Guessan - Marché
        '778901234',   // Koffi Brou - Patisserie (CI)
        '22896352414', // Bonobo SEXY

        // Consumers (Consommateurs)
        '22899000002', // Jean Dupont
        '701234567',   // Marie Kouamé (CI)
        '712345678',   // Ibrahim Koné (CI)
        '723456789',   // Fatou Diallo (CI)
        '734567890',   // Kofi Asante (CI)
        '22896854123', // Kaled YERIMA
        '22896587423', // Dieudo TEST
        '22899999999', // Test TEST
        '22891234567', // Test User
    ],

];
