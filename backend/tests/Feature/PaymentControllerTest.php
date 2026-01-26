<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Merchant;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $secret = str_repeat('a', 64);

        config([
            'jwt.secret' => $secret,
            'jwt.keys.secret' => $secret,
        ]);

        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('payments');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('products');
        Schema::dropIfExists('merchants');
        Schema::dropIfExists('users');
        Schema::enableForeignKeyConstraints();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('role')->nullable();
            $table->string('name')->nullable();
            // Referral system columns (required by User model boot method)
            $table->string('referral_code', 10)->unique()->nullable();
            $table->unsignedBigInteger('referred_by')->nullable();
            $table->boolean('referral_bonus_awarded')->default(false);
            $table->timestamps();
        });

        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('original_price', 10, 2)->default(0);
            $table->decimal('discounted_price', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('reservation_code');
            $table->string('status');
            $table->string('payment_status')->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->foreignId('latest_payment_id')->nullable();
            $table->timestamp('pickup_date')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('XOF');
            $table->string('payment_method');
            $table->string('status');
            $table->string('provider')->nullable();
            $table->string('checkout_url')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('reference')->nullable();
            $table->string('transaction_id')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function test_merchant_can_list_payments_with_filters(): void
    {
        $merchantUser = User::create([
            'email' => 'merchant@example.com',
            'password' => 'password',
            'role' => 'merchant',
            'first_name' => 'Marie',
            'last_name' => 'Kouassi',
            'phone' => '+22890000000',
        ]);

        $consumer = User::create([
            'email' => 'consumer@example.com',
            'password' => 'password',
            'role' => 'consumer',
            'first_name' => 'Ali',
            'last_name' => 'Mensah',
            'phone' => '+22891122334',
        ]);

        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Maison AntiGaspi',
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'name' => 'Panier surprise premium',
            'original_price' => 12000,
            'discounted_price' => 6000,
        ]);

        $reservation = Reservation::create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'reservation_code' => 'RES-TEST001',
            'status' => 'confirmed',
            'payment_status' => PaymentStatus::SUCCESS->value,
            'total_amount' => 6000,
        ]);

        $successfulPayment = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 6000,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::WALLET->value,
            'status' => PaymentStatus::SUCCESS->value,
            'provider' => 'wallet',
            'reference' => 'PAY-0001',
            'paid_at' => now(),
        ]);

        $pendingPayment = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 5000,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::PAYSTACK->value,
            'status' => PaymentStatus::PENDING->value,
            'provider' => 'paystack',
            'reference' => 'PAY-0002',
        ]);

        $reservation->update(['latest_payment_id' => $successfulPayment->id]);

        $token = JWTAuth::fromUser($merchantUser);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/payments?status=success&method=wallet');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.reference', 'PAY-0001')
            ->assertJsonPath('data.0.reservation.reservation_code', 'RES-TEST001')
            ->assertJsonPath('meta.summary.status_breakdown.success.count', 1);
    }

    public function test_merchant_can_export_payments_as_csv(): void
    {
        $merchantUser = User::create([
            'email' => 'exporter@example.com',
            'password' => 'password',
            'role' => 'merchant',
            'first_name' => 'Komi',
            'last_name' => 'Dzidzienyo',
        ]);

        $consumer = User::create([
            'email' => 'export-consumer@example.com',
            'password' => 'password',
            'role' => 'consumer',
            'first_name' => 'Sarah',
            'last_name' => 'Doe',
        ]);

        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Export Shop',
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'name' => 'Box découverte',
            'original_price' => 8000,
            'discounted_price' => 4000,
        ]);

        $reservation = Reservation::create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'reservation_code' => 'RES-CSV-01',
            'status' => 'confirmed',
            'payment_status' => PaymentStatus::SUCCESS->value,
            'total_amount' => 4000,
        ]);

        Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 4000,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::FLOOZ->value,
            'status' => PaymentStatus::SUCCESS->value,
            'provider' => 'fedapay',
            'reference' => 'PAY-CSV-01',
            'paid_at' => now(),
        ]);

        $token = JWTAuth::fromUser($merchantUser);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->get('/api/payments?export=csv');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();

        $this->assertStringContainsString('PAY-CSV-01', $content);
        $this->assertStringContainsString('RES-CSV-01', $content);
    }
}
