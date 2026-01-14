<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class OtpController extends Controller
{
    private OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Format user data for response
     */
    private function formatUser(User $user): array
    {
        $user->loadMissing('merchant');

        $userData = [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'address' => $user->address,
            'photo_url' => $user->photo_url,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        if ($user->role === 'merchant' && $user->merchant) {
            $userData['merchant'] = [
                'id' => $user->merchant->id,
                'business_name' => $user->merchant->business_name,
                'business_type' => $user->merchant->business_type,
                'description' => $user->merchant->description,
                'is_verified' => $user->merchant->is_verified,
            ];
        }

        return $userData;
    }

    /**
     * Send OTP to phone number
     */
    public function send(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'purpose' => 'sometimes|string|in:registration,login,password_reset,phone_change',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
            'phone.min' => 'Le numéro de téléphone doit contenir au moins 8 chiffres',
            'phone.max' => 'Le numéro de téléphone est trop long',
            'purpose.in' => 'But de vérification invalide',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $purpose = $request->input('purpose', 'registration');

        $result = $this->otpService->sendOtp($phone, $purpose);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Verify OTP code
     */
    public function verify(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'otp' => 'required|string|size:6',
            'purpose' => 'sometimes|string|in:registration,login,password_reset,phone_change',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
            'otp.required' => 'Le code de vérification est requis',
            'otp.size' => 'Le code de vérification doit contenir 6 chiffres',
            'purpose.in' => 'But de vérification invalide',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $otp = $request->input('otp');
        $purpose = $request->input('purpose', 'registration');

        $result = $this->otpService->verifyOtp($phone, $otp, $purpose);

        // If verification failed, return error
        if (! $result['success']) {
            return response()->json($result, 400);
        }

        // If purpose is login, find user and generate JWT token
        if ($purpose === 'login') {
            // Normalize phone for user lookup
            $normalizedPhone = $this->normalizePhone($phone);

            // Find user by phone (check multiple formats)
            $user = User::where('phone', $normalizedPhone)
                ->orWhere('phone', '+'.$normalizedPhone)
                ->orWhere('phone', 'LIKE', '%'.substr($normalizedPhone, -8))
                ->first();

            if (! $user) {
                // OTP was verified successfully, but no user exists with this phone
                // Return success: true so mobile knows OTP verification worked
                return response()->json([
                    'success' => true,
                    'message' => 'Numéro vérifié. Veuillez créer votre compte.',
                    'data' => [
                        'phone' => $phone,
                        'verified' => true,
                        'user_exists' => false,
                    ],
                ], 200);
            }

            if (! $user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé',
                ], 403);
            }

            // Generate JWT token
            $token = JWTAuth::fromUser($user);

            Log::info('OTP Login successful', [
                'user_id' => $user->id,
                'phone' => substr($phone, 0, 5).'****',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);
        }

        // For other purposes (registration, password_reset, etc.), just return verification success
        return response()->json($result);
    }

    /**
     * Normalize phone number for lookup
     */
    private function normalizePhone(string $phone): string
    {
        // Remove non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Remove leading 00 if present
        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        // Add Togo country code if phone is 8 digits
        if (strlen($phone) === 8) {
            $phone = '228'.$phone;
        }

        // Handle 9 digit numbers starting with 0
        if (strlen($phone) === 9 && str_starts_with($phone, '0')) {
            $phone = '228'.substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Resend OTP (alias for send with same purpose)
     */
    public function resend(Request $request): JsonResponse
    {
        return $this->send($request);
    }

    /**
     * Check if phone is verified
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'purpose' => 'sometimes|string|in:registration,login,password_reset,phone_change',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = $request->input('phone');
        $purpose = $request->input('purpose', 'registration');

        $isVerified = $this->otpService->isPhoneVerified($phone, $purpose);

        return response()->json([
            'success' => true,
            'data' => [
                'phone' => $phone,
                'verified' => $isVerified,
            ],
        ]);
    }
}
