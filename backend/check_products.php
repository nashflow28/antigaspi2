<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;
use App\Models\User;
use App\Models\Merchant;

$email = 'boulangerie.martin@email.com';

echo "=== Vérification des produits ===\n";

// Trouver l'utilisateur boulangerie martin
$user = User::where('email', $email)->first();
if (!$user) {
    echo "❌ Utilisateur boulangerie.martin non trouvé\n";
    exit;
}

echo "✅ Utilisateur trouvé: {$user->name} (ID: {$user->id})\n";

// Trouver le merchant
$merchant = Merchant::where('user_id', $user->id)->first();
if (!$merchant) {
    echo "❌ Profil commerçant non trouvé\n";
    exit;
}

echo "✅ Commerçant trouvé: {$merchant->business_name} (ID: {$merchant->id})\n";

// Lister tous les produits de ce commerçant
$products = Product::where('merchant_id', $merchant->id)
    ->orderBy('created_at', 'desc')
    ->get();

echo "\n=== Produits du commerçant ===\n";
echo "Nombre total: " . $products->count() . "\n\n";

foreach ($products as $product) {
    echo "ID: {$product->id}\n";
    echo "Nom: {$product->name}\n";
    echo "Description: {$product->description}\n";
    echo "Prix original: {$product->original_price} XOF\n";
    echo "Prix réduit: {$product->discounted_price} XOF\n";
    echo "Quantité: {$product->quantity_available}\n";
    echo "Statut: {$product->status}\n";
    echo "Créé le: {$product->created_at}\n";
    echo "---\n";
}

// Vérifier aussi senabolo
$senabolo = User::where('email', 'senabolo@gmail.com')->first();
if ($senabolo && $senabolo->role === 'merchant') {
    $senaboloMerchant = Merchant::where('user_id', $senabolo->id)->first();
    if ($senaboloMerchant) {
        $senaboloProducts = Product::where('merchant_id', $senaboloMerchant->id)
            ->orderBy('created_at', 'desc')
            ->get();

        echo "\n=== Produits de Senabolo (ID: {$senaboloMerchant->id}) ===\n";
        echo "Nombre total: " . $senaboloProducts->count() . "\n\n";

        foreach ($senaboloProducts as $product) {
            echo "ID: {$product->id} - {$product->name} - Créé le: {$product->created_at}\n";
        }
    }
}

echo "\n=== Fin de la vérification ===\n";