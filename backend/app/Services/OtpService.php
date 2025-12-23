<?php

namespace App\Services;

use App\Models\OtpVerification;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OtpService
{
    private SmsService $smsService;

    // OTP configuration
    private int $otpLength = 6;
    private int $expirationMinutes = 10;
    private int $maxAttempts = 3;
    private int $resendCooldownSeconds = 60;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Generate and send OTP to phone number
     *
     * @param string $phone Phone number
     * @param string $purpose Purpose of OTP (registration, login, password_reset, phone_change)
     * @return array{success: bool, message: string, data?: array}
     */
    public function sendOtp(string $phone, string $purpose = 'registration'): array
    {
        $phone = $this->normalizePhone($phone);

        // Check for existing non-expired OTP (cooldown)
        $existingOtp = OtpVerification::where('phone', $phone)
            ->where('purpose', $purpose)
            ->where('expires_at', '>', now())
            ->whereNull('verified_at')
            ->first();

        if ($existingOtp) {
            $createdAt = Carbon::parse($existingOtp->created_at);
            $cooldownEnds = $createdAt->addSeconds($this->resendCooldownSeconds);

            if (now()->lt($cooldownEnds)) {
                $remainingSeconds = now()->diffInSeconds($cooldownEnds);
                return [
                    'success' => false,
                    'message' => "Veuillez attendre {$remainingSeconds} secondes avant de renvoyer un code",
                    'data' => [
                        'cooldown_remaining' => $remainingSeconds
                    ]
                ];
            }

            // Delete old OTP if cooldown passed
            $existingOtp->delete();
        }

        // Generate new OTP
        $otp = $this->generateOtp();

        // Store OTP in database
        $otpRecord = OtpVerification::create([
            'phone' => $phone,
            'otp' => $this->hashOtp($otp),
            'purpose' => $purpose,
            'attempts' => 0,
            'expires_at' => now()->addMinutes($this->expirationMinutes),
        ]);

        // Send OTP via SMS
        $smsResult = $this->smsService->sendOtp($phone, $otp);

        if (!$smsResult['success']) {
            // Delete OTP record if SMS failed
            $otpRecord->delete();

            Log::error('Failed to send OTP SMS', [
                'phone' => $this->maskPhone($phone),
                'error' => $smsResult['message']
            ]);

            return [
                'success' => false,
                'message' => 'Impossible d\'envoyer le SMS. Veuillez réessayer.'
            ];
        }

        Log::info('OTP sent successfully', [
            'phone' => $this->maskPhone($phone),
            'purpose' => $purpose
        ]);

        return [
            'success' => true,
            'message' => 'Code de vérification envoyé par SMS',
            'data' => [
                'phone' => $phone,
                'expires_in' => $this->expirationMinutes * 60, // seconds
                'resend_cooldown' => $this->resendCooldownSeconds
            ]
        ];
    }

    /**
     * Verify OTP code
     *
     * @param string $phone Phone number
     * @param string $otp OTP code entered by user
     * @param string $purpose Purpose of OTP
     * @return array{success: bool, message: string, data?: array}
     */
    public function verifyOtp(string $phone, string $otp, string $purpose = 'registration'): array
    {
        $phone = $this->normalizePhone($phone);

        // Find valid OTP record
        $otpRecord = OtpVerification::where('phone', $phone)
            ->where('purpose', $purpose)
            ->where('expires_at', '>', now())
            ->whereNull('verified_at')
            ->first();

        if (!$otpRecord) {
            return [
                'success' => false,
                'message' => 'Code expiré ou invalide. Veuillez demander un nouveau code.'
            ];
        }

        // Check max attempts
        if ($otpRecord->attempts >= $this->maxAttempts) {
            $otpRecord->delete();
            return [
                'success' => false,
                'message' => 'Trop de tentatives. Veuillez demander un nouveau code.'
            ];
        }

        // Verify OTP
        if (!$this->verifyOtpHash($otp, $otpRecord->otp)) {
            $otpRecord->increment('attempts');
            $remainingAttempts = $this->maxAttempts - $otpRecord->attempts;

            return [
                'success' => false,
                'message' => "Code incorrect. {$remainingAttempts} tentative(s) restante(s).",
                'data' => [
                    'remaining_attempts' => $remainingAttempts
                ]
            ];
        }

        // Mark as verified
        $otpRecord->update([
            'verified_at' => now()
        ]);

        Log::info('OTP verified successfully', [
            'phone' => $this->maskPhone($phone),
            'purpose' => $purpose
        ]);

        return [
            'success' => true,
            'message' => 'Numéro de téléphone vérifié avec succès',
            'data' => [
                'phone' => $phone,
                'verified' => true
            ]
        ];
    }

    /**
     * Check if phone is verified (has recent verified OTP)
     *
     * @param string $phone Phone number
     * @param string $purpose Purpose
     * @param int $validForMinutes How long the verification is considered valid
     * @return bool
     */
    public function isPhoneVerified(string $phone, string $purpose = 'registration', int $validForMinutes = 30): bool
    {
        $phone = $this->normalizePhone($phone);

        return OtpVerification::where('phone', $phone)
            ->where('purpose', $purpose)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>', now()->subMinutes($validForMinutes))
            ->exists();
    }

    /**
     * Clean up expired OTPs (for scheduled task)
     */
    public function cleanupExpiredOtps(): int
    {
        return OtpVerification::where('expires_at', '<', now()->subHours(24))
            ->delete();
    }

    /**
     * Generate random OTP code
     */
    private function generateOtp(): string
    {
        $otp = '';
        for ($i = 0; $i < $this->otpLength; $i++) {
            $otp .= random_int(0, 9);
        }
        return $otp;
    }

    /**
     * Hash OTP for secure storage
     */
    private function hashOtp(string $otp): string
    {
        return hash('sha256', $otp . config('app.key'));
    }

    /**
     * Verify OTP against hash
     */
    private function verifyOtpHash(string $otp, string $hash): bool
    {
        return hash_equals($hash, $this->hashOtp($otp));
    }

    /**
     * Normalize phone number
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        if (strlen($phone) === 8) {
            $phone = '228' . $phone;
        }

        if (strlen($phone) === 9 && str_starts_with($phone, '0')) {
            $phone = '228' . substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Mask phone for logging
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) < 6) {
            return '***';
        }
        return substr($phone, 0, 5) . '****' . substr($phone, -2);
    }
}
