<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\Reservation;
use App\Rules\ValidPickupDate;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
    private ?Product $resolvedProduct = null;

    private bool $productLoaded = false;

    public function authorize(): bool
    {
        // 🐛 BUG FIX: JWT authentication is already handled by 'jwt.auth' middleware on the route
        // Auth::check() only works with session-based auth, not JWT tokens
        // The middleware ensures the user is authenticated via JWT before this request is processed

        // Verify user is authenticated (middleware guarantees this, but double-check)
        $user = auth()->user();

        if (! $user) {
            return false;
        }

        // Only consumers can create reservations
        return $user->role === 'consumer';
    }

    /**
     * Prepare the data for validation.
     * Clean phone number by removing spaces and formatting characters.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('customer_phone') && $this->input('customer_phone')) {
            $this->merge([
                'customer_phone' => preg_replace('/[^+0-9]/', '', $this->input('customer_phone')),
            ]);
        }
    }

    public function rules(): array
    {
        $product = $this->getProduct();
        $businessType = $product?->merchant?->business_type;
        $latestExpiration = $product?->expiration_date instanceof Carbon
            ? $product->expiration_date->copy()
            : ($product?->expiration_date ? Carbon::parse($product->expiration_date) : null);

        return [
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
                function ($attribute, $value, $fail) {
                    $product = Product::find($value);

                    if (! $product) {
                        $fail('Le produit sélectionné n\'existe pas.');

                        return;
                    }

                    if (! $product->is_active) {
                        $fail('Ce produit n\'est plus disponible.');

                        return;
                    }

                    if ($product->isExpired()) {
                        $fail('Ce produit a expiré.');

                        return;
                    }
                },
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:100', // BUG FIX #29: Limit maximum reservation quantity to prevent abuse
                function ($attribute, $value, $fail) {
                    if (! $this->input('product_id')) {
                        return;
                    }

                    $product = Product::find($this->input('product_id'));
                    if ($product && $product->quantity_available < $value) {
                        $fail("Stock insuffisant. Disponible: {$product->quantity_available}");
                    }
                },
            ],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'customer_phone' => [
                'nullable',
                'string',
                'regex:/^\+?[0-9]{8,15}$/',
                Rule::requiredIf(function () {
                    $method = $this->input('payment_method');

                    return in_array($method, [
                        PaymentMethod::FLOOZ->value,
                        PaymentMethod::TMONEY->value,
                        PaymentMethod::ORANGE_MONEY->value,
                        PaymentMethod::MTN_MOMO->value,
                    ], true);
                }),
            ],
            'customer_email' => ['nullable', 'email'],
            'notes' => 'nullable|string|max:500',
            'pickup_date' => array_filter([
                'nullable',
                'date',
                $businessType ? new ValidPickupDate($businessType, $latestExpiration) : null,
            ]),
            'pickup_time' => [
                'nullable',
                'date_format:H:i',
            ],
            'wallet_pin' => [
                'nullable',
                'string',
                'digits_between:4,6',
                Rule::requiredIf(function () {
                    $method = $this->input('payment_method');

                    return $method === PaymentMethod::WALLET->value;
                }),
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
            'customer_phone.required' => 'Le numéro de téléphone est requis pour les paiements Mobile Money.',
            'customer_phone.regex' => 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres et peut commencer par +.',
            'customer_email.email' => 'L\'adresse email du client est invalide.',
            'notes.max' => 'Les notes ne peuvent pas dépasser 500 caractères.',
            'pickup_date.date' => 'La date de récupération est invalide.',
            'pickup_time.required' => 'L\'heure de récupération est obligatoire.',
            'pickup_time.date_format' => 'Le format de l\'heure doit être HH:MM.',
            'wallet_pin.required' => 'Le code PIN du portefeuille est requis pour un paiement wallet.',
            'wallet_pin.required_if' => 'Le code PIN du portefeuille est requis pour un paiement wallet.',
            'wallet_pin.digits_between' => 'Le code PIN du portefeuille doit contenir entre 4 et 6 chiffres.',
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
            'wallet_pin' => 'code PIN du portefeuille',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('pickup_date') && $this->input('pickup_time')) {
                try {
                    $pickupDateTime = Carbon::createFromFormat('Y-m-d H:i', $this->input('pickup_date').' '.$this->input('pickup_time'), config('app.timezone'));
                    if ($pickupDateTime->lt(now())) {
                        $validator->errors()->add(
                            'pickup_time',
                            'Le créneau de retrait doit être dans le futur.'
                        );
                    }
                } catch (\Exception $exception) {
                    $validator->errors()->add('pickup_time', 'Le créneau de retrait est invalide.');
                }
            }

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

    private function getProduct(): ?Product
    {
        if (! $this->productLoaded) {
            $this->resolvedProduct = $this->input('product_id')
                ? Product::with('merchant')->find($this->input('product_id'))
                : null;
            $this->productLoaded = true;
        }

        return $this->resolvedProduct;
    }
}
