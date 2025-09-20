<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case SUCCESS = 'success';
    case FAILED = 'failed';
    case ON_SITE = 'on_site';
    case REFUNDED = 'refunded';

    public function isFinal(): bool
    {
        return in_array($this, [self::SUCCESS, self::FAILED, self::REFUNDED], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
