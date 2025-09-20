<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Services\Payments\Gateways\OnSiteGateway;
use App\Services\Payments\Gateways\PayGateGateway;
use App\Services\Payments\Gateways\PaystackGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function __construct(protected array $config)
    {
    }

    public function forMethod(PaymentMethod $method): PaymentGateway
    {
        return match ($method) {
            PaymentMethod::FLOOZ, PaymentMethod::TMONEY => new PayGateGateway($this->config['paygate'] ?? []),
            PaymentMethod::PAYSTACK => new PaystackGateway($this->config['paystack'] ?? []),
            PaymentMethod::ON_SITE => new OnSiteGateway(),
        };
    }

    public function forProvider(string $provider): PaymentGateway
    {
        return match ($provider) {
            'paygate' => new PayGateGateway($this->config['paygate'] ?? []),
            'paystack' => new PaystackGateway($this->config['paystack'] ?? []),
            'manual' => new OnSiteGateway(),
            default => throw new InvalidArgumentException("Unsupported payment provider [{$provider}]."),
        };
    }
}
