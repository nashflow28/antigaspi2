<?php

namespace App\Http\Controllers;

use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class WalletController extends Controller
{
    public function __construct(
        private WalletService $walletService
    ) {
        // Middleware is handled in routes
    }

    public function getWallet(): JsonResponse
    {
        try {
            $user = Auth::user();
            $wallet = $this->walletService->getOrCreateWallet($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'wallet' => [
                        'id' => $wallet->id,
                        'balance' => $wallet->balance,
                        'formatted_balance' => $wallet->formatted_balance,
                        'currency' => $wallet->currency,
                        'daily_limit' => $wallet->daily_limit,
                        'remaining_daily_limit' => $wallet->remaining_daily_limit,
                        'is_active' => $wallet->is_active,
                        'has_pin' => $wallet->hasPin(),
                        'last_transaction_at' => $wallet->last_transaction_at,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du portefeuille',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function setPin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|min:4|max:6|regex:/^[0-9]+$/',
        ], [
            'pin.required' => 'Le code PIN est requis',
            'pin.min' => 'Le code PIN doit contenir au moins 4 chiffres',
            'pin.max' => 'Le code PIN ne peut pas dépasser 6 chiffres',
            'pin.regex' => 'Le code PIN ne doit contenir que des chiffres',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $this->walletService->setWalletPin($user, $request->pin);

            return response()->json([
                'success' => true,
                'message' => 'Code PIN configuré avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function changePin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_pin' => 'required|string',
            'new_pin' => 'required|string|min:4|max:6|regex:/^[0-9]+$/',
        ], [
            'current_pin.required' => 'Le code PIN actuel est requis',
            'new_pin.required' => 'Le nouveau code PIN est requis',
            'new_pin.min' => 'Le nouveau code PIN doit contenir au moins 4 chiffres',
            'new_pin.max' => 'Le nouveau code PIN ne peut pas dépasser 6 chiffres',
            'new_pin.regex' => 'Le nouveau code PIN ne doit contenir que des chiffres',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $this->walletService->changeWalletPin($user, $request->current_pin, $request->new_pin);

            return response()->json([
                'success' => true,
                'message' => 'Code PIN modifié avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function toggleStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $wallet = $this->walletService->toggleWalletStatus($user, $request->is_active);

            return response()->json([
                'success' => true,
                'message' => $request->is_active ? 'Portefeuille activé' : 'Portefeuille désactivé',
                'data' => [
                    'wallet' => [
                        'is_active' => $wallet->is_active,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateDailyLimit(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'daily_limit' => 'required|numeric|min:0|max:1000000',
        ], [
            'daily_limit.required' => 'La limite quotidienne est requise',
            'daily_limit.numeric' => 'La limite quotidienne doit être un nombre',
            'daily_limit.min' => 'La limite quotidienne ne peut pas être négative',
            'daily_limit.max' => 'La limite quotidienne ne peut pas dépasser 1 000 000 XOF',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $wallet = $this->walletService->updateDailyLimit($user, $request->daily_limit);

            return response()->json([
                'success' => true,
                'message' => 'Limite quotidienne mise à jour',
                'data' => [
                    'wallet' => [
                        'daily_limit' => $wallet->daily_limit,
                        'remaining_daily_limit' => $wallet->remaining_daily_limit,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getTransactions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:credit,debit',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'amount_min' => 'nullable|numeric|min:0',
            'amount_max' => 'nullable|numeric|min:0',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres de filtrage invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $filters = $request->only(['type', 'date_from', 'date_to', 'amount_min', 'amount_max', 'per_page']);
            $transactions = $this->walletService->getWalletTransactions($user, $filters);

            return response()->json([
                'success' => true,
                'data' => [
                    'transactions' => $transactions->items(),
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'last_page' => $transactions->lastPage(),
                        'per_page' => $transactions->perPage(),
                        'total' => $transactions->total(),
                        'from' => $transactions->firstItem(),
                        'to' => $transactions->lastItem(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getStats(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'period' => 'nullable|in:day,week,month,year',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Période invalide',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $period = $request->input('period', 'month');
            $stats = $this->walletService->getWalletStats($user, $period);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function transfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|min:50|max:500000',
            'description' => 'nullable|string|max:255',
            'pin' => 'required|string',
        ], [
            'receiver_id.required' => 'Le destinataire est requis',
            'receiver_id.exists' => 'Utilisateur destinataire non trouvé',
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant minimum est de 50 XOF',
            'amount.max' => 'Le montant maximum est de 500 000 XOF',
            'pin.required' => 'Le code PIN est requis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $sender = Auth::user();

            // BUG-012 FIX: Wrap findOrFail in try-catch for user-friendly error
            try {
                $receiver = \App\Models\User::findOrFail($request->receiver_id);
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur destinataire non trouvé',
                ], 404);
            }

            // BUG-011 FIX: PIN verification moved inside transferBetweenWallets() for atomic operation
            // The PIN is now passed to the service method and verified inside the transaction
            $description = $request->input('description', 'Transfert entre portefeuilles');
            $result = $this->walletService->transferBetweenWallets($sender, $receiver, $request->amount, $description, $request->pin);

            return response()->json([
                'success' => true,
                'message' => 'Transfert effectué avec succès',
                'data' => [
                    'transfer' => [
                        'amount' => $request->amount,
                        'receiver' => [
                            'id' => $receiver->id,
                            'name' => $receiver->full_name,
                        ],
                        'debit_transaction_id' => $result['debit_transaction']->id,
                        'credit_transaction_id' => $result['credit_transaction']->id,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function processPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:50|max:500000',
            'description' => 'nullable|string|max:255',
            'pin' => 'required|string',
        ], [
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant minimum est de 50 XOF',
            'amount.max' => 'Le montant maximum est de 500 000 XOF',
            'pin.required' => 'Le code PIN est requis',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $description = $request->input('description', 'Paiement commande');

            $transaction = $this->walletService->processWalletPayment(
                $user,
                $request->amount,
                $description,
                $request->pin
            );

            return response()->json([
                'success' => true,
                'message' => 'Paiement effectué avec succès',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'formatted_amount' => $transaction->formatted_amount,
                        'description' => $transaction->description,
                        'reference' => $transaction->reference,
                        'created_at' => $transaction->created_at,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function recharge(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:100|max:1000000',
            'payment_method' => 'required|in:flooz,tmoney,orange_money,mtn_momo,paystack',
            'phone' => 'required_if:payment_method,flooz,tmoney,orange_money,mtn_momo|string',
            'currency' => 'nullable|string|in:XOF', // 🐛 BUG FIX #35: Only accept XOF
        ], [
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant minimum de recharge est de 100 XOF',
            'amount.max' => 'Le montant maximum de recharge est de 1 000 000 XOF',
            'payment_method.required' => 'La méthode de paiement est requise',
            'payment_method.in' => 'Méthode de paiement non supportée',
            'phone.required_if' => 'Le numéro de téléphone est requis pour les recharges Mobile Money',
            'currency.in' => 'Seule la devise XOF est acceptée', // 🐛 BUG FIX #35
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 🐛 BUG FIX #35: Ensure currency is XOF if provided, default to XOF if not
        $currency = $request->input('currency', 'XOF');
        if ($currency !== 'XOF') {
            return response()->json([
                'success' => false,
                'message' => 'Seule la devise XOF est acceptée pour les recharges',
                'errors' => ['currency' => ['Seule la devise XOF est acceptée']],
            ], 422);
        }

        try {
            return response()->json([
                'success' => false,
                'message' => 'La recharge de portefeuille sera implémentée dans la prochaine phase',
                'data' => [
                    'amount' => $request->amount,
                    'payment_method' => $request->payment_method,
                    'currency' => 'XOF', // 🐛 BUG FIX #35: Always XOF
                    'status' => 'coming_soon',
                ],
            ], 501);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test recharge - ONLY FOR DEVELOPMENT/TESTING
     * Directly credits the wallet without payment processing
     */
    public function testRecharge(Request $request): JsonResponse
    {
        // Allow test recharge if:
        // 1. Not in production, OR
        // 2. APP_DEBUG is true, OR
        // 3. ALLOW_TEST_RECHARGE env variable is set to true
        $allowTestRecharge = !app()->environment('production')
            || config('app.debug')
            || env('ALLOW_TEST_RECHARGE', false);

        if (!$allowTestRecharge) {
            return response()->json([
                'success' => false,
                'message' => 'Cette fonctionnalité n\'est disponible qu\'en mode test',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:100|max:100000',
        ], [
            'amount.required' => 'Le montant est requis',
            'amount.min' => 'Le montant minimum est de 100 XOF',
            'amount.max' => 'Le montant maximum de test est de 100 000 XOF',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $description = 'Recharge de test - Mode développement';

            $transaction = $this->walletService->rechargeWallet(
                $user,
                $request->amount,
                $description
            );

            $wallet = $this->walletService->getOrCreateWallet($user);

            return response()->json([
                'success' => true,
                'message' => 'Recharge de test effectuée avec succès',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'formatted_amount' => $transaction->formatted_amount,
                        'description' => $transaction->description,
                        'reference' => $transaction->reference,
                        'created_at' => $transaction->created_at,
                    ],
                    'wallet' => [
                        'balance' => $wallet->balance,
                        'formatted_balance' => $wallet->formatted_balance,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}