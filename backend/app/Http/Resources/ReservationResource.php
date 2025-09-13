<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_code' => $this->reservation_code,
            'quantity' => $this->quantity_reserved,
            'original_price' => (float) $this->product->original_price,
            'discounted_price' => (float) $this->product->discounted_price,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            'notes' => $this->notes,

            // Dates and times
            'created_at' => $this->created_at,
            'reserved_at' => $this->reserved_at,
            'confirmed_at' => $this->confirmed_at,
            'expires_at' => $this->expires_at,
            'pickup_date' => $this->pickup_date ?? $this->expires_at,
            'pickup_notes' => $this->pickup_notes ?? $this->notes,

            // Status helpers
            'is_pending' => $this->isPending(),
            'is_confirmed' => $this->isConfirmed(),
            'is_completed' => $this->isCompleted(),
            'is_cancelled' => $this->isCancelled(),
            'is_expired' => $this->isExpired(),
            'can_be_cancelled' => $this->canBeCancelled(),
            'time_until_expiration' => $this->time_until_expiration,

            // Product information
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'description' => $this->product->description,
                'image_url' => $this->product->image_url,
                'original_price' => (float) $this->product->original_price,
                'discounted_price' => (float) $this->product->discounted_price,
                'discount_percentage' => $this->product->discount_percentage,
                'expiration_date' => $this->product->expiration_date,
                'category' => $this->whenLoaded('product.category', [
                    'id' => $this->product->category->id,
                    'name' => $this->product->category->name,
                    'icon' => $this->product->category->icon,
                ]),
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

            // Consumer information (for merchants)
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

            // Environmental impact (for completed reservations)
            'environmental_impact' => $this->when(
                $this->isCompleted(),
                [
                    'food_saved_kg' => $this->quantity_reserved,
                    'co2_saved_kg' => round($this->quantity_reserved * 2.5, 1), // 2.5kg CO2 per kg food
                    'money_saved' => round(
                        ($this->product->original_price - $this->product->discounted_price) * $this->quantity_reserved,
                        2
                    ),
                ]
            ),
        ];
    }

    /**
     * Customize the response for collection.
     */
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