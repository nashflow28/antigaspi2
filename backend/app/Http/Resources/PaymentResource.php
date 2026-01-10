<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_id' => $this->reservation_id,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method?->value ?? $this->payment_method,
            'status' => $this->status?->value ?? $this->status,
            'provider' => $this->provider,
            'checkout_url' => $this->checkout_url,
            'customer_phone' => $this->customer_phone,
            'reference' => $this->reference,
            'transaction_id' => $this->transaction_id,
            'payload' => $this->payload,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'reservation' => $this->whenLoaded('reservation', function () {
                $reservation = $this->reservation;
                if (! $reservation) {
                    return null;
                }

                $consumer = $reservation->user;
                $product = $reservation->product;

                return [
                    'id' => $reservation->id,
                    'reservation_code' => $reservation->reservation_code,
                    'status' => $reservation->status,
                    'payment_status' => $reservation->payment_status?->value ?? $reservation->payment_status,
                    'total_amount' => $reservation->total_amount !== null ? (float) $reservation->total_amount : null,
                    'pickup_date' => $reservation->pickup_date,
                    'created_at' => $reservation->created_at,
                    'product' => $product ? [
                        'id' => $product->id,
                        'name' => $product->name,
                    ] : null,
                    'consumer' => $consumer ? [
                        'id' => $consumer->id,
                        'name' => trim(($consumer->first_name ?? '').' '.($consumer->last_name ?? '')) ?: ($consumer->name ?? ''),
                        'phone' => $consumer->phone,
                        'email' => $consumer->email,
                    ] : null,
                ];
            }),
        ];
    }
}
