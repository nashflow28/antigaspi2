<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Category;
use App\Models\Reservation;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use App\Enums\PaymentMethod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminPaymentDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $secret = str_repeat('a', 64);
        config([
            'jwt.secret' => $secret,
            'jwt.keys.secret' => $secret,
        ]);
    }

    protected function authenticateAdmin(): void
    {
        $admin = User::create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Admin',
            'last_name' => 'User',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($admin);
        $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    protected function createPaymentTestData(): array
    {
        // Create consumer
        $consumer = User::create([
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+22812345678',
            'role' => 'consumer',
            'is_active' => true,
        ]);

        // Create merchant user
        $merchantUser = User::create([
            'email' => 'merchant@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'role' => 'merchant',
            'is_active' => true,
        ]);

        // Create merchant
        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Test Bakery',
            'business_type' => 'Bakery',
            'is_verified' => true,
            'verification_date' => now(),
        ]);

        // Create category
        $category = Category::create([
            'name' => 'Bakery',
            'description' => 'Baked goods',
            'icon' => 'bread',
            'is_active' => true,
        ]);

        // Create product
        $product = Product::create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Test Bread',
            'description' => 'Fresh bread',
            'original_price' => 1000,
            'discounted_price' => 500,
            'quantity_available' => 10,
            'is_active' => true,
        ]);

        // Create reservation
        $reservation = Reservation::create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'quantity_reserved' => 2,
            'total_amount' => 1000,
            'status' => 'confirmed',
            'reservation_code' => 'TEST123',
            'reserved_at' => now(),
            'confirmed_at' => now(),
        ]);

        // Create successful payment
        $payment1 = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 1000,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::FLOOZ,
            'status' => PaymentStatus::SUCCESS,
            'transaction_id' => 'TXN123456',
            'reference' => 'REF123',
            'provider' => 'Flooz',
            'customer_phone' => '+22812345678',
            'paid_at' => now(),
        ]);

        // Create pending payment
        $payment2 = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 500,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::TMONEY,
            'status' => PaymentStatus::PENDING,
            'transaction_id' => 'TXN789012',
            'reference' => 'REF456',
            'provider' => 'Tmoney',
            'customer_phone' => '+22812345678',
        ]);

        // Create failed payment
        $payment3 = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 750,
            'currency' => 'XOF',
            'payment_method' => PaymentMethod::ORANGE_MONEY,
            'status' => PaymentStatus::FAILED,
            'transaction_id' => 'TXN345678',
            'reference' => 'REF789',
            'provider' => 'Orange Money',
            'customer_phone' => '+22812345678',
        ]);

        return [
            'consumer' => $consumer,
            'merchant' => $merchant,
            'product' => $product,
            'reservation' => $reservation,
            'payments' => [$payment1, $payment2, $payment3],
        ];
    }

    public function test_payments_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/payments');

        $response->assertUnauthorized();
    }

    public function test_payments_requires_admin_role(): void
    {
        $consumer = User::create([
            'email' => 'consumer@test.com',
            'password' => bcrypt('password'),
            'first_name' => 'Test',
            'last_name' => 'Consumer',
            'role' => 'consumer',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($consumer);
        $this->withHeader('Authorization', 'Bearer ' . $token);

        $response = $this->getJson('/api/admin/payments');

        $response->assertForbidden();
    }

    public function test_can_get_all_payments(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'amount',
                        'currency',
                        'payment_method',
                        'status',
                        'transaction_id',
                        'reference',
                        'provider',
                        'customer_phone',
                        'paid_at',
                        'created_at',
                        'customer' => ['id', 'name', 'email', 'phone'],
                        'merchant' => ['id', 'business_name', 'business_type', 'email'],
                        'reservation_id',
                    ]
                ],
                'summary' => [
                    'total_payments',
                    'total_amount',
                    'successful_payments',
                    'failed_payments',
                    'pending_payments',
                ],
                'pagination' => [
                    'current_page',
                    'total_pages',
                    'per_page',
                    'total',
                    'from',
                    'to',
                ],
                'filters_applied',
            ]);

        $this->assertEquals(3, $response->json('summary.total_payments'));
        $this->assertEquals(2250, $response->json('summary.total_amount')); // 1000 + 500 + 750
    }

    public function test_can_filter_by_status(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?status=success');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals('success', $response->json('data.0.status'));
    }

    public function test_can_filter_by_payment_method(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?payment_method=flooz');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals('flooz', $response->json('data.0.payment_method'));
    }

    public function test_can_filter_by_date_range(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $startDate = now()->subDays(7)->format('Y-m-d');
        $endDate = now()->format('Y-m-d');

        $response = $this->getJson("/api/admin/payments?start_date={$startDate}&end_date={$endDate}");

        $response->assertOk();
        $this->assertEquals(3, $response->json('summary.total_payments'));
    }

    public function test_can_filter_by_merchant(): void
    {
        $this->authenticateAdmin();
        $testData = $this->createPaymentTestData();

        $merchantId = $testData['merchant']->id;

        $response = $this->getJson("/api/admin/payments?merchant_id={$merchantId}");

        $response->assertOk();
        $this->assertEquals(3, $response->json('summary.total_payments'));
        $this->assertEquals($merchantId, $response->json('data.0.merchant.id'));
    }

    public function test_can_filter_by_amount_range(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?min_amount=600&max_amount=900');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals(750, $response->json('data.0.amount'));
    }

    public function test_can_search_by_transaction_id(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?search=TXN123456');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals('TXN123456', $response->json('data.0.transaction_id'));
    }

    public function test_can_search_by_reference(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?search=REF456');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals('REF456', $response->json('data.0.reference'));
    }

    public function test_can_search_by_customer_phone(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?search=+22812345678');

        $response->assertOk();
        $this->assertEquals(3, $response->json('summary.total_payments'));
    }

    public function test_pagination_works(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?per_page=2&page=1');

        $response->assertOk();
        $this->assertEquals(2, count($response->json('data')));
        $this->assertEquals(1, $response->json('pagination.current_page'));
        $this->assertEquals(2, $response->json('pagination.per_page'));
    }

    public function test_validation_fails_with_invalid_status(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/payments?status=invalid');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_validation_fails_with_invalid_payment_method(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/payments?payment_method=invalid');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method']);
    }

    public function test_validation_fails_with_invalid_date_range(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/payments?start_date=2024-01-10&end_date=2024-01-05');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_date']);
    }

    public function test_validation_fails_with_invalid_merchant_id(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/payments?merchant_id=99999');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['merchant_id']);
    }

    public function test_validation_fails_with_invalid_amount_range(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/payments?min_amount=1000&max_amount=500');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['max_amount']);
    }

    public function test_summary_reflects_filtered_data(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        // Filter by success status
        $response = $this->getJson('/api/admin/payments?status=success');

        $response->assertOk();
        $this->assertEquals(1, $response->json('summary.total_payments'));
        $this->assertEquals(1000, $response->json('summary.total_amount'));
        $this->assertEquals(1, $response->json('summary.successful_payments'));
        $this->assertEquals(0, $response->json('summary.failed_payments'));
        $this->assertEquals(0, $response->json('summary.pending_payments'));
    }

    public function test_filters_applied_shows_active_filters(): void
    {
        $this->authenticateAdmin();
        $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments?status=success&payment_method=flooz&min_amount=500');

        $response->assertOk();

        $filtersApplied = $response->json('filters_applied');
        $this->assertArrayHasKey('status', $filtersApplied);
        $this->assertArrayHasKey('payment_method', $filtersApplied);
        $this->assertArrayHasKey('min_amount', $filtersApplied);
        $this->assertEquals('success', $filtersApplied['status']);
        $this->assertEquals('flooz', $filtersApplied['payment_method']);
        $this->assertEquals(500, $filtersApplied['min_amount']);
    }

    public function test_includes_customer_and_merchant_details(): void
    {
        $this->authenticateAdmin();
        $testData = $this->createPaymentTestData();

        $response = $this->getJson('/api/admin/payments');

        $response->assertOk();

        $payment = $response->json('data.0');

        // Check customer details
        $this->assertArrayHasKey('customer', $payment);
        $this->assertEquals($testData['consumer']->id, $payment['customer']['id']);
        $this->assertEquals('John Doe', $payment['customer']['name']);
        $this->assertEquals('consumer@test.com', $payment['customer']['email']);

        // Check merchant details
        $this->assertArrayHasKey('merchant', $payment);
        $this->assertEquals($testData['merchant']->id, $payment['merchant']['id']);
        $this->assertEquals('Test Bakery', $payment['merchant']['business_name']);
        $this->assertEquals('Bakery', $payment['merchant']['business_type']);
    }
}
