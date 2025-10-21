<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Cart */
class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total_amount' => (float) $this->total_amount,
            'items_count' => $this->items->sum('quantity'),
            'merchant' => $this->whenLoaded('merchant', function () {
                return [
                    'id' => $this->merchant->id,
                    'name' => $this->merchant->business_name,
                    'business_type' => $this->merchant->business_type,
                ];
            }),
            'items' => CartItemResource::collection($this->whenLoaded('items', $this->items, collect())),
        ];
    }
}
