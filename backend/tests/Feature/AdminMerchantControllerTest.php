<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminMerchantControllerTest extends TestCase
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
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
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
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            // Referral system columns (required by User model boot method)
            $table->string('referral_code', 10)->unique()->nullable();
            $table->unsignedBigInteger('referred_by')->nullable();
            $table->boolean('referral_bonus_awarded')->default(false);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('business_type')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verification_date')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('original_price', 10, 2);
            $table->decimal('discounted_price', 10, 2);
            $table->integer('quantity_available');
            $table->date('expiration_date')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('rejection_reason')->nullable();
            $table->string('moderation_status')->nullable();
            $table->timestamps();
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity_reserved');
            $table->decimal('total_amount', 10, 2);
            $table->string('status');
            $table->string('payment_status')->default('pending');
            $table->unsignedBigInteger('latest_payment_id')->nullable();
            $table->string('reservation_code')->unique();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('action', 100);
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_name')->nullable();
            $table->text('reason')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('admin_audit_logs');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('merchants');
        Schema::dropIfExists('users');
        Schema::enableForeignKeyConstraints();

        parent::tearDown();
    }

    protected function authenticateAdmin(): void
    {
        $admin = User::create([
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($admin);

        $this->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_moderation_returns_expected_payload(): void
    {
        $pendingUser = User::create([
            'email' => 'pending@example.com',
            'password' => 'password',
            'first_name' => 'Pending',
            'last_name' => 'Merchant',
            'phone' => '0102030405',
            'role' => 'merchant',
            'city' => 'Dakar',
            'address' => '123 Rue Principale',
            'is_active' => true,
        ]);

        $verifiedUser = User::create([
            'email' => 'verified@example.com',
            'password' => 'password',
            'first_name' => 'Verified',
            'last_name' => 'Merchant',
            'phone' => '0607080910',
            'role' => 'merchant',
            'city' => 'Dakar',
            'address' => '456 Avenue du Marché',
            'is_active' => true,
        ]);

        $consumer = User::create([
            'email' => 'consumer@example.com',
            'password' => 'password',
            'first_name' => 'Alice',
            'last_name' => 'Consumer',
            'phone' => '0504030201',
            'role' => 'consumer',
            'city' => 'Dakar',
            'address' => '789 Boulevard des Consommateurs',
            'is_active' => true,
        ]);

        $pendingMerchant = Merchant::create([
            'user_id' => $pendingUser->id,
            'business_name' => 'Épicerie Soleil',
            'business_type' => 'Grocery',
            'is_verified' => false,
        ]);

        $verifiedMerchant = Merchant::create([
            'user_id' => $verifiedUser->id,
            'business_name' => 'Boulangerie du Marché',
            'business_type' => 'Bakery',
            'is_verified' => true,
            'verification_date' => now(),
        ]);

        $category = Category::create([
            'name' => 'Boulangerie',
            'description' => 'Produits de boulangerie',
            'icon' => 'bread',
            'is_active' => true,
        ]);

        $product = Product::create([
            'merchant_id' => $verifiedMerchant->id,
            'category_id' => $category->id,
            'name' => 'Panier anti-gaspi',
            'description' => 'Assortiment de pâtisseries du jour',
            'original_price' => 5000,
            'discounted_price' => 2500,
            'quantity_available' => 3,
            'expiration_date' => now()->addDay(),
            'image_url' => 'https://example.com/image.jpg',
            'is_active' => true,
        ]);

        Reservation::create([
            'user_id' => $consumer->id,
            'product_id' => $product->id,
            'quantity_reserved' => 2,
            'total_amount' => 5000,
            'status' => 'completed',
            'reservation_code' => 'RES123456',
            'reserved_at' => now()->subDay(),
            'confirmed_at' => now()->subHours(12),
            'expires_at' => now()->addDay(),
            'notes' => 'Livraison sans contact',
        ]);

        $this->authenticateAdmin();

        $response = $this->getJson('/api/admin/moderation');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('stats.activeMerchants', 1)
            ->assertJsonPath('stats.pendingMerchants', 1)
            ->assertJsonPath('stats.totalProducts', 1)
            ->assertJsonPath('stats.totalReservations', 1)
            ->assertJsonPath('pendingMerchants.0.business_name', 'Épicerie Soleil')
            ->assertJsonPath('pendingMerchants.0.owner_name', 'Pending Merchant')
            ->assertJsonPath('productsToModerate.0.original_price', 5000)
            ->assertJsonPath('productsToModerate.0.discounted_price', 2500)
            ->assertJsonPath('productsToModerate.0.quantity_available', 3)
            ->assertJsonPath('productsToModerate.0.category', 'Boulangerie')
            ->assertJsonPath('flaggedReservations.0.total_amount', 5000)
            ->assertJsonPath('flaggedReservations.0.quantity_reserved', 2);
    }

    public function test_reject_product_sets_quantity_available_to_zero(): void
    {
        $merchantUser = User::create([
            'email' => 'merchant@example.com',
            'password' => 'password',
            'first_name' => 'Marc',
            'last_name' => 'Marchand',
            'role' => 'merchant',
            'is_active' => true,
        ]);

        $merchant = Merchant::create([
            'user_id' => $merchantUser->id,
            'business_name' => 'Primeurs du Port',
            'business_type' => 'Grocery',
            'is_verified' => true,
            'verification_date' => now(),
        ]);

        $category = Category::create([
            'name' => 'Fruits',
            'description' => 'Fruits frais',
            'icon' => 'apple',
            'is_active' => true,
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'category_id' => $category->id,
            'name' => 'Panier de fruits',
            'description' => 'Panier surprise de fruits de saison',
            'original_price' => 4000,
            'discounted_price' => 2000,
            'quantity_available' => 5,
            'expiration_date' => now()->addDays(2),
            'image_url' => null,
            'is_active' => true,
        ]);

        $this->authenticateAdmin();

        $response = $this->postJson("/api/admin/products/{$product->id}/reject", [
            'reason' => 'Produit non conforme aux standards',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(0, $product->fresh()->quantity_available);
    }
}
