<?php

namespace App\Http\Requests\Cart;

use App\Enums\PaymentMethod;
use App\Rules\ValidPickupDate;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CheckoutCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->role === 'consumer';
    }

    public function rules(): array
    {
        $cart = Auth::user()?->cart?->loadMissing(['merchant', 'items.product']);
        $businessType = $cart?->merchant?->business_type;
        $latestExpiration = $cart?->items?->pluck('product')
            ->filter()
            ->map(function ($product) {
                return $product->expiration_date instanceof Carbon
                    ? $product->expiration_date->copy()
                    : ($product->expiration_date ? Carbon::parse($product->expiration_date) : null);
            })
            ->filter()
            ->min();

        return [
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
                'required',
                'date',
                $businessType ? new ValidPickupDate($businessType, $latestExpiration) : null,
            ]),
            'pickup_time' => [
                'required',
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
                    $pickupDateTime = Carbon::createFromFormat('Y-m-d H:i', $this->input('pickup_date') . ' ' . $this->input('pickup_time'), config('app.timezone'));
                    if ($pickupDateTime->lt(now())) {
                        $validator->errors()->add('pickup_time', 'Le créneau de retrait doit être dans le futur.');
                    }
                } catch (\Exception $exception) {
                    $validator->errors()->add('pickup_time', 'Le créneau de retrait est invalide.');
                }
            }
        });
    }
}
