# Plan d'Intégration PayGate Global - Geladal

> **Version**: 1.0
> **Date**: 09 Janvier 2026
> **Statut**: En attente d'approbation

---

## 1. Analyse Comparative : PayGate vs CinetPay

### PayGate Global (Recommandé)

| Critère | Détail |
|---------|--------|
| **Spécialisation** | Togo uniquement |
| **Méthodes** | Flooz (Moov) + TMoney (Togocel) |
| **Couverture marché** | ~95% Mobile Money Togo |
| **Frais setup** | Gratuit |
| **Settlement Flooz** | J+1 (lendemain) |
| **Settlement TMoney** | Tous les 10 jours |
| **API** | Simple, REST, JSON |
| **Compte** | ✅ Déjà activé |
| **Clé API** | ✅ Disponible |

### CinetPay (Alternative)

| Critère | Détail |
|---------|--------|
| **Spécialisation** | 10 pays Afrique francophone |
| **Méthodes** | 64+ (Mobile Money, Cartes, Wallets) |
| **Frais** | 1.5% - 3.5% par transaction |
| **Complexité** | Plus élevée |
| **Avantage** | Scalabilité internationale |

### Verdict

**PayGate Global est recommandé** pour le lancement au Togo :
1. Compte déjà activé et prêt
2. API simple et bien documentée
3. Spécialisé marché togolais
4. Settlement Flooz rapide (J+1)
5. Pas de frais de setup

**CinetPay** sera pertinent pour l'expansion vers d'autres pays (Côte d'Ivoire, Sénégal, etc.)

---

## 2. État Actuel vs API Réelle

### Implémentation Actuelle (INCORRECTE)

```php
// backend/app/Services/Payments/Gateways/PayGateGateway.php
// PROBLÈMES:
- Utilise Basic Auth (merchant_id/password) ❌
- Endpoint: /transactions ❌
- Paramètres incorrects ❌
```

### API PayGate Réelle (Documentation)

```
POST https://paygateglobal.com/api/v1/pay
Content-Type: application/json

{
    "auth_token": "bbbacdbc-1e67-42bd-8517-90d712b2bab5",
    "phone_number": "22890123456",
    "amount": 500,
    "identifier": "reservation_123",
    "network": "FLOOZ",
    "description": "Paiement réservation #RES123"
}
```

---

## 3. Architecture Cible

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUX PAIEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 Mobile App (React Native)                                   │
│     │                                                           │
│     ├─── 1. User sélectionne produit → Panier                  │
│     │                                                           │
│     ├─── 2. Checkout: Choix méthode paiement                   │
│     │       [FLOOZ] [TMONEY] [Sur place] [Wallet]              │
│     │                                                           │
│     ├─── 3. Si Mobile Money: Saisie numéro téléphone           │
│     │                                                           │
│     └─── 4. POST /api/reservations                             │
│                 │                                               │
│  ───────────────┼───────────────────────────────────────────── │
│                 ▼                                               │
│  🖥️ Backend Laravel                                             │
│     │                                                           │
│     ├─── 5. ReservationService::createReservation()            │
│     │       - Crée Reservation (status: pending)               │
│     │       - Si payment_method != on_site:                    │
│     │         └── PaymentService::initializePayment()          │
│     │                                                           │
│     ├─── 6. PayGateGateway::initialize()                       │
│     │       - POST https://paygateglobal.com/api/v1/pay        │
│     │       - Reçoit tx_reference + status                     │
│     │       - Sauvegarde Payment (status: pending)             │
│     │                                                           │
│     └─── 7. Retourne réponse au mobile                         │
│                 │                                               │
│  ───────────────┼───────────────────────────────────────────── │
│                 ▼                                               │
│  📱 Mobile App                                                  │
│     │                                                           │
│     └─── 8. Affiche "En attente de validation"                 │
│             + Instructions USSD                                 │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  📞 Client (Téléphone)                                          │
│     │                                                           │
│     └─── 9. Reçoit notification USSD → Tape PIN                │
│                 │                                               │
│  ───────────────┼───────────────────────────────────────────── │
│                 ▼                                               │
│  🏦 PayGate Global                                              │
│     │                                                           │
│     └─── 10. POST webhook vers callback_url                    │
│                 │                                               │
│  ───────────────┼───────────────────────────────────────────── │
│                 ▼                                               │
│  🖥️ Backend Laravel                                             │
│     │                                                           │
│     ├─── 11. PaymentController::paygateWebhook()               │
│     │        - Vérifie payload                                 │
│     │        - Met à jour Payment (status: success/failed)     │
│     │                                                           │
│     ├─── 12. Si SUCCESS:                                       │
│     │        - Reservation::confirm()                          │
│     │        - Notification push au client                     │
│     │        - Notification au commerçant                      │
│     │                                                           │
│     └─── 13. Si FAILED/EXPIRED:                                │
│              - Payment::markFailed()                           │
│              - Notification au client                          │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  📱 Mobile App                                                  │
│     │                                                           │
│     └─── 14. Reçoit push notification                          │
│              - "Paiement confirmé!" ou "Paiement échoué"       │
│              - Rafraîchit écran réservations                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Fichiers à Modifier/Créer

### 4.1 Backend Laravel

#### A. Configuration (Modifier)

**Fichier**: `backend/config/payments.php`

```php
'paygate' => [
    'base_url' => env('PAYGATE_BASE_URL', 'https://paygateglobal.com/api/v1'),
    'auth_token' => env('PAYGATE_AUTH_TOKEN'),  // NOUVEAU
    'callback_url' => env('PAYGATE_CALLBACK_URL'),
    'networks' => [
        'flooz' => 'FLOOZ',
        'tmoney' => 'TMONEY',
    ],
],
```

**Fichier**: `backend/.env`

```env
# PayGate Global Configuration
PAYGATE_BASE_URL=https://paygateglobal.com/api/v1
PAYGATE_AUTH_TOKEN=bbbacdbc-1e67-42bd-8517-90d712b2bab5
PAYGATE_CALLBACK_URL=https://antigaspi.jubtek.com/api/webhook/paygate
```

#### B. Gateway (Réécrire)

**Fichier**: `backend/app/Services/Payments/Gateways/PayGateGateway.php`

```php
<?php

namespace App\Services\Payments\Gateways;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\Payments\Exceptions\PaymentException;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayGateGateway implements PaymentGateway
{
    private const STATUS_SUCCESS = 0;
    private const STATUS_PENDING = 2;
    private const STATUS_EXPIRED = 4;
    private const STATUS_CANCELLED = 6;

    private const INIT_SUCCESS = 0;
    private const INIT_INVALID_TOKEN = 2;
    private const INIT_INVALID_PARAMS = 4;
    private const INIT_DUPLICATE = 6;

    public function __construct(private array $config)
    {
    }

    /**
     * Initier un paiement Mobile Money via PayGate
     */
    public function initialize(Reservation $reservation, Payment $payment, array $data = []): Payment
    {
        $method = $payment->payment_method instanceof PaymentMethod
            ? $payment->payment_method
            : PaymentMethod::from($payment->payment_method);

        $identifier = $this->generateIdentifier($reservation);
        $customerPhone = $this->formatPhoneNumber($data['customer_phone'] ?? $payment->customer_phone);

        $payload = [
            'auth_token' => $this->config['auth_token'],
            'phone_number' => $customerPhone,
            'amount' => (int) $payment->amount, // PayGate attend un entier
            'identifier' => $identifier,
            'network' => $this->networkFor($method),
            'description' => "Paiement réservation #{$reservation->reservation_code}",
        ];

        Log::info('PayGate: Initializing payment', [
            'reservation_id' => $reservation->id,
            'identifier' => $identifier,
            'amount' => $payload['amount'],
            'network' => $payload['network'],
        ]);

        $response = Http::timeout(30)
            ->post($this->config['base_url'] . '/pay', $payload);

        $body = $response->json();

        // Vérifier le status de l'initialisation
        $initStatus = $body['status'] ?? -1;

        if ($initStatus !== self::INIT_SUCCESS) {
            $errorMessage = match ($initStatus) {
                self::INIT_INVALID_TOKEN => 'Token d\'authentification invalide',
                self::INIT_INVALID_PARAMS => 'Paramètres invalides',
                self::INIT_DUPLICATE => 'Transaction en double (identifier déjà utilisé)',
                default => 'Erreur inconnue PayGate: ' . ($body['message'] ?? 'N/A'),
            };

            Log::error('PayGate: Initialization failed', [
                'status' => $initStatus,
                'response' => $body,
            ]);

            throw PaymentException::initializationFailed($errorMessage);
        }

        $payment->fill([
            'status' => PaymentStatus::PENDING,
            'provider' => 'paygate',
            'reference' => $identifier,
            'transaction_id' => $body['tx_reference'] ?? null,
            'customer_phone' => $customerPhone,
            'payload' => [
                'initialize' => [
                    'request' => array_diff_key($payload, ['auth_token' => '']),
                    'response' => $body,
                ],
            ],
        ])->save();

        Log::info('PayGate: Payment initialized successfully', [
            'payment_id' => $payment->id,
            'tx_reference' => $body['tx_reference'] ?? null,
        ]);

        return $payment->refresh();
    }

    /**
     * Vérifier le statut d'un paiement
     */
    public function refreshStatus(Payment $payment): Payment
    {
        // Utiliser l'API v2 avec identifier (notre référence)
        $response = Http::timeout(30)
            ->post($this->config['base_url'] . '/../v2/status', [
                'auth_token' => $this->config['auth_token'],
                'identifier' => $payment->reference,
            ]);

        if (!$response->successful()) {
            Log::warning('PayGate: Status check failed', [
                'payment_id' => $payment->id,
                'response' => $response->body(),
            ]);
            return $payment;
        }

        $body = $response->json();
        $status = $this->mapStatus($body['status'] ?? -1);

        $payment->fill([
            'status' => $status,
            'paid_at' => $status === PaymentStatus::SUCCESS ? now() : $payment->paid_at,
            'transaction_id' => $body['tx_reference'] ?? $payment->transaction_id,
            'payload' => array_merge($payment->payload ?? [], [
                'status_check' => [
                    'checked_at' => now()->toISOString(),
                    'response' => $body,
                ],
            ]),
        ])->save();

        return $payment->refresh();
    }

    /**
     * Traiter le webhook de confirmation PayGate
     */
    public function handleCallback(array $payload): ?Payment
    {
        Log::info('PayGate: Webhook received', $payload);

        // PayGate envoie 'identifier' qui est notre référence
        $identifier = $payload['identifier'] ?? null;

        if (!$identifier) {
            Log::warning('PayGate: Webhook missing identifier');
            return null;
        }

        $payment = Payment::where('reference', $identifier)
            ->where('provider', 'paygate')
            ->first();

        if (!$payment) {
            Log::warning('PayGate: Payment not found for identifier', [
                'identifier' => $identifier,
            ]);
            return null;
        }

        // Mapper le statut depuis le webhook
        // Note: Le webhook PayGate envoie un paiement confirmé directement
        $payment->fill([
            'status' => PaymentStatus::SUCCESS,
            'paid_at' => now(),
            'transaction_id' => $payload['tx_reference'] ?? $payment->transaction_id,
            'payload' => array_merge($payment->payload ?? [], [
                'webhook' => [
                    'received_at' => now()->toISOString(),
                    'payload' => $payload,
                ],
            ]),
        ])->save();

        Log::info('PayGate: Payment confirmed via webhook', [
            'payment_id' => $payment->id,
            'amount' => $payload['amount'] ?? 'N/A',
            'payment_method' => $payload['payment_method'] ?? 'N/A',
        ]);

        return $payment->refresh();
    }

    /**
     * Annuler un paiement (non supporté par PayGate - les paiements expirent automatiquement)
     */
    public function cancel(Payment $payment, array $context = []): Payment
    {
        // PayGate ne supporte pas l'annulation - les paiements expirent après timeout
        $payment->fill([
            'status' => PaymentStatus::FAILED,
            'payload' => array_merge($payment->payload ?? [], [
                'cancel' => [
                    'cancelled_at' => now()->toISOString(),
                    'reason' => $context['reason'] ?? 'Cancelled by user',
                ],
            ]),
        ])->save();

        return $payment->refresh();
    }

    /**
     * Mapper le code status PayGate vers PaymentStatus
     */
    private function mapStatus(int $status): PaymentStatus
    {
        return match ($status) {
            self::STATUS_SUCCESS => PaymentStatus::SUCCESS,
            self::STATUS_PENDING => PaymentStatus::PENDING,
            self::STATUS_EXPIRED, self::STATUS_CANCELLED => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    /**
     * Générer un identifiant unique pour la transaction
     */
    private function generateIdentifier(Reservation $reservation): string
    {
        return 'GLD-' . $reservation->id . '-' . time();
    }

    /**
     * Formater le numéro de téléphone (format international Togo)
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Supprimer tous les caractères non numériques
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Si le numéro commence par 228, c'est déjà bon
        if (str_starts_with($phone, '228')) {
            return $phone;
        }

        // Si le numéro commence par 0, le remplacer par 228
        if (str_starts_with($phone, '0')) {
            return '228' . substr($phone, 1);
        }

        // Sinon, ajouter le préfixe 228
        return '228' . $phone;
    }

    /**
     * Obtenir le code réseau PayGate pour la méthode de paiement
     */
    private function networkFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::FLOOZ => 'FLOOZ',
            PaymentMethod::TMONEY => 'TMONEY',
            default => throw PaymentException::initializationFailed(
                "Méthode de paiement {$method->value} non supportée par PayGate"
            ),
        };
    }
}
```

#### C. Webhook Controller (Modifier)

**Fichier**: `backend/app/Http/Controllers/Api/PaymentController.php`

Ajouter/modifier la méthode webhook:

```php
/**
 * Webhook PayGate - Reçoit les confirmations de paiement
 *
 * POST /api/webhook/paygate
 */
public function paygateWebhook(Request $request)
{
    Log::info('PayGate Webhook received', $request->all());

    try {
        $gateway = app(PaymentGatewayManager::class)->forProvider('paygate');
        $payment = $gateway->handleCallback($request->all());

        if ($payment && $payment->status === PaymentStatus::SUCCESS) {
            // Confirmer la réservation
            $reservation = $payment->reservation;
            if ($reservation && $reservation->status === 'pending') {
                $reservation->confirm();

                // Envoyer notifications
                $this->sendPaymentConfirmationNotifications($reservation, $payment);
            }
        }

        return response()->json(['status' => 'ok']);
    } catch (\Exception $e) {
        Log::error('PayGate Webhook error', [
            'error' => $e->getMessage(),
            'payload' => $request->all(),
        ]);

        // Toujours retourner 200 pour éviter les retry infinis
        return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

private function sendPaymentConfirmationNotifications(Reservation $reservation, Payment $payment)
{
    // Notification au client
    $reservation->user->notify(new PaymentConfirmedNotification($reservation, $payment));

    // Notification au commerçant
    $reservation->product->merchant->user->notify(
        new NewPaidReservationNotification($reservation)
    );
}
```

#### D. Routes (Modifier)

**Fichier**: `backend/routes/api.php`

```php
// Webhooks publics (pas d'auth)
Route::prefix('webhook')->group(function () {
    Route::post('/paygate', [PaymentController::class, 'paygateWebhook'])
        ->name('webhook.paygate');
    // ... autres webhooks
});
```

#### E. Provider Mapping (Modifier)

**Fichier**: `backend/app/Services/Payments/PaymentService.php`

```php
protected function providerFor(PaymentMethod $method): string
{
    return match ($method) {
        PaymentMethod::FLOOZ => 'paygate',      // Changé de 'fedapay'
        PaymentMethod::TMONEY => 'paygate',     // Changé de 'fedapay'
        PaymentMethod::ORANGE_MONEY => 'cinetpay',
        PaymentMethod::MTN_MOMO => 'cinetpay',
        PaymentMethod::PAYSTACK => 'paystack',
        PaymentMethod::WALLET => 'wallet',
        PaymentMethod::ON_SITE => 'manual',
        default => throw new \InvalidArgumentException("No provider for {$method->value}"),
    };
}
```

---

### 4.2 Mobile React Native

#### A. Service Paiement (Créer/Modifier)

**Fichier**: `mobile/src/services/paymentService.ts`

```typescript
import api from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  network?: 'FLOOZ' | 'TMONEY';
  requiresPhone: boolean;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'flooz',
    name: 'Flooz',
    icon: 'phone-portrait-outline',
    network: 'FLOOZ',
    requiresPhone: true,
    description: 'Payer avec Moov Money',
  },
  {
    id: 'tmoney',
    name: 'TMoney',
    icon: 'phone-portrait-outline',
    network: 'TMONEY',
    requiresPhone: true,
    description: 'Payer avec Togocel',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: 'wallet-outline',
    requiresPhone: false,
    description: 'Payer avec votre solde Geladal',
  },
  {
    id: 'on_site',
    name: 'Sur place',
    icon: 'storefront-outline',
    requiresPhone: false,
    description: 'Payer à la récupération',
  },
];

export const checkPaymentStatus = async (paymentId: number) => {
  const response = await api.get(`/payments/${paymentId}/status`);
  return response.data;
};

export const isMobileMoneyMethod = (method: string): boolean => {
  return ['flooz', 'tmoney'].includes(method);
};

export const formatPhoneForPayment = (phone: string): string => {
  // Supprimer espaces et tirets
  let cleaned = phone.replace(/[\s-]/g, '');

  // Ajouter préfixe Togo si nécessaire
  if (!cleaned.startsWith('228')) {
    if (cleaned.startsWith('0')) {
      cleaned = '228' + cleaned.substring(1);
    } else {
      cleaned = '228' + cleaned;
    }
  }

  return cleaned;
};
```

#### B. Écran Paiement (Créer)

**Fichier**: `mobile/src/screens/main/PaymentScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { PAYMENT_METHODS, isMobileMoneyMethod, formatPhoneForPayment } from '../../services/paymentService';

interface PaymentScreenProps {
  route: {
    params: {
      reservationId: number;
      amount: number;
      onPaymentComplete: () => void;
    };
  };
  navigation: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route, navigation }) => {
  const { reservationId, amount, onPaymentComplete } = route.params;
  const theme = useTheme();
  const haptics = useHaptics();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  const surfaceColor = theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light;
  const borderColor = theme.isDark ? theme.colors.neutral[600] : theme.colors.border;

  const handleMethodSelect = async (methodId: string) => {
    await haptics.lightTap();
    setSelectedMethod(methodId);
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (isMobileMoneyMethod(selectedMethod) && !phoneNumber) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');
    await haptics.mediumTap();

    try {
      // Appel API pour initier le paiement
      const response = await api.post('/payments/initiate', {
        reservation_id: reservationId,
        payment_method: selectedMethod,
        customer_phone: isMobileMoneyMethod(selectedMethod)
          ? formatPhoneForPayment(phoneNumber)
          : undefined,
      });

      if (response.data.success) {
        // Afficher les instructions
        Alert.alert(
          'Paiement initié',
          'Vous allez recevoir une notification sur votre téléphone. Veuillez entrer votre code PIN pour confirmer le paiement.',
          [{ text: 'OK' }]
        );

        // Polling du statut ou attente du webhook
        // Le statut sera mis à jour via push notification
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      await haptics.error();
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Paiement
      </Text>

      <Text style={[styles.amount, { color: theme.colors.primary[500] }]}>
        {amount.toLocaleString()} XOF
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Choisir une méthode de paiement
      </Text>

      <View style={styles.methodsContainer}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              {
                backgroundColor: surfaceColor,
                borderColor: selectedMethod === method.id
                  ? theme.colors.primary[500]
                  : borderColor,
                borderWidth: selectedMethod === method.id ? 2 : 1,
              },
            ]}
            onPress={() => handleMethodSelect(method.id)}
          >
            <Ionicons
              name={method.icon as any}
              size={24}
              color={selectedMethod === method.id
                ? theme.colors.primary[500]
                : theme.colors.textSecondary}
            />
            <Text style={[styles.methodName, { color: theme.colors.text }]}>
              {method.name}
            </Text>
            <Text style={[styles.methodDesc, { color: theme.colors.textSecondary }]}>
              {method.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedMethod && isMobileMoneyMethod(selectedMethod) && (
        <View style={styles.phoneContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Numéro de téléphone
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: surfaceColor,
                borderColor: borderColor,
                color: theme.colors.text,
              },
            ]}
            placeholder="Ex: 90123456"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
            Vous recevrez une notification pour confirmer le paiement
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.payButton,
          {
            backgroundColor: selectedMethod
              ? theme.colors.primary[500]
              : theme.colors.neutral[400],
          },
        ]}
        onPress={handlePayment}
        disabled={!selectedMethod || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.payButtonText}>
            Payer {amount.toLocaleString()} XOF
          </Text>
        )}
      </TouchableOpacity>

      {paymentStatus === 'pending' && (
        <View style={styles.pendingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={[styles.pendingText, { color: theme.colors.text }]}>
            En attente de confirmation...
          </Text>
          <Text style={[styles.pendingHint, { color: theme.colors.textSecondary }]}>
            Vérifiez votre téléphone et entrez votre code PIN
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  methodDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  phoneContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  payButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  pendingHint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
```

#### C. Modifier CartScreen (Intégrer PayGate)

**Fichier**: `mobile/src/screens/main/CartScreen.tsx`

Modifications à apporter:
- Limiter les méthodes de paiement à: `flooz`, `tmoney`, `wallet`, `on_site`
- Ajouter la validation du numéro de téléphone pour Flooz/TMoney
- Afficher les instructions après initiation du paiement

---

## 5. Plan d'Exécution

### Phase 1: Backend (Jour 1-2)

| # | Tâche | Fichier | Priorité |
|---|-------|---------|----------|
| 1.1 | Configurer .env avec clé PayGate | `.env` | CRITIQUE |
| 1.2 | Modifier config/payments.php | `config/payments.php` | CRITIQUE |
| 1.3 | Réécrire PayGateGateway.php | `Services/Payments/Gateways/` | CRITIQUE |
| 1.4 | Ajouter route webhook | `routes/api.php` | CRITIQUE |
| 1.5 | Modifier PaymentController webhook | `Controllers/Api/` | CRITIQUE |
| 1.6 | Changer provider mapping | `PaymentService.php` | HAUTE |
| 1.7 | Tester avec curl | - | HAUTE |

### Phase 2: Mobile (Jour 3-4)

| # | Tâche | Fichier | Priorité |
|---|-------|---------|----------|
| 2.1 | Créer paymentService.ts | `services/paymentService.ts` | HAUTE |
| 2.2 | Modifier CartScreen.tsx | `screens/main/CartScreen.tsx` | HAUTE |
| 2.3 | Ajouter écran PaymentScreen | `screens/main/PaymentScreen.tsx` | MOYENNE |
| 2.4 | Gérer push notification paiement | `services/notificationService.ts` | HAUTE |
| 2.5 | Tester sur device | - | CRITIQUE |

### Phase 3: Tests & Déploiement (Jour 5)

| # | Tâche | Priorité |
|---|-------|----------|
| 3.1 | Test complet flux Flooz | CRITIQUE |
| 3.2 | Test complet flux TMoney | CRITIQUE |
| 3.3 | Test webhook callback | CRITIQUE |
| 3.4 | Test cas d'erreur (timeout, annulation) | HAUTE |
| 3.5 | Déployer backend production | CRITIQUE |
| 3.6 | Build APK avec paiement | CRITIQUE |

---

## 6. Tests de Validation

### 6.1 Test Backend (curl)

```bash
# Test initialisation paiement
curl -X POST https://antigaspi.jubtek.com/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": 123,
    "payment_method": "flooz",
    "customer_phone": "22890123456"
  }'

# Test status paiement
curl -X GET https://antigaspi.jubtek.com/api/payments/123/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.2 Test Webhook (simulé)

```bash
# Simuler callback PayGate
curl -X POST https://antigaspi.jubtek.com/api/webhook/paygate \
  -H "Content-Type: application/json" \
  -d '{
    "tx_reference": "PG123456",
    "identifier": "GLD-123-1704789600",
    "payment_reference": "FLOOZ_REF_789",
    "amount": 500,
    "datetime": "2026-01-09 12:30:00",
    "payment_method": "FLOOZ",
    "phone_number": "22890123456"
  }'
