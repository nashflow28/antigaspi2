<?php

namespace Tests\Unit;

use App\Models\OtpVerification;
use App\Services\OtpService;
use App\Services\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class OtpServiceTest extends TestCase
{
    use RefreshDatabase;

    private OtpService $otpService;

    private $smsServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock SmsService to avoid actual SMS sending
        $this->smsServiceMock = Mockery::mock(SmsService::class);
        $this->app->instance(SmsService::class, $this->smsServiceMock);

        $this->otpService = new OtpService($this->smsServiceMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // ==================== OTP GENERATION TESTS ====================

    public function test_send_otp_generates_6_digit_code(): void
    {
        $this->smsServiceMock
            ->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $otp) {
                return strlen($otp) === 6 && is_numeric($otp);
            })
            ->andReturn(['success' => true]);

        $result = $this->otpService->sendOtp('22891000000', 'registration');

        $this->assertTrue($result['success']);
        $this->assertDatabaseHas('otp_verifications', [
            'phone' => '22891000000',
            'purpose' => 'registration',
        ]);
    }

    public function test_send_otp_stores_hashed_code(): void
    {
        $this->smsServiceMock
            ->shouldReceive('sendOtp')
            ->once()
            ->andReturn(['success' => true]);

        $this->otpService->sendOtp('22891000000', 'registration');

        $otpRecord = OtpVerification::where('phone', '22891000000')->first();

        $this->assertNotNull($otpRecord);
        // OTP should be hashed (not 6 chars)
        $this->assertGreaterThan(6, strlen($otpRecord->otp));
    }

    public function test_send_otp_sets_expiration_time(): void
    {
        $this->smsServiceMock
            ->shouldReceive('sendOtp')
            ->once()
            ->andReturn(['success' => true]);

        $this->otpService->sendOtp('22891000000', 'registration');

        $otpRecord = OtpVerification::where('phone', '22891000000')->first();

        $this->assertNotNull($otpRecord->expires_at);
        // Should expire in about 10 minutes
        $this->assertTrue($otpRecord->expires_at->isFuture());
        $this->assertTrue($otpRecord->expires_at->diffInMinutes(now()) <= 10);
    }

    // ==================== OTP VERIFICATION TESTS ====================

    public function test_verify_otp_succeeds_with_correct_code(): void
    {
        // Create OTP directly in database with known value
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $result = $this->otpService->verifyOtp('22891000000', $plainOtp, 'registration');

        $this->assertTrue($result['success']);
    }

    public function test_verify_otp_fails_with_wrong_code(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $result = $this->otpService->verifyOtp('22891000000', '000000', 'registration');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('incorrect', strtolower($result['message']));
    }

    public function test_verify_otp_fails_when_expired(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->subMinutes(1), // Already expired
            'attempts' => 0,
        ]);

        $result = $this->otpService->verifyOtp('22891000000', $plainOtp, 'registration');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('expir', strtolower($result['message']));
    }

    public function test_verify_otp_increments_attempts(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        // Failed attempt
        $this->otpService->verifyOtp('22891000000', '000000', 'registration');

        $otpRecord = OtpVerification::where('phone', '22891000000')->first();
        $this->assertEquals(1, $otpRecord->attempts);
    }

    public function test_verify_otp_blocks_after_max_attempts(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 3, // Max attempts reached
        ]);

        $result = $this->otpService->verifyOtp('22891000000', $plainOtp, 'registration');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('tentative', strtolower($result['message']));
    }

    public function test_verify_otp_marks_verified_at_on_success(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $this->otpService->verifyOtp('22891000000', $plainOtp, 'registration');

        $otpRecord = OtpVerification::where('phone', '22891000000')->first();
        $this->assertNotNull($otpRecord->verified_at);
    }

    // ==================== PURPOSE SEPARATION TESTS ====================

    public function test_otp_verification_respects_purpose(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        // Try to verify with different purpose
        $result = $this->otpService->verifyOtp('22891000000', $plainOtp, 'login');

        $this->assertFalse($result['success']);
    }

    // ==================== COOLDOWN TESTS ====================

    public function test_send_otp_enforces_cooldown(): void
    {
        $this->smsServiceMock
            ->shouldReceive('sendOtp')
            ->once()
            ->andReturn(['success' => true]);

        // First send should succeed
        $result1 = $this->otpService->sendOtp('22891000000', 'registration');
        $this->assertTrue($result1['success']);

        // Second send immediately should fail (cooldown)
        $result2 = $this->otpService->sendOtp('22891000000', 'registration');
        $this->assertFalse($result2['success']);
        $this->assertStringContainsString('attendre', strtolower($result2['message']));
    }

    // ==================== PHONE VERIFICATION STATUS TESTS ====================

    public function test_is_phone_verified_returns_true_after_verification(): void
    {
        $plainOtp = '123456';
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', $plainOtp),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified_at' => now(),
        ]);

        $result = $this->otpService->isPhoneVerified('22891000000', 'registration');

        $this->assertTrue($result);
    }

    public function test_is_phone_verified_returns_false_if_not_verified(): void
    {
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', '123456'),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified_at' => null, // Not verified
        ]);

        $result = $this->otpService->isPhoneVerified('22891000000', 'registration');

        $this->assertFalse($result);
    }

    public function test_is_phone_verified_returns_false_for_expired_verification(): void
    {
        OtpVerification::create([
            'phone' => '22891000000',
            'otp' => hash('sha256', '123456'),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified_at' => now()->subHours(2), // Verified but too long ago
        ]);

        // Check with 60 minute validity
        $result = $this->otpService->isPhoneVerified('22891000000', 'registration', 60);

        $this->assertFalse($result);
    }

    // ==================== PHONE NORMALIZATION TESTS ====================

    public function test_otp_normalizes_phone_number(): void
    {
        $this->smsServiceMock
            ->shouldReceive('sendOtp')
            ->once()
            ->andReturn(['success' => true]);

        // Send with format +228
        $this->otpService->sendOtp('+22891000000', 'registration');

        // Should be stored normalized
        $this->assertDatabaseHas('otp_verifications', [
            'phone' => '22891000000',
        ]);
    }
}
