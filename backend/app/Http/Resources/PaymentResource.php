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
        ];
    }
}
