<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
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
            'quantity' => [
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
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'customer_phone' => [
                'nullable',
                'string',
                'regex:/^\+?[0-9]{8,15}$/',
                Rule::requiredIf(function () {
                    $method = $this->input('payment_method');
                    return in_array($method, [PaymentMethod::FLOOZ->value, PaymentMethod::TMONEY->value], true);
                }),
            ],
            'customer_email' => ['nullable', 'email'],
            'notes' => 'nullable|string|max:500',
            'pickup_date' => [
                'nullable',
                'date',
                'after:now',
                'before:' . now()->addDays(7)->toDateString()
            ],
            'pickup_time' => [
                'nullable',
                'date_format:H:i',
                'required_with:pickup_date'
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
            'payment_method.required' => 'Veuillez sélectionner un moyen de paiement.',
            'payment_method.enum' => 'Le moyen de paiement choisi est invalide.',
            'customer_phone.required' => 'Le numéro de téléphone est requis pour Flooz ou Tmoney.',
            'customer_phone.regex' => 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres et peut commencer par +.',
            'customer_email.email' => 'L\'adresse email du client est invalide.',
            'notes.max' => 'Les notes ne peuvent pas dépasser 500 caractères.',
            'pickup_date.after' => 'La date de récupération doit être dans le futur.',
            'pickup_date.before' => 'La date de récupération ne peut pas dépasser 7 jours.',
            'pickup_time.date_format' => 'Le format de l\'heure doit être HH:MM.',
            'pickup_time.required_with' => 'L\'heure de récupération est requise avec la date.',
        ];
    }

    public function attributes(): array
    {
        return [
            'product_id' => 'produit',
            'quantity' => 'quantité',
            'payment_method' => 'moyen de paiement',
            'customer_phone' => 'numéro de téléphone',
            'customer_email' => 'email client',
            'notes' => 'notes',
            'pickup_date' => 'date de récupération',
            'pickup_time' => 'heure de récupération',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
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
