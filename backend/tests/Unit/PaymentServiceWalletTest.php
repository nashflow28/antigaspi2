<?php

namespace Tests\Unit;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Services\Payments\PaymentService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentServiceWalletTest extends TestCase
{
    use RefreshDatabase;

    private PaymentService $payments;

    private WalletService $wallets;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);

        $this->payments = app(PaymentService::class);
        $this->wallets = app(WalletService::class);
    }

    public function test_initialize_wallet_payment_debits_balance_and_confirms_reservation(): void
    {
        [$reservation, $user, $initialBalance] = $this->createReservationWithWallet(7500);

        $payment = $this->payments->initializePayment($reservation, PaymentMethod::WALLET);

        $reservation->refresh();
        $wallet = $user->wallet->refresh();

        $this->assertEquals(PaymentStatus::SUCCESS, $payment->status);
        $this->assertNotNull($payment->transaction_id);
        $this->assertNotNull($payment->paid_at);
        $this->assertSame('confirmed', $reservation->status);
        $this->assertEquals(PaymentStatus::SUCCESS, $reservation->payment_status);
        $this->assertEquals($initialBalance - $reservation->total_amount, (float) $wallet->balance);
    }

    public function test_refresh_wallet_payment_returns_current_status(): void
    {
        [$reservation] = $this->createReservationWithWallet(3200);

        $payment = $this->payments->initializePayment($reservation, PaymentMethod::WALLET);
        $refreshed = $this->payments->refreshPayment($payment);

        $this->assertTrue($payment->is($refreshed));
        $this->assertEquals(PaymentStatus::SUCCESS, $refreshed->status);
    }

    public function test_cancelling_wallet_payment_refunds_balance_and_cancels_reservation(): void
    {
        [$reservation, $user, $initialBalance] = $this->createReservationWithWallet(5400);

        $payment = $this->payments->initializePayment($reservation, PaymentMethod::WALLET);
        $walletAfterPayment = $user->wallet->refresh();
        $this->assertEquals($initialBalance - $reservation->total_amount, (float) $walletAfterPayment->balance);

        $cancelled = $this->payments->cancelPayment($payment, ['reason' => 'Client request']);

        $reservation->refresh();
        $walletAfterCancellation = $user->wallet->refresh();

        $this->assertEquals(PaymentStatus::FAILED, $cancelled->status);
        $this->assertArrayHasKey('wallet', $cancelled->payload);
        $this->assertEquals('Client request', $cancelled->payload['wallet']['refund_reason']);
        $this->assertEquals($initialBalance, (float) $walletAfterCancellation->balance);
        $this->assertSame('cancelled', $reservation->status);
        $this->assertEquals(PaymentStatus::FAILED, $reservation->payment_status);
    }

    private function createReservationWithWallet(float $amount): array
    {
        $user = User::factory()->create(['role' => 'consumer']);
        $product = Product::factory()->create([
            'discounted_price' => $amount,
            'quantity_available' => 5,
            'is_active' => true,
        ]);

        $reservation = Reservation::factory()->pending()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity_reserved' => 1,
            'total_amount' => $amount,
            'payment_status' => PaymentStatus::PENDING,
        ]);

        $wallet = $this->wallets->getOrCreateWallet($user);
        $user->setRelation('wallet', $wallet);
        $this->wallets->rechargeWallet($user, $amount + 10000, 'Initial funding');
        $wallet = $wallet->refresh();

        return [$reservation->refresh(), $user, (float) $wallet->balance];
    }
}
