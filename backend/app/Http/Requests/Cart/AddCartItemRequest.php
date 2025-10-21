<?php

namespace App\Http\Requests\Cart;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class AddCartItemRequest extends FormRequest
{
    private ?Product $resolvedProduct = null;

    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->role === 'consumer';
    }

    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
                function ($attribute, $value, $fail) {
                    $product = $this->getProduct();

                    if (!$product) {
                        $fail('Le produit sélectionné n\'existe pas.');
                        return;
                    }

                    if (!$product->is_active) {
                        $fail('Ce produit n\'est plus disponible.');
                        return;
                    }

                    if ($product->isExpired()) {
                        $fail('Ce produit a expiré.');
                        return;
                    }

                    $cart = Auth::user()?->cart;
                    if ($cart && $cart->merchant_id !== $product->merchant_id) {
                        $fail('Votre panier contient déjà des produits d\'un autre commerce.');
                    }
                },
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    $product = $this->getProduct();
                    if (!$product) {
                        return;
                    }

                    $existingQuantity = 0;
                    $cart = Auth::user()?->cart;
                    if ($cart) {
                        $existingQuantity = $cart->items()
                            ->where('product_id', $product->id)
                            ->value('quantity') ?? 0;
                    }

                    $requested = $existingQuantity + (int) $value;
                    if ($product->quantity_available < $requested) {
                        $fail("Stock insuffisant. Disponible: {$product->quantity_available}");
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Veuillez sélectionner un produit.',
            'product_id.exists' => 'Le produit sélectionné n\'existe pas.',
            'quantity.required' => 'Veuillez indiquer la quantité.',
            'quantity.integer' => 'La quantité doit être un nombre entier.',
            'quantity.min' => 'La quantité minimum est 1.',
        ];
    }

    public function attributes(): array
    {
        return [
            'product_id' => 'produit',
            'quantity' => 'quantité',
        ];
    }

    private function getProduct(): ?Product
    {
        if (!$this->resolvedProduct && $this->input('product_id')) {
            $this->resolvedProduct = Product::with('merchant')->find($this->input('product_id'));
        }

        return $this->resolvedProduct;
    }
}
