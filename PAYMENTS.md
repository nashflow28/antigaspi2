# Payment Integration Guide

This document explains how payments are configured and orchestrated inside the Antigaspi backend.

## Supported methods

| Method  | Enum value  | Provider | Notes |
|---------|-------------|----------|-------|
| Flooz   | `flooz`     | PayGate  | Requires customer phone number. |
| Tmoney  | `tmoney`    | PayGate  | Requires customer phone number. |
| Paystack| `paystack`  | Paystack | Requires customer email. |
| On-site | `on_site`   | Manual   | No remote call, marks reservation for in-person payment. |

Payment types are represented by `App\Enums\PaymentMethod` and payment state by `App\Enums\PaymentStatus`.

## Configuration

All credentials are loaded from environment variables via `config/payments.php`:

```env
PAYMENTS_CURRENCY=XOF

PAYGATE_BASE_URL=https://paygateglobal.com/api/v1
PAYGATE_MERCHANT_ID=
PAYGATE_MERCHANT_PASSWORD=
PAYGATE_CALLBACK_URL=https://example.com/api/payments/webhook/paygate
PAYGATE_SERVICE_FLOOZ=FLOOZ
PAYGATE_SERVICE_TMONEY=TMONEY

PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_CALLBACK_URL=https://example.com/api/payments/webhook/paystack
```

Update your `.env` file with real credentials in production. The default currency is `XOF` but can be overridden per environment.

## Gateway contract

All payment providers implement `App\Services\Payments\PaymentGateway` which exposes four methods:

- `initialize(Reservation $reservation, Payment $payment, array $data = [])`
- `refreshStatus(Payment $payment)`
- `handleCallback(array $payload)`
- `cancel(Payment $payment, array $context = [])`

`App\Services\Payments\PaymentService` coordinates persistence, selects the appropriate gateway using `PaymentGatewayManager`, and keeps reservations in sync (successful payments confirm the reservation, failed payments cancel it and release stock).

## Database schema changes

The `payments` table now stores:

- `payment_method` / `status` enforced by enums
- Provider metadata (`provider`, `checkout_url`, `customer_phone`, `reference`, `payload`)

Reservations have two additional fields:

- `payment_status` (enum mirroring the latest payment)
- `latest_payment_id` (foreign key to the most recent `payments` row)

## API workflow

1. **Reservation creation** (`POST /reservations`)
   - Requires `payment_method` (and `customer_phone` for Flooz/Tmoney).
   - The reservation and payment are created inside a transaction.
   - Response includes both the reservation resource and the payment payload (checkout URL, reference, etc.).

2. **Payment management** (`POST /payments`, `GET /payments/{id}`, `POST /payments/{id}/cancel`)
   - Allows retrying a failed payment or cancelling a pending one.

3. **Webhooks**
   - `POST /payments/webhook/paygate`
   - `POST /payments/webhook/paystack`

Webhook endpoints reconcile payment statuses and automatically update reservation state.

Use the feature tests in `tests/Feature/PaymentFlowTest.php` as examples for mocking providers in local or CI environments.