```

### 6.3 Checklist Validation

- [ ] Paiement Flooz initié correctement
- [ ] Paiement TMoney initié correctement
- [ ] Client reçoit notification USSD
- [ ] Webhook reçu et traité
- [ ] Réservation confirmée automatiquement
- [ ] Notification push envoyée au client
- [ ] Notification envoyée au commerçant
- [ ] Cas timeout géré (paiement expiré)
- [ ] Cas annulation géré

---

## 7. Sécurité

### 7.1 Points Critiques

| Point | Solution |
|-------|----------|
| Clé API exposée | Stocker dans .env, jamais dans le code |
| Webhook spoofé | Vérifier IP source PayGate (si fournie) |
| Double paiement | Identifier unique par réservation |
| Injection SQL | Utiliser Eloquent ORM (déjà en place) |

### 7.2 Variables Sensibles

```env
# NE JAMAIS COMMIT DANS GIT
PAYGATE_AUTH_TOKEN=bbbacdbc-1e67-42bd-8517-90d712b2bab5
```

Ajouter au `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 8. Monitoring Post-Déploiement

### 8.1 Logs à Surveiller

```bash
# Logs PayGate
tail -f storage/logs/laravel.log | grep PayGate

# Erreurs paiement
tail -f storage/logs/laravel.log | grep -E "(PayGate|payment|webhook)"
```

### 8.2 Métriques à Suivre

- Taux de succès paiement Flooz
- Taux de succès paiement TMoney
- Temps moyen de confirmation
- Nombre de timeouts/expirations
- Erreurs webhook

---

## 9. Rollback Plan

Si problème critique après déploiement:

1. **Désactiver paiement en ligne**:
   ```php
   // PaymentService.php - forcer on_site
   return 'manual'; // Temporaire
   ```

2. **Reverter le code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Informer les utilisateurs**:
   - Push notification: "Paiement en ligne temporairement indisponible"

---

## 10. Estimation Finale

| Phase | Durée | Risque |
|-------|-------|--------|
| Backend | 2 jours | Moyen |
| Mobile | 2 jours | Faible |
| Tests | 1 jour | Moyen |
| **TOTAL** | **5 jours** | Moyen |

---

**Prêt pour validation et implémentation.**
