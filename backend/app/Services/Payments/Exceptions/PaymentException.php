<?php

namespace App\Services\Payments\Exceptions;

use RuntimeException;

class PaymentException extends RuntimeException
{
    public static function initializationFailed(string $message = 'Unable to initialize payment'): self
    {
        return new self($message);
    }

    public static function refreshFailed(string $message = 'Unable to refresh payment status'): self
    {
        return new self($message);
    }

    public static function cancellationFailed(string $message = 'Unable to cancel payment'): self
    {
        return new self($message);
    }
}
