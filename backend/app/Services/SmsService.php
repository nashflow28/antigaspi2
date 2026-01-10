<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private string $apiUrl = 'http://smsvas.fr/api/sms';

    private ?string $token;

    private string $sender;

    public function __construct()
    {
        $this->token = config('services.sms.token');
        $this->sender = config('services.sms.sender', 'Antigaspi');
    }

    /**
     * Send SMS via SMS.TG API
     *
     * @param  string  $phone  Phone number with country code (e.g., 22891087733)
     * @param  string  $message  Message content
     * @return array{success: bool, message: string, data?: array}
     */
    public function send(string $phone, string $message): array
    {
        if (empty($this->token)) {
            Log::error('SMS Service: Token not configured');

            return [
                'success' => false,
                'message' => 'SMS service not configured',
            ];
        }

        // Normalize phone number (remove spaces, +, etc.)
        $phone = $this->normalizePhone($phone);

        try {
            $response = Http::timeout(30)->get($this->apiUrl, [
                'token' => $this->token,
                'to' => $phone,
                'text' => $message,
                'from' => $this->sender,
            ]);

            $responseBody = $response->body();

            Log::info('SMS sent', [
                'phone' => $this->maskPhone($phone),
                'status' => $response->status(),
                'response' => $responseBody,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'data' => [
                        'phone' => $phone,
                        'response' => $responseBody,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to send SMS: '.$responseBody,
            ];

        } catch (\Exception $e) {
            Log::error('SMS Service Error', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'SMS service error: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Send OTP SMS
     *
     * @param  string  $phone  Phone number
     * @param  string  $otp  OTP code
     */
    public function sendOtp(string $phone, string $otp): array
    {
        $message = "Votre code de verification Antigaspi est: {$otp}. Valide pendant 10 minutes.";

        return $this->send($phone, $message);
    }

    /**
     * Send reservation confirmation SMS
     *
     * @param  string  $phone  Phone number
     * @param  string  $reservationCode  Reservation code
     * @param  string  $merchantName  Merchant name
     */
    public function sendReservationConfirmation(string $phone, string $reservationCode, string $merchantName): array
    {
        $message = "Reservation {$reservationCode} confirmee! Rendez-vous chez {$merchantName} pour recuperer votre commande. - Antigaspi";

        return $this->send($phone, $message);
    }

    /**
     * Send pickup reminder SMS
     *
     * @param  string  $phone  Phone number
     * @param  string  $reservationCode  Reservation code
     * @param  string  $merchantName  Merchant name
     * @param  string  $pickupTime  Pickup time
     */
    public function sendPickupReminder(string $phone, string $reservationCode, string $merchantName, string $pickupTime): array
    {
        $message = "Rappel: Votre commande {$reservationCode} vous attend chez {$merchantName} jusqu'a {$pickupTime}. - Antigaspi";

        return $this->send($phone, $message);
    }

    /**
     * Normalize phone number for Togo
     * Accepts: +228XXXXXXXX, 228XXXXXXXX, 0XXXXXXXX, XXXXXXXX
     * Returns: 228XXXXXXXX
     */
    private function normalizePhone(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If starts with 00, remove it
        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        // If it's a local number (8 digits), add Togo country code
        if (strlen($phone) === 8) {
            $phone = '228'.$phone;
        }

        // If starts with 0 and is 9 digits, replace 0 with 228
        if (strlen($phone) === 9 && str_starts_with($phone, '0')) {
            $phone = '228'.substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Mask phone number for logging (privacy)
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) < 6) {
            return '***';
        }

        return substr($phone, 0, 5).'****'.substr($phone, -2);
    }

    /**
     * Check if SMS service is configured
     */
    public function isConfigured(): bool
    {
        return ! empty($this->token);
    }
}
