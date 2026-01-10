<?php

namespace Tests\Unit;

use App\Http\Resources\ReservationResource;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class ReservationResourceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
        config(['app.cipher' => 'AES-256-CBC']);
    }

    public function test_product_category_is_included_when_present(): void
    {
        $reservation = Reservation::factory()->create();
        $reservation = Reservation::with(['product.category', 'product.merchant.user', 'user'])
            ->findOrFail($reservation->id);
        $reservation->setRelation('product', $reservation->product);
        $reservation->product->setRelation('category', $reservation->product->category);
        $reservation->setRelation('product.category', $reservation->product->category);

        $resource = new ReservationResource($reservation);
        $responseData = $resource->toResponse(new Request)->getData(true);
        $productData = $responseData['data']['product'];

        $this->assertArrayHasKey('category', $productData);
        $this->assertSame($reservation->product->category->id, $productData['category']['id']);
        $this->assertSame($reservation->product->category->name, $productData['category']['name']);
        $this->assertSame($reservation->product->category->icon, $productData['category']['icon']);
    }

    public function test_product_category_is_null_when_not_associated(): void
    {
        $productWithoutCategory = Product::factory()->state([
            'category_id' => null,
        ])->create();

        $reservation = Reservation::factory()
            ->for($productWithoutCategory, 'product')
            ->create();
        $reservation = Reservation::with(['product.category', 'product.merchant.user', 'user'])
            ->findOrFail($reservation->id);
        $reservation->setRelation('product', $reservation->product);
        $reservation->product->setRelation('category', $reservation->product->category);
        $reservation->setRelation('product.category', $reservation->product->category);

        $resource = new ReservationResource($reservation);
        $responseData = $resource->toResponse(new Request)->getData(true);
        $productData = $responseData['data']['product'];

        $this->assertArrayHasKey('category', $productData);
        $this->assertNull($productData['category']);
    }
}
