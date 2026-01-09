<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case FLOOZ = 'flooz';
    case TMONEY = 'tmoney';
    case PAYSTACK = 'paystack';
    case ORANGE_MONEY = 'orange_money';
    case MTN_MOMO = 'mtn_momo';
    case ON_SITE = 'on_site';
    case WALLET = 'wallet';

    public function provider(): string
    {
        return match ($this) {
            self::FLOOZ, self::TMONEY => 'paygate', // PayGate Global for Togo Mobile Money
            self::ORANGE_MONEY, self::MTN_MOMO => 'cinetpay',
            self::PAYSTACK => 'paystack',
            self::ON_SITE => 'manual',
            self::WALLET => 'wallet',
        };
    }

    public function requiresPhone(): bool
    {
        return in_array($this, [self::FLOOZ, self::TMONEY, self::ORANGE_MONEY, self::MTN_MOMO], true);
    }

    public function isWallet(): bool
    {
        return $this === self::WALLET;
    }

    public function isInstantPayment(): bool
    {
        return in_array($this, [self::WALLET, self::ON_SITE], true);
    }

    public function requiresExternalProvider(): bool
    {
        return in_array($this, [self::FLOOZ, self::TMONEY, self::ORANGE_MONEY, self::MTN_MOMO, self::PAYSTACK], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getRechargeableMethods(): array
    {
        return [self::FLOOZ, self::TMONEY, self::ORANGE_MONEY, self::MTN_MOMO, self::PAYSTACK];
    }
}
