<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Services\Payments\Gateways\CinetPayGateway;
use App\Services\Payments\Gateways\FedaPayGateway;
use App\Services\Payments\Gateways\OnSiteGateway;
use App\Services\Payments\Gateways\PayGateGateway;
use App\Services\Payments\Gateways\PaystackGateway;
use App\Services\Payments\Gateways\WalletGateway;
use App\Services\WalletService;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function __construct(protected array $config, private ?WalletService $wallets = null)
    {
    }

    public function forMethod(PaymentMethod $method): PaymentGateway
    {
        return match ($method) {
            // Togo Mobile Money via PayGate Global
            PaymentMethod::FLOOZ,
            PaymentMethod::TMONEY => new PayGateGateway($this->config['paygate'] ?? []),
            // West Africa Mobile Money via CinetPay
            PaymentMethod::ORANGE_MONEY,
            PaymentMethod::MTN_MOMO => new CinetPayGateway($this->config['cinetpay'] ?? []),
            PaymentMethod::PAYSTACK => new PaystackGateway($this->config['paystack'] ?? []),
            PaymentMethod::ON_SITE => new OnSiteGateway(),
            PaymentMethod::WALLET => $this->walletGateway(),
        };
    }

    public function forProvider(string $provider): PaymentGateway
    {
        return match ($provider) {
            'paygate' => new PayGateGateway($this->config['paygate'] ?? []),
            'fedapay' => new FedaPayGateway($this->config['fedapay'] ?? []),
            'cinetpay' => new CinetPayGateway($this->config['cinetpay'] ?? []),
            'paystack' => new PaystackGateway($this->config['paystack'] ?? []),
            'manual' => new OnSiteGateway(),
            'wallet' => $this->walletGateway(),
            default => throw new InvalidArgumentException("Unsupported payment provider [{$provider}]."),
        };
    }

    private function walletGateway(): WalletGateway
    {
        return new WalletGateway($this->wallets ?? app(WalletService::class));
    }
}
