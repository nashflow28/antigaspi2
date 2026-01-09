<?php

namespace Tests\Unit;

use App\Services\SmsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SmsServiceTest extends TestCase
{
    private SmsService $smsService;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure SMS service for testing
        config(['services.sms.token' => 'test-token']);
        config(['services.sms.sender' => 'TestApp']);

        $this->smsService = new SmsService();
    }

    // ==================== CONFIGURATION TESTS ====================

    public function test_is_configured_returns_true_when_token_set(): void
    {
        $this->assertTrue($this->smsService->isConfigured());
    }

    public function test_is_configured_returns_false_when_token_empty(): void
    {
        config(['services.sms.token' => null]);
        $service = new SmsService();

        $this->assertFalse($service->isConfigured());
    }

    public function test_send_returns_error_when_not_configured(): void
    {
        config(['services.sms.token' => null]);
        $service = new SmsService();

        $result = $service->send('22891000000', 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not configured', $result['message']);
    }

    // ==================== PHONE NORMALIZATION TESTS ====================

    public function test_normalizes_phone_with_plus_prefix(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->send('+22891000000', 'Test');

        Http::assertSent(function ($request) {
            return $request['to'] === '22891000000';
        });
    }

    public function test_normalizes_phone_with_local_format(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        // Local 8-digit format
        $this->smsService->send('91000000', 'Test');

        Http::assertSent(function ($request) {
            return $request['to'] === '22891000000';
        });
    }

    public function test_normalizes_phone_starting_with_zero(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        // Local format starting with 0
        $this->smsService->send('091000000', 'Test');

        Http::assertSent(function ($request) {
            return $request['to'] === '22891000000';
        });
    }

    public function test_normalizes_phone_with_double_zero_prefix(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        // International format with 00
        $this->smsService->send('0022891000000', 'Test');

        Http::assertSent(function ($request) {
            return $request['to'] === '22891000000';
        });
    }

    public function test_normalizes_phone_with_spaces_and_dashes(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->send('+228 91-00-00-00', 'Test');

        Http::assertSent(function ($request) {
            return $request['to'] === '22891000000';
        });
    }

    // ==================== API CALL TESTS ====================

    public function test_send_makes_api_call_with_correct_parameters(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->send('22891000000', 'Test message');

        Http::assertSent(function ($request) {
            return $request['token'] === 'test-token'
                && $request['to'] === '22891000000'
                && $request['text'] === 'Test message'
                && $request['from'] === 'TestApp';
        });
    }

    public function test_send_returns_success_on_200_response(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $result = $this->smsService->send('22891000000', 'Test message');

        $this->assertTrue($result['success']);
        $this->assertEquals('SMS sent successfully', $result['message']);
    }

    public function test_send_returns_failure_on_error_response(): void
    {
        Http::fake([
            '*' => Http::response('Invalid token', 401),
        ]);

        $result = $this->smsService->send('22891000000', 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Failed', $result['message']);
    }

    public function test_send_handles_network_exception(): void
    {
        Http::fake(function () {
            throw new \Exception('Connection timeout');
        });

        $result = $this->smsService->send('22891000000', 'Test message');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('error', strtolower($result['message']));
    }

    // ==================== SPECIALIZED MESSAGE TESTS ====================

    public function test_send_otp_formats_message_correctly(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->sendOtp('22891000000', '123456');

        Http::assertSent(function ($request) {
            return str_contains($request['text'], '123456')
                && str_contains($request['text'], 'verification')
                && str_contains($request['text'], '10 minutes');
        });
    }

    public function test_send_reservation_confirmation_formats_message_correctly(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->sendReservationConfirmation('22891000000', 'RES-001', 'Test Shop');

        Http::assertSent(function ($request) {
            return str_contains($request['text'], 'RES-001')
                && str_contains($request['text'], 'Test Shop')
                && str_contains($request['text'], 'Antigaspi');
        });
    }

    public function test_send_pickup_reminder_formats_message_correctly(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        $this->smsService->sendPickupReminder('22891000000', 'RES-002', 'Bakery', '18:00');

        Http::assertSent(function ($request) {
            return str_contains($request['text'], 'RES-002')
                && str_contains($request['text'], 'Bakery')
                && str_contains($request['text'], '18:00')
                && str_contains($request['text'], 'Rappel');
        });
    }

    // ==================== LOGGING TESTS ====================

    public function test_send_logs_masked_phone_number(): void
    {
        Http::fake([
            '*' => Http::response('OK', 200),
        ]);

        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                // Phone should be masked in logs
                return str_contains($message, 'SMS sent')
                    && isset($context['phone'])
                    && str_contains($context['phone'], '****');
            });

        $this->smsService->send('22891000000', 'Test');
    }

    public function test_send_logs_error_on_failure(): void
    {
        Http::fake(function () {
            throw new \Exception('Network error');
        });

        Log::shouldReceive('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, 'SMS Service Error');
            });

        $this->smsService->send('22891000000', 'Test');
    }
}
