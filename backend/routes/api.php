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
use App\Http\Controllers\Api\SurpriseBasketController;
use App\Http\Controllers\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes - Antigaspi Application
|--------------------------------------------------------------------------
*/


// Routes d'authentification (publiques) - Rate limiting strict
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
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

// Routes des produits - Rate limiting pour la recherche
Route::prefix('products')->middleware('throttle:search')->group(function () {
    // Routes publiques (consultation)
    Route::get('/', [ProductController::class, 'index']); // Liste des produits
    Route::get('/categories/list', [ProductController::class, 'categories']); // Liste des catégories

    // Routes protégées (gestion des produits)
    Route::middleware('jwt.auth')->group(function () {
        Route::get('/merchant', [ProductController::class, 'merchantProducts']); // Produits du commerçant connecté

        // Routes d'écriture avec rate limiting strict
        Route::middleware('throttle:write')->group(function () {
            Route::post('/', [ProductController::class, 'store']); // Ajouter un produit (commerçant)
            Route::put('/{id}', [ProductController::class, 'update']); // Modifier un produit
            Route::delete('/{id}', [ProductController::class, 'destroy']); // Supprimer un produit
        });
    });

    // Route avec paramètre ID doit être en dernier
    Route::get('/{id}', [ProductController::class, 'show']); // Détail d'un produit
});

// Routes des paniers surprise
Route::prefix('surprise-baskets')->middleware('throttle:search')->group(function () {
    // Routes publiques (consultation)
    Route::get('/', [SurpriseBasketController::class, 'index']); // Liste des paniers surprise
    Route::get('/{id}', [SurpriseBasketController::class, 'show']); // Détail d'un panier surprise

    // Routes protégées (gestion des paniers surprise)
    Route::middleware('jwt.auth')->group(function () {
        Route::get('/merchant/list', [SurpriseBasketController::class, 'merchantBaskets']); // Paniers du commerçant connecté

        // Routes d'écriture avec rate limiting strict
        Route::middleware('throttle:write')->group(function () {
            Route::post('/', [SurpriseBasketController::class, 'store']); // Créer un panier surprise
            Route::put('/{id}', [SurpriseBasketController::class, 'update']); // Modifier un panier surprise
            Route::delete('/{id}', [SurpriseBasketController::class, 'destroy']); // Supprimer un panier surprise
            Route::post('/{basketId}/products', [SurpriseBasketController::class, 'addProduct']); // Ajouter un produit
            Route::delete('/{basketId}/products/{productId}', [SurpriseBasketController::class, 'removeProduct']); // Retirer un produit
        });
    });
});

// Routes des réservations (toutes protégées)
Route::prefix('reservations')->middleware('jwt.auth')->group(function () {
    // Routes de consultation (rate limiting normal)
    Route::get('/', [ReservationController::class, 'index']); // Mes réservations
    Route::get('/statistics', [ReservationController::class, 'statistics']); // Mes statistiques
    Route::get('/{id}', [ReservationController::class, 'show']); // Détail de ma réservation
    Route::get('/merchant/list', [ReservationController::class, 'merchantReservations']); // Réservations reçues

    // Routes d'écriture avec rate limiting strict
    Route::middleware('throttle:write')->group(function () {
        Route::post('/', [ReservationController::class, 'store']); // Créer une réservation
        Route::post('/{id}/cancel', [ReservationController::class, 'cancel']); // Annuler ma réservation
        Route::post('/{id}/confirm', [ReservationController::class, 'confirm']); // Confirmer une réservation
        Route::post('/{id}/ready', [ReservationController::class, 'markReady']); // Marquer comme prêt
        Route::post('/{id}/complete', [ReservationController::class, 'complete']); // Marquer comme terminée
    });
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

    // Gestion des points de fidélité pour commerçants
    Route::prefix('loyalty')->group(function () {
        Route::get('/customers', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'getMerchantCustomers']); // Clients du commerçant
        Route::post('/award', [\App\Http\Controllers\Api\LoyaltyPointController::class, 'awardPoints']); // Attribuer des points
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
Route::prefix('admin')->middleware(['jwt.auth', 'can:admin', 'throttle:admin'])->group(function () {
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