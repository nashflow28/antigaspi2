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

/**
 * DeviceAuthController - Handles phone-based authentication with device tracking
 *
 * Flow:
 * 1. User enters phone number
 * 2. Check if user exists and if device is known
 * 3. If new device or OTP expired -> require OTP
 * 4. If known device with valid OTP -> require PIN
 * 5. After successful login -> deactivate other devices (single session)
 */
class DeviceAuthController extends Controller
{
    private OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Step 1: Check phone number and determine auth method
     *
     * Returns:
     * - user_exists: false -> Need to register
     * - requires_otp: true -> Need OTP verification
     * - requires_pin: true -> Can use PIN
     */
    public function checkPhone(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'device_id' => 'required|string|max:100',
            'device_info' => 'sometimes|array',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
            'device_id.required' => 'L\'identifiant de l\'appareil est requis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $this->normalizePhone($request->phone);
        $deviceId = $request->device_id;

        // Find user by phone
        $user = $this->findUserByPhone($phone);

        if (! $user) {
            // User doesn't exist - need to register
            return response()->json([
                'success' => true,
                'data' => [
                    'user_exists' => false,
                    'requires_otp' => true,
                    'requires_pin' => false,
                    'has_pin' => false,
                    'message' => 'Nouveau numéro. Veuillez vous inscrire.',
                ],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte a été désactivé.',
            ], 403);
        }

        // Check if this device is known for this user
        $device = $user->devices()->where('device_id', $deviceId)->first();

        if (! $device) {
            // New device - require OTP
            return response()->json([
                'success' => true,
                'data' => [
                    'user_exists' => true,
                    'requires_otp' => true,
                    'requires_pin' => false,
                    'has_pin' => $user->hasPin(),
                    'message' => 'Nouvel appareil détecté. Vérification OTP requise.',
                ],
            ]);
        }

        // Device exists - check if OTP verification is still valid
        if ($device->requiresOtp()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'user_exists' => true,
                    'requires_otp' => true,
                    'requires_pin' => false,
                    'has_pin' => $user->hasPin(),
                    'message' => 'Vérification OTP expirée. Nouvelle vérification requise.',
                ],
            ]);
        }

        // Device is valid and OTP not expired
        if (! $user->hasPin()) {
            // User doesn't have PIN set yet - require OTP to set one
            return response()->json([
                'success' => true,
                'data' => [
                    'user_exists' => true,
                    'requires_otp' => true,
                    'requires_pin' => false,
                    'has_pin' => false,
                    'message' => 'Veuillez configurer votre code PIN.',
                ],
            ]);
        }

        // All good - user can login with PIN
        return response()->json([
            'success' => true,
            'data' => [
                'user_exists' => true,
                'requires_otp' => false,
                'requires_pin' => true,
                'has_pin' => true,
                'message' => 'Veuillez entrer votre code PIN.',
            ],
        ]);
    }

    /**
     * Step 2a: Send OTP for verification
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = $this->normalizePhone($request->phone);
        $result = $this->otpService->sendOtp($phone, 'login');

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Step 2b: Verify OTP and login (for new device or expired OTP)
     */
    public function verifyOtpAndLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'otp' => 'required|string|size:6',
            'device_id' => 'required|string|max:100',
            'device_info' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = $this->normalizePhone($request->phone);
        $deviceId = $request->device_id;
        $deviceInfo = $request->device_info ?? [];

        // Verify OTP
        $otpResult = $this->otpService->verifyOtp($phone, $request->otp, 'login');

        if (! $otpResult['success']) {
            return response()->json($otpResult, 400);
        }

        // Find user
        $user = $this->findUserByPhone($phone);

        if (! $user) {
            // OTP verified but user doesn't exist - need registration
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'new_user',
                    'phone' => $phone,
                    'requires_registration' => true,
                    'message' => 'Numéro vérifié. Veuillez créer votre compte.',
                ],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte a été désactivé.',
            ], 403);
        }

        // Get or create device record
        $device = $user->getOrCreateDevice($deviceId, array_merge($deviceInfo, [
            'ip_address' => $request->ip(),
        ]));

        // Mark OTP as verified for this device
        $device->markOtpVerified();

        // Deactivate other devices (enforce single session)
        $user->deactivateOtherDevices($deviceId);

        // Clear OTP verification
        $this->otpService->clearVerification($phone, 'login');

        // Generate JWT token
        $token = JWTAuth::fromUser($user);

        Log::info('OTP login successful', [
            'user_id' => $user->id,
            'device_id' => substr($deviceId, 0, 10).'...',
            'phone' => $this->maskPhone($phone),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'success',
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'has_pin' => $user->hasPin(),
                'requires_pin_setup' => ! $user->hasPin(),
            ],
        ]);
    }

    /**
     * Step 3: Login with PIN (for known device with valid OTP)
     */
    public function loginWithPin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'pin' => 'required|string|size:4',
            'device_id' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $phone = $this->normalizePhone($request->phone);
        $deviceId = $request->device_id;

        // Find user
        $user = $this->findUserByPhone($phone);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Numéro de téléphone non reconnu.',
            ], 404);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte a été désactivé.',
            ], 403);
        }

        // Check device
        $device = $user->devices()->where('device_id', $deviceId)->first();

        if (! $device || $device->requiresOtp()) {
            return response()->json([
                'success' => false,
                'message' => 'Vérification OTP requise pour cet appareil.',
                'data' => [
                    'requires_otp' => true,
                ],
            ], 401);
        }

        // Verify PIN
        if (! $user->verifyPin($request->pin)) {
            return response()->json([
                'success' => false,
                'message' => 'Code PIN incorrect.',
            ], 401);
        }

        // Update device last login
        $device->touchLastLogin();

        // Deactivate other devices (enforce single session)
        $user->deactivateOtherDevices($deviceId);

        // Generate JWT token
        $token = JWTAuth::fromUser($user);

        Log::info('PIN login successful', [
            'user_id' => $user->id,
            'device_id' => substr($deviceId, 0, 10).'...',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'success',
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ],
        ]);
    }

    /**
     * Set PIN after OTP verification
     */
    public function setPin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|size:4|regex:/^[0-9]+$/',
            'pin_confirmation' => 'required|same:pin',
        ], [
            'pin.required' => 'Le code PIN est requis',
            'pin.size' => 'Le code PIN doit contenir 4 chiffres',
            'pin.regex' => 'Le code PIN ne doit contenir que des chiffres',
            'pin_confirmation.same' => 'Les codes PIN ne correspondent pas',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $user->setPin($request->pin);

        Log::info('PIN set successfully', [
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Code PIN configuré avec succès.',
        ]);
    }

    /**
     * Change PIN (requires current PIN)
     */
    public function changePin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_pin' => 'required|string|size:4',
            'new_pin' => 'required|string|size:4|regex:/^[0-9]+$/',
            'new_pin_confirmation' => 'required|same:new_pin',
        ], [
            'current_pin.required' => 'Le code PIN actuel est requis',
            'new_pin.required' => 'Le nouveau code PIN est requis',
            'new_pin.size' => 'Le code PIN doit contenir 4 chiffres',
            'new_pin.regex' => 'Le code PIN ne doit contenir que des chiffres',
            'new_pin_confirmation.same' => 'Les codes PIN ne correspondent pas',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();

        if (! $user->verifyPin($request->current_pin)) {
            return response()->json([
                'success' => false,
                'message' => 'Code PIN actuel incorrect.',
            ], 401);
        }

        $user->setPin($request->new_pin);

        return response()->json([
            'success' => true,
            'message' => 'Code PIN modifié avec succès.',
        ]);
    }

    /**
     * Logout and deactivate device
     */
    public function logout(Request $request): JsonResponse
    {
        $user = auth()->user();
        $deviceId = $request->device_id;

        if ($user && $deviceId) {
            $device = $user->devices()->where('device_id', $deviceId)->first();
            if ($device) {
                $device->deactivate();
            }
        }

        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            // Token might already be invalid
        }

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * Link phone number to existing account (for email-registered users)
     * Step 1: Send OTP to the new phone
     */
    public function sendLinkPhoneOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = auth()->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $phone = $this->normalizePhone($request->phone);

        // Check if phone is already used by another user
        $existingUser = $this->findUserByPhone($phone);
        if ($existingUser && $existingUser->id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ce numéro est déjà associé à un autre compte.',
            ], 409);
        }

        // Send OTP for phone linking
        $result = $this->otpService->sendOtp($phone, 'phone_change');

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Link phone number to existing account (for email-registered users)
     * Step 2: Verify OTP and link phone
     */
    public function verifyAndLinkPhone(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:8|max:20',
            'otp' => 'required|string|size:6',
            'device_id' => 'required|string|max:100',
            'device_info' => 'sometimes|array',
        ], [
            'phone.required' => 'Le numéro de téléphone est requis',
            'otp.required' => 'Le code de vérification est requis',
            'otp.size' => 'Le code de vérification doit contenir 6 chiffres',
            'device_id.required' => 'L\'identifiant de l\'appareil est requis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = auth()->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $phone = $this->normalizePhone($request->phone);
        $deviceId = $request->device_id;
        $deviceInfo = $request->device_info ?? [];

        // Verify OTP
        $otpResult = $this->otpService->verifyOtp($phone, $request->otp, 'phone_change');

        if (! $otpResult['success']) {
            return response()->json($otpResult, 400);
        }

        // Check again if phone is already used
        $existingUser = $this->findUserByPhone($phone);
        if ($existingUser && $existingUser->id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ce numéro est déjà associé à un autre compte.',
            ], 409);
        }

        // Update user's phone number
        $user->phone = $phone;
        $user->phone_verified_at = now();
        $user->save();

        // Create/update device record
        $device = $user->getOrCreateDevice($deviceId, array_merge($deviceInfo, [
            'ip_address' => $request->ip(),
        ]));

        // Mark OTP as verified for this device
        $device->markOtpVerified();

        // Clear OTP verification
        $this->otpService->clearVerification($phone, 'phone_change');

        Log::info('Phone linked to account', [
            'user_id' => $user->id,
            'phone' => $this->maskPhone($phone),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Numéro de téléphone lié avec succès.',
            'data' => [
                'user' => $this->formatUser($user->fresh()),
                'has_pin' => $user->hasPin(),
                'requires_pin_setup' => ! $user->hasPin(),
            ],
        ]);
    }

    /**
     * Get user's devices
     */
    public function getDevices(): JsonResponse
    {
        $user = auth()->user();

        $devices = $user->devices()->orderBy('last_login_at', 'desc')->get()->map(function ($device) use ($user) {
            return [
                'id' => $device->id,
                'device_name' => $device->device_name ?? 'Appareil inconnu',
                'device_model' => $device->device_model,
                'device_type' => $device->device_type,
                'last_login_at' => $device->last_login_at?->toISOString(),
                'is_current' => $user->current_device_id === $device->device_id,
                'is_active' => $device->is_active,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $devices,
        ]);
    }

    /**
     * Revoke a specific device
     */
    public function revokeDevice(Request $request, int $deviceId): JsonResponse
    {
        $user = auth()->user();
        $device = $user->devices()->find($deviceId);

        if (! $device) {
            return response()->json([
                'success' => false,
                'message' => 'Appareil non trouvé.',
            ], 404);
        }

        $device->deactivate();

        return response()->json([
            'success' => true,
            'message' => 'Appareil révoqué avec succès.',
        ]);
    }

    // Helper methods

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        if (strlen($phone) === 8) {
            $phone = '228'.$phone;
        }

        if (strlen($phone) === 9 && str_starts_with($phone, '0')) {
            $phone = '228'.substr($phone, 1);
        }

        return $phone;
    }

    private function findUserByPhone(string $phone): ?User
    {
        return User::where('phone', $phone)
            ->orWhere('phone', '+'.$phone)
            ->orWhere('phone', 'LIKE', '%'.substr($phone, -8))
            ->first();
    }

    private function maskPhone(string $phone): string
    {
        if (strlen($phone) < 6) {
            return '***';
        }

        return substr($phone, 0, 5).'****'.substr($phone, -2);
    }

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
            'has_pin' => $user->hasPin(),
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
}
