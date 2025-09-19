<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only consumers can create reservations
        return Auth::check() && Auth::user()->role === 'consumer';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
                function ($attribute, $value, $fail) {
                    $product = Product::find($value);

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
                }
            ],
            'quantity_reserved' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    if (!$this->input('product_id')) {
                        return;
                    }

                    $product = Product::find($this->input('product_id'));
                    if ($product && $product->quantity_available < $value) {
                        $fail("Stock insuffisant. Disponible: {$product->quantity_available}");
                    }
                }
            ],
            'notes' => 'nullable|string|max:500',
            'pickup_date' => [
                'nullable',
                'date',
                'after:now',
                'before:' . now()->addDays(7)->toDateString() // Max 7 days ahead
            ],
            'pickup_time' => [
                'nullable',
                'date_format:H:i',
                'required_with:pickup_date'
            ],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Veuillez sélectionner un produit.',
            'product_id.exists' => 'Le produit sélectionné n\'existe pas.',
            'quantity_reserved.required' => 'Veuillez indiquer la quantité.',
            'quantity_reserved.integer' => 'La quantité doit être un nombre entier.',
            'quantity_reserved.min' => 'La quantité minimum est 1.',
            'notes.max' => 'Les notes ne peuvent pas dépasser 500 caractères.',
            'pickup_date.after' => 'La date de récupération doit être dans le futur.',
            'pickup_date.before' => 'La date de récupération ne peut pas dépasser 7 jours.',
            'pickup_time.date_format' => 'Le format de l\'heure doit être HH:MM.',
            'pickup_time.required_with' => 'L\'heure de récupération est requise avec la date.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'product_id' => 'produit',
            'quantity_reserved' => 'quantité',
            'notes' => 'notes',
            'pickup_date' => 'date de récupération',
            'pickup_time' => 'heure de récupération',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Check if user already has an active reservation for this product
            if ($this->input('product_id')) {
                $existingReservation = Reservation::where('user_id', Auth::id())
                    ->where('product_id', $this->input('product_id'))
                    ->whereIn('status', ['pending', 'confirmed', 'ready'])
                    ->first();

                if ($existingReservation) {
                    $validator->errors()->add(
                        'product_id',
                        'Vous avez déjà une réservation active pour ce produit.'
                    );
                }
            }
        });
    }
}