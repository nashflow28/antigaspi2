<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes - Antigaspi Application
|--------------------------------------------------------------------------
*/

// Routes de test temporaires sans middleware
Route::get('/test-reviews-dashboard', function (Request $request) {
    try {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'No token'], 401);
        }

        $user = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->authenticate();
        if (!$user || $user->role !== 'merchant') {
            return response()->json(['error' => 'Invalid user or not merchant', 'user' => $user], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'JWT works!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Route de test pour récupération des produits du commerçant
Route::get('/test-products-merchant', function (Request $request) {
    try {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'No token'], 401);
        }

        $user = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->authenticate();
        if (!$user || $user->role !== 'merchant') {
            return response()->json(['error' => 'Invalid user or not merchant', 'user' => $user], 403);
        }

        // Appeler le contrôleur directement
        $controller = new \App\Http\Controllers\Api\ProductController();
        return $controller->merchantProducts($request);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});


// Route de test pour création de produits
Route::post('/test-products', function (Request $request) {
    try {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'No token'], 401);
        }

        $user = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->authenticate();
        if (!$user || $user->role !== 'merchant') {
            return response()->json(['error' => 'Invalid user or not merchant', 'user' => $user], 403);
        }

        // Appeler le contrôleur directement
        $controller = new \App\Http\Controllers\Api\ProductController();
        return $controller->store($request);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Routes d'authentification (publiques)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']); // Legacy

    // Routes sécurisées (nouvelles)
    Route::post('secure-login', [AuthController::class, 'secureLogin']);
    Route::post('secure-refresh', [AuthController::class, 'secureRefresh']);

    // Routes protégées par JWT
    Route::middleware('jwt.auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']); // Legacy
        Route::post('refresh', [AuthController::class, 'refresh']); // Legacy

        // Routes sécurisées protégées
        Route::post('secure-logout', [AuthController::class, 'secureLogout']);
        Route::get('sessions', [AuthController::class, 'getActiveSessions']);
        Route::delete('sessions/{session_id}', [AuthController::class, 'revokeSession']);
        Route::post('revoke-all-sessions', [AuthController::class, 'revokeAllOtherSessions']);
    });
});

// Routes des produits
Route::prefix('products')->group(function () {
    // Routes publiques (consultation)
    Route::get('/', [ProductController::class, 'index']); // Liste des produits
    Route::get('/categories/list', [ProductController::class, 'categories']); // Liste des catégories

    // Routes protégées (gestion des produits)
    Route::middleware('jwt.auth')->group(function () {
        Route::get('/merchant', [ProductController::class, 'merchantProducts']); // Produits du commerçant connecté
        Route::post('/', [ProductController::class, 'store']); // Ajouter un produit (commerçant)
        Route::put('/{id}', [ProductController::class, 'update']); // Modifier un produit
        Route::delete('/{id}', [ProductController::class, 'destroy']); // Supprimer un produit
    });

    // Route avec paramètre ID doit être en dernier
    Route::get('/{id}', [ProductController::class, 'show']); // Détail d'un produit
});

// Routes des réservations (toutes protégées)
Route::prefix('reservations')->middleware('jwt.auth')->group(function () {
    // Routes pour les consommateurs
    Route::get('/', [ReservationController::class, 'index']); // Mes réservations
    Route::post('/', [ReservationController::class, 'store']); // Créer une réservation
    Route::get('/statistics', [ReservationController::class, 'statistics']); // Mes statistiques
    Route::get('/{id}', [ReservationController::class, 'show']); // Détail de ma réservation
    Route::post('/{id}/cancel', [ReservationController::class, 'cancel']); // Annuler ma réservation

    // Routes pour les commerçants
    Route::get('/merchant/list', [ReservationController::class, 'merchantReservations']); // Réservations reçues
    Route::post('/{id}/confirm', [ReservationController::class, 'confirm']); // Confirmer une réservation
    Route::post('/{id}/ready', [ReservationController::class, 'markReady']); // Marquer comme prêt
    Route::post('/{id}/complete', [ReservationController::class, 'complete']); // Marquer comme terminée
});

// Routes des catégories (alternative)
Route::get('categories', [ProductController::class, 'categories']);

// Routes des commerçants (protégées)
Route::prefix('merchants')->middleware('jwt.auth')->group(function () {
    // Gestion de la géolocalisation
    Route::get('/location', [MerchantController::class, 'getLocation']); // Obtenir coordonnées GPS
    Route::put('/location', [MerchantController::class, 'updateLocation']); // Mettre à jour coordonnées GPS

    // Gestion des avis commerçant - BYPASS custom middleware for now
    Route::prefix('reviews')->group(function () {
        // Route de test
        Route::get('/test', function () {
            $user = Auth::user();
            return response()->json([
                'success' => true,
                'user' => $user,
                'auth_check' => Auth::check()
            ]);
        });

        Route::get('/dashboard', [\App\Http\Controllers\Api\MerchantReviewController::class, 'dashboard']); // Dashboard avis
        Route::get('/list', [\App\Http\Controllers\Api\MerchantReviewController::class, 'list']); // Liste avis reçus
        Route::get('/products', [\App\Http\Controllers\Api\MerchantReviewController::class, 'products']); // Produits avec avis
        Route::post('/{review}/respond', [\App\Http\Controllers\Api\MerchantReviewController::class, 'respond']); // Répondre à un avis
        Route::put('/{review}/response', [\App\Http\Controllers\Api\MerchantReviewController::class, 'updateResponse']); // Modifier réponse
        Route::delete('/{review}/response', [\App\Http\Controllers\Api\MerchantReviewController::class, 'deleteResponse']); // Supprimer réponse
    });
});

