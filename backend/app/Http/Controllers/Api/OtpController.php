<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class OtpController extends Controller
{
    private OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Send OTP to phone number
     *
     * @param Request $request
     * @return JsonResponse
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
                'errors' => $validator->errors()
            ], 422);
        }

        $phone = $request->input('phone');
        $purpose = $request->input('purpose', 'registration');

        $result = $this->otpService->sendOtp($phone, $purpose);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Verify OTP code
     *
     * @param Request $request
     * @return JsonResponse
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
                'errors' => $validator->errors()
            ], 422);
        }

        $phone = $request->input('phone');
        $otp = $request->input('otp');
        $purpose = $request->input('purpose', 'registration');

        $result = $this->otpService->verifyOtp($phone, $otp, $purpose);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Resend OTP (alias for send with same purpose)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resend(Request $request): JsonResponse
    {
        return $this->send($request);
    }

    /**
     * Check if phone is verified
     *
     * @param Request $request
     * @return JsonResponse
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
                'message' => $validator->errors()->first()
            ], 422);
        }

        $phone = $request->input('phone');
        $purpose = $request->input('purpose', 'registration');

        $isVerified = $this->otpService->isPhoneVerified($phone, $purpose);

        return response()->json([
            'success' => true,
            'data' => [
                'phone' => $phone,
                'verified' => $isVerified
            ]
        ]);
    }
}
