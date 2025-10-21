<?php

namespace App\Rules;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\Rule;

class ValidPickupDate implements Rule
{
    private ?string $errorMessage = null;

    public function __construct(
        private readonly ?string $businessType,
        private readonly ?Carbon $latestAllowedDate = null
    ) {
    }

    public function passes($attribute, $value): bool
    {
        try {
            $pickupDate = Carbon::parse($value)->startOfDay();
        } catch (\Exception $exception) {
            $this->errorMessage = 'La date de retrait est invalide.';
            return false;
        }

        $today = now()->startOfDay();
        if ($pickupDate->lt($today)) {
            $this->errorMessage = 'La date de retrait doit être aujourd\'hui ou plus tard.';
            return false;
        }

        $maxDays = match ($this->businessType) {
            'supermarche' => 2,
            'restaurant', 'boulangerie', 'fruits_legumes' => 1,
            default => 1,
        };

        $latestByType = $today->copy()->addDays($maxDays);
        if ($pickupDate->gt($latestByType)) {
            $this->errorMessage = $maxDays === 1
                ? 'Le retrait doit avoir lieu aujourd\'hui ou demain.'
                : 'Le retrait doit avoir lieu dans les deux prochains jours.';
            return false;
        }

        if ($this->latestAllowedDate && $pickupDate->gt($this->latestAllowedDate->copy()->startOfDay())) {
            $this->errorMessage = 'La date de retrait ne peut pas dépasser la date d\'expiration du produit.';
            return false;
        }

        return true;
    }

    public function message(): string
    {
        return $this->errorMessage ?? 'La date de retrait est invalide.';
    }
}
