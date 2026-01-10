<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Merchant;
use App\Models\User;

$email = 'senabolo@gmail.com';

echo "=== Vérification du compte $email ===\n";

// Vérifier l'utilisateur
$user = User::where('email', $email)->first();
if ($user) {
    echo "✅ Utilisateur trouvé:\n";
    echo "   ID: {$user->id}\n";
    echo "   Nom: {$user->name}\n";
    echo "   Email: {$user->email}\n";
    echo "   Rôle: {$user->role}\n";
    echo '   Statut: '.($user->status ?? 'null')."\n";
    echo "   Créé le: {$user->created_at}\n";

    // Vérifier le merchant
    if ($user->role === 'merchant') {
        $merchant = Merchant::where('user_id', $user->id)->first();
        if ($merchant) {
            echo "✅ Profil commerçant trouvé:\n";
            echo "   ID Merchant: {$merchant->id}\n";
            echo "   Nom commercial: {$merchant->business_name}\n";
            echo "   Type: {$merchant->business_type}\n";
            echo "   Statut: {$merchant->status}\n";
        } else {
            echo "❌ Aucun profil commerçant trouvé pour cet utilisateur\n";
        }
    } else {
        echo "❌ L'utilisateur n'a pas le rôle 'merchant' (rôle actuel: {$user->role})\n";
    }
} else {
    echo "❌ Utilisateur non trouvé avec l'email $email\n";

    echo "\n=== Comptes de test disponibles ===\n";
    $testUsers = User::whereIn('email', [
        'admin@antigaspi.com',
        'jean.dupont@email.com',
        'boulangerie.martin@email.com',
    ])->get();

    foreach ($testUsers as $testUser) {
        echo "- {$testUser->email} (rôle: {$testUser->role})\n";
    }
}

echo "\n=== Fin de la vérification ===\n";
