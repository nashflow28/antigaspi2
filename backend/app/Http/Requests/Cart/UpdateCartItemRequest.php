<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->role === 'consumer';
    }

    public function rules(): array
    {
        return [
            'quantity' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    $item = $this->route('item');
                    $product = $item?->product;

                    if (! $product) {
                        $fail('Le produit associé à cet article est introuvable.');

                        return;
                    }

                    if ($product->quantity_available < (int) $value) {
                        $fail("Stock insuffisant. Disponible: {$product->quantity_available}");
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.required' => 'Veuillez indiquer la quantité.',
            'quantity.integer' => 'La quantité doit être un nombre entier.',
            'quantity.min' => 'La quantité minimum est 1.',
        ];
    }

    public function attributes(): array
    {
        return [
            'quantity' => 'quantité',
        ];
    }
}