// Routes publiques des commerçants
Route::prefix('merchants')->group(function () {
    Route::get('/nearby', [MerchantController::class, 'nearby']); // Commerçants à proximité
    Route::get('/all-with-location', [MerchantController::class, 'getAllWithLocation']); // Tous les commerçants avec position
});

// Routes des avis
Route::prefix('reviews')->group(function () {
    // Routes publiques
    Route::get('/', [ReviewController::class, 'index']); // Liste des avis (avec filtres)
    Route::get('/stats', [ReviewController::class, 'stats']); // Statistiques d'avis pour un commerçant

    // Routes protégées (création/modification/suppression)
    Route::middleware('jwt.auth')->group(function () {
        Route::post('/', [ReviewController::class, 'store']); // Créer un avis
        Route::get('/{review}', [ReviewController::class, 'show']); // Voir les détails de son avis
        Route::put('/{review}', [ReviewController::class, 'update']); // Modifier son avis
        Route::delete('/{review}', [ReviewController::class, 'destroy']); // Supprimer son avis
        Route::post('/{review}/report', [\App\Http\Controllers\Api\AdminReviewController::class, 'report']); // Signaler un avis
    });
});

// Routes administrateur (protégées)
Route::prefix('admin')->middleware(['jwt.auth', 'can:admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']); // Dashboard admin
    Route::get('/system-health', [AdminController::class, 'systemHealth']); // Santé du système

    // Gestion des catégories (admin uniquement)
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']); // Liste des catégories
        Route::get('/stats', [CategoryController::class, 'stats']); // Statistiques catégories
        Route::post('/', [CategoryController::class, 'store']); // Créer catégorie
        Route::get('/{category}', [CategoryController::class, 'show']); // Détail catégorie
        Route::put('/{category}', [CategoryController::class, 'update']); // Modifier catégorie
        Route::delete('/{category}', [CategoryController::class, 'destroy']); // Supprimer catégorie
        Route::patch('/{category}/toggle', [CategoryController::class, 'toggleStatus']); // Activer/désactiver
    });

    // Modération des avis (admin uniquement)
    Route::prefix('reviews')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\AdminReviewController::class, 'stats']); // Statistiques modération
        Route::get('/pending', [\App\Http\Controllers\Api\AdminReviewController::class, 'pending']); // Avis en attente
        Route::post('/{review}/approve', [\App\Http\Controllers\Api\AdminReviewController::class, 'approve']); // Approuver avis
        Route::post('/{review}/reject', [\App\Http\Controllers\Api\AdminReviewController::class, 'reject']); // Rejeter avis
        Route::get('/reported', [\App\Http\Controllers\Api\AdminReviewController::class, 'reported']); // Avis signalés
        Route::post('/reports/{report}/resolve', [\App\Http\Controllers\Api\AdminReviewController::class, 'resolveReport']); // Résoudre signalement
    });

    // Gestion des points de fidélité (admin uniquement)
    Route::prefix('loyalty')->group(function () {
        Route::get('/users', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'getAllUsersPoints']); // Tous les utilisateurs avec points
        Route::post('/award', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'awardPoints']); // Attribuer des points
    });

    // Gestion des utilisateurs (admin uniquement)
    Route::get('/users', [\App\Http\Controllers\Admin\AdminUserController::class, 'index']);
    Route::patch('/users/{id}/suspend', [\App\Http\Controllers\Admin\AdminUserController::class, 'suspend']);
    Route::patch('/users/{id}/unsuspend', [\App\Http\Controllers\Admin\AdminUserController::class, 'unsuspend']);

    // Modération des commerçants et réservations (admin uniquement)
    Route::get('/moderation', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'moderation']);
    Route::post('/merchants/{id}/approve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'approve']);
    Route::post('/merchants/{id}/reject', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'reject']);
    Route::post('/products/{id}/approve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'approveProduct']);
    Route::post('/products/{id}/reject', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'rejectProduct']);
    Route::post('/reservations/{id}/resolve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'resolveReservation']);
});

// Routes des points de fidélité (protégées)
Route::prefix('loyalty')->middleware('jwt.auth')->group(function () {
    Route::get('/my-points', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'getUserPoints']); // Mes points
    Route::post('/redeem', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'redeemPoints']); // Échanger des points
});

// Routes de test et informations
Route::get('health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is working',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// Route par défaut pour les endpoints non trouvés
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Endpoint API non trouvé',
        'available_endpoints' => [
            'POST /api/auth/register' => 'Inscription',
            'POST /api/auth/login' => 'Connexion',
            'GET /api/products' => 'Liste des produits',
            'GET /api/products/{id}' => 'Détail produit',
            'POST /api/reservations' => 'Créer réservation',
            'GET /api/health' => 'Status API',
        ]
    ], 404);
});