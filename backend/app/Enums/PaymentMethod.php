<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case FLOOZ = 'flooz';
    case TMONEY = 'tmoney';
    case PAYSTACK = 'paystack';
    case ON_SITE = 'on_site';

    public function provider(): string
    {
        return match ($this) {
            self::FLOOZ, self::TMONEY => 'paygate',
            self::PAYSTACK => 'paystack',
            self::ON_SITE => 'manual',
        };
    }

    public function requiresPhone(): bool
    {
        return in_array($this, [self::FLOOZ, self::TMONEY], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
