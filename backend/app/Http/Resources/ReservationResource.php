<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reservation */
class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => $this->quantity_reserved,
            'original_price' => (float) $this->product->original_price,
            'discounted_price' => (float) $this->product->discounted_price,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            'payment_status' => $this->payment_status?->value ?? $this->payment_status,
            'notes' => $this->notes,
            'merchant_notes' => $this->merchant_notes,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'confirmed_at' => $this->confirmed_at,
            'ready_at' => $this->ready_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'pickup_date' => $this->pickup_date,
            'pickup_time' => $this->pickup_time,

            'is_pending' => $this->isPending(),
            'is_confirmed' => $this->isConfirmed(),
            'is_ready' => $this->isReady(),
            'is_completed' => $this->isCompleted(),
            'is_cancelled' => $this->isCancelled(),
            'can_be_cancelled' => $this->canBeCancelled(),
            'latest_payment' => $this->whenLoaded('latestPayment', fn () => new PaymentResource($this->latestPayment)),

            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'description' => $this->product->description,
                'image_url' => $this->product->image_url,
                'original_price' => (float) $this->product->original_price,
                'discounted_price' => (float) $this->product->discounted_price,
                'discount_percentage' => $this->product->discount_percentage,
                'expiration_date' => $this->product->expiration_date,
                'category' => $this->whenLoaded(
                    'product.category',
                    fn () => optional($this->product->category, fn ($category) => [
                        'id' => $category->id,
                        'name' => $category->name,
                        'icon' => $category->icon,
                    ])
                ),
                'merchant' => [
                    'id' => $this->product->merchant->id,
                    'name' => $this->product->merchant->business_name,
                    'business_type' => $this->product->merchant->business_type,
                    'address' => $this->product->merchant->address ?? $this->product->merchant->user->address,
                    'city' => $this->product->merchant->city ?? $this->product->merchant->user->city,
                    'phone' => $this->product->merchant->phone ?? $this->product->merchant->user->phone,
                    'distance' => $this->when(
                        isset($this->product->merchant->distance),
                        $this->product->merchant->distance
                    ),
                ],
            ],

            'consumer' => $this->when(
                $this->relationLoaded('user'),
                [
                    'id' => $this->user->id,
                    'name' => $this->user->full_name ?? $this->user->first_name . ' ' . $this->user->last_name,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'phone' => $this->user->phone,
                    'city' => $this->user->city,
                ]
            ),

            'environmental_impact' => $this->when(
                $this->isCompleted(),
                [
                    'food_saved_kg' => $this->quantity_reserved,
                    'co2_saved_kg' => round($this->quantity_reserved * 2.5, 1),
                    'money_saved' => round(
                        ($this->product->original_price - $this->product->discounted_price) * $this->quantity_reserved,
                        2
                    ),
                ]
            ),
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'generated_at' => now()->toISOString(),
                'timezone' => config('app.timezone'),
            ],
        ];
    }
}
