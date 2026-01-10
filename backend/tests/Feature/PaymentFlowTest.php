<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);
        config(['payments.paygate.base_url' => 'https://paygate.test']);
        config(['payments.paygate.merchant_id' => 'merchant']);
        config(['payments.paygate.merchant_password' => 'secret']);
        config(['payments.paygate.callback_url' => 'https://app.test/paygate/callback']);
        config(['payments.paystack.base_url' => 'https://paystack.test']);
        config(['payments.paystack.secret_key' => 'paystack-secret']);
        config(['payments.paystack.callback_url' => 'https://app.test/paystack/callback']);
        config(['payments.fedapay.base_url' => 'https://fedapay.test']);
        config(['payments.fedapay.api_key' => 'fedapay-key']);
        config(['payments.fedapay.callback_url' => 'https://app.test/fedapay/callback']);
        config(['payments.cinetpay.base_url' => 'https://cinetpay.test']);
        config(['payments.cinetpay.api_key' => 'cinetpay-key']);
        config(['payments.cinetpay.site_id' => 'SITE123']);
        config(['payments.cinetpay.notify_url' => 'https://app.test/cinetpay/notify']);
        config(['payments.cinetpay.return_url' => 'https://app.test/cinetpay/return']);
        config(['payments.cinetpay.callback_url' => 'https://app.test/cinetpay/callback']);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_user_can_initiate_flooz_payment_during_reservation_creation(): void
    {
        Notification::fake();
        Http::fake([
            'https://fedapay.test/transactions' => Http::response([
                'transaction' => [
                    'id' => 'fd_123',
                    'status' => 'pending',
                    'reference' => 'FD-123456',
                ],
                'payment_url' => 'https://fedapay.test/checkout/FD-123456',
            ], 201),
        ]);

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create(['discounted_price' => 10.00, 'is_active' => true, 'quantity_available' => 5]);

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/reservations', [
            'product_id' => $product->id,
            'quantity' => 2,
            'payment_method' => PaymentMethod::FLOOZ->value,
            'customer_phone' => '+22891000000',
            'pickup_date' => now()->format('Y-m-d'),
            'pickup_time' => now()->addHour()->format('H:i'),
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('payment.payment_method', PaymentMethod::FLOOZ->value);

        $this->assertDatabaseHas('payments', [
            'customer_phone' => '+22891000000',
            'provider' => 'fedapay',
            'status' => PaymentStatus::PENDING->value,
        ]);

        $reservation = Reservation::first();
        $this->assertEquals(PaymentStatus::PENDING, $reservation->payment_status);
        $this->assertNotNull($reservation->latest_payment_id);

        Http::assertSent(fn ($request) => $request->url() === 'https://fedapay.test/transactions'
            && $request['mode'] === 'moov_money');
    }

    public function test_user_can_initiate_paystack_payment_via_payment_controller(): void
    {
        Notification::fake();
        Http::fake([
            'https://paystack.test/transaction/initialize' => Http::response([
                'status' => true,
                'data' => [
                    'authorization_url' => 'https://checkout.paystack.test/abc',
                    'reference' => 'PS-12345',
                ],
            ]),
        ]);

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create(['discounted_price' => 15.00, 'is_active' => true, 'quantity_available' => 3]);
        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => 15.00,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'payment_method' => PaymentMethod::PAYSTACK->value,
            'customer_email' => 'user@example.com',
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('data.checkout_url', 'https://checkout.paystack.test/abc');

        $reservation->refresh();
        $this->assertNotNull($reservation->latest_payment_id);
        $this->assertDatabaseHas('payments', [
            'reservation_id' => $reservation->id,
            'provider' => 'paystack',
        ]);
    }

    public function test_mobile_money_endpoint_initializes_fedapay_payment(): void
    {
        Notification::fake();
        Http::fake([
            'https://fedapay.test/transactions' => Http::response([
                'transaction' => [
                    'id' => 'fd_tx_55',
                    'status' => 'pending',
                    'reference' => 'FD-55',
                ],
                'payment_url' => 'https://fedapay.test/pay/FD-55',
            ], 201),
        ]);

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create(['discounted_price' => 18.00, 'is_active' => true, 'quantity_available' => 4]);
        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => 18.00,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/payments/mobile-money', [
            'reservation_id' => $reservation->id,
            'provider' => 'flooz',
            'customer_phone' => '+22892000000',
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('data.provider', 'fedapay')
            ->assertJsonPath('data.checkout_url', 'https://fedapay.test/pay/FD-55');

        $this->assertDatabaseHas('payments', [
            'reservation_id' => $reservation->id,
            'provider' => 'fedapay',
            'reference' => 'FD-55',
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://fedapay.test/transactions'
            && ($request->data()['transaction']['reference'] ?? null) === 'FD-55');
    }

    public function test_mobile_money_endpoint_initializes_cinetpay_payment(): void
    {
        Notification::fake();
        Http::fake([
            'https://cinetpay.test/payment' => Http::response([
                'code' => '201',
                'message' => 'success',
                'data' => [
                    'status' => 'PENDING',
                    'payment_url' => 'https://cinetpay.test/checkout/CP-88',
                    'transaction_id' => 'CP-88',
                ],
            ], 201),
        ]);

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create(['discounted_price' => 22.00, 'is_active' => true, 'quantity_available' => 5]);
        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => 22.00,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/payments/mobile-money', [
            'reservation_id' => $reservation->id,
            'provider' => 'mtn_momo',
            'customer_phone' => '+2250100000000',
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('data.provider', 'cinetpay')
            ->assertJsonPath('data.checkout_url', 'https://cinetpay.test/checkout/CP-88');

        $this->assertDatabaseHas('payments', [
            'reservation_id' => $reservation->id,
            'provider' => 'cinetpay',
            'reference' => $response->json('data.reference'),
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://cinetpay.test/payment'
            && ($request->data()['transaction_id'] ?? null) === $response->json('data.reference'));
    }

    public function test_fedapay_callback_updates_reservation_status(): void
    {
        Notification::fake();

        $user = User::factory()->create(['role' => 'consumer']);
        $product = Product::factory()->create(['discounted_price' => 20.00, 'is_active' => true, 'quantity_available' => 2]);
        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => 20.00,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $payment = Payment::factory()->create([
            'reservation_id' => $reservation->id,
            'amount' => 20.00,
            'payment_method' => PaymentMethod::FLOOZ,
            'status' => PaymentStatus::PENDING,
            'provider' => 'fedapay',
            'reference' => 'FD-CB-42',
            'transaction_id' => 'fd_tx_42',
        ]);

        $reservation->update([
            'latest_payment_id' => $payment->id,
        ]);

        $response = $this->postJson('/api/payments/webhook/fedapay', [
            'transaction' => [
                'id' => 'fd_tx_42',
                'reference' => 'FD-CB-42',
                'status' => 'approved',
            ],
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $payment->refresh();
        $reservation->refresh();

        $this->assertEquals(PaymentStatus::SUCCESS, $payment->status);
        $this->assertEquals('confirmed', $reservation->status);
        $this->assertEquals(PaymentStatus::SUCCESS, $reservation->payment_status);
    }

    public function test_cinetpay_callback_updates_reservation_status(): void
    {
        Notification::fake();

        $user = User::factory()->create(['role' => 'consumer']);
        $product = Product::factory()->create(['discounted_price' => 25.00, 'is_active' => true, 'quantity_available' => 3]);
        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => 25.00,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $payment = Payment::factory()->create([
            'reservation_id' => $reservation->id,
            'amount' => 25.00,
            'payment_method' => PaymentMethod::MTN_MOMO,
            'status' => PaymentStatus::PENDING,
            'provider' => 'cinetpay',
            'reference' => 'CP-CB-77',
            'transaction_id' => 'cp_tx_77',
        ]);

        $reservation->update([
            'latest_payment_id' => $payment->id,
        ]);

        $response = $this->postJson('/api/payments/webhook/cinetpay', [
            'transaction_id' => 'cp_tx_77',
            'status' => 'ACCEPTED',
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $payment->refresh();
        $reservation->refresh();

        $this->assertEquals(PaymentStatus::SUCCESS, $payment->status);
        $this->assertEquals('confirmed', $reservation->status);
        $this->assertEquals(PaymentStatus::SUCCESS, $reservation->payment_status);
    }

    public function test_wallet_reservation_requires_pin(): void
    {
        Notification::fake();

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create([
            'discounted_price' => 25.00,
            'is_active' => true,
            'quantity_available' => 3,
        ]);

        $wallets = app(WalletService::class);
        $wallet = $wallets->createWallet($user);
        $user->setRelation('wallet', $wallet);
        $wallets->setWalletPin($user, '1234');
        $wallets->rechargeWallet($user, 100.00, 'Recharge test');

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/reservations', [
            'product_id' => $product->id,
            'quantity' => 1,
            'payment_method' => PaymentMethod::WALLET->value,
            'pickup_date' => now()->format('Y-m-d'),
            'pickup_time' => now()->addHour()->format('H:i'),
        ], $headers);

        $response->assertStatus(422)->assertJsonValidationErrors(['wallet_pin']);
    }

    public function test_wallet_reservation_succeeds_with_valid_pin(): void
    {
        Notification::fake();

        $user = User::factory()->create(['role' => 'consumer', 'email' => 'user@example.com']);
        $product = Product::factory()->create([
            'discounted_price' => 30.00,
            'is_active' => true,
            'quantity_available' => 4,
        ]);

        $wallets = app(WalletService::class);
        $wallet = $wallets->createWallet($user);
        $user->setRelation('wallet', $wallet);
        $wallets->setWalletPin($user, '5678');
        $wallets->rechargeWallet($user, 200.00, 'Recharge test');

        $headers = $this->actingAsJwt($user);

        $response = $this->postJson('/api/reservations', [
            'product_id' => $product->id,
            'quantity' => 2,
            'payment_method' => PaymentMethod::WALLET->value,
            'wallet_pin' => '5678',
            'pickup_date' => now()->format('Y-m-d'),
            'pickup_time' => now()->addHour()->format('H:i'),
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('payment.payment_method', PaymentMethod::WALLET->value);

        $this->assertDatabaseHas('payments', [
            'payment_method' => PaymentMethod::WALLET->value,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        $reservation = Reservation::first();
        $this->assertEquals('confirmed', $reservation->status);
        $this->assertEquals(PaymentStatus::SUCCESS, $reservation->payment_status);

        $wallet = $user->wallet()->first();
        $expectedBalance = 200.00 - ($product->discounted_price * 2);
        $this->assertEqualsWithDelta($expectedBalance, (float) $wallet?->fresh()->balance, 0.01);
    }
}
