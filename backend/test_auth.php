<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

$email = 'senabolo@gmail.com';

echo "=== Test d'authentification JWT ===\n";

// Trouver l'utilisateur
$user = User::where('email', $email)->first();
if (! $user) {
    echo "❌ Utilisateur non trouvé\n";
    exit;
}

echo "✅ Utilisateur trouvé: {$user->name} (ID: {$user->id}, Rôle: {$user->role})\n";

// Générer un token JWT
try {
    $token = JWTAuth::fromUser($user);
    echo '✅ Token JWT généré: '.substr($token, 0, 50)."...\n";

    // Test de validation du token
    $payload = JWTAuth::setToken($token)->getPayload();
    echo '✅ Token valide, user_id: '.$payload->get('sub')."\n";

    // Test avec curl
    echo "\n=== Test avec curl ===\n";
    echo "curl -X GET \"http://127.0.0.1:8000/api/merchants/reviews/dashboard\" \\\n";
    echo "  -H \"Accept: application/json\" \\\n";
    echo "  -H \"Authorization: Bearer {$token}\"\n";

} catch (Exception $e) {
    echo '❌ Erreur JWT: '.$e->getMessage()."\n";
}

echo "\n=== Fin du test ===\n";
