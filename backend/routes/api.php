<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes - Antigaspi Application
|--------------------------------------------------------------------------
*/

// Routes d'authentification (publiques)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // Routes protégées par JWT
    Route::middleware(\App\Http\Middleware\ApiAuthMiddleware::class)->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Routes des produits
Route::prefix('products')->group(function () {
    // Routes publiques (consultation)
    Route::get('/', [ProductController::class, 'index']); // Liste des produits
    Route::get('/categories/list', [ProductController::class, 'categories']); // Liste des catégories

    // Routes protégées (gestion des produits)
    Route::middleware(\App\Http\Middleware\ApiAuthMiddleware::class)->group(function () {
        Route::get('/merchant', [ProductController::class, 'merchantProducts']); // Produits du commerçant connecté
        Route::post('/', [ProductController::class, 'store']); // Ajouter un produit (commerçant)
        Route::put('/{id}', [ProductController::class, 'update']); // Modifier un produit
        Route::delete('/{id}', [ProductController::class, 'destroy']); // Supprimer un produit
    });

    // Route avec paramètre ID doit être en dernier
    Route::get('/{id}', [ProductController::class, 'show']); // Détail d'un produit
});

// Routes des réservations (toutes protégées)
Route::prefix('reservations')->middleware(\App\Http\Middleware\ApiAuthMiddleware::class)->group(function () {
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
Route::prefix('merchants')->middleware(\App\Http\Middleware\ApiAuthMiddleware::class)->group(function () {
    // Gestion de la géolocalisation
    Route::get('/location', [MerchantController::class, 'getLocation']); // Obtenir coordonnées GPS
    Route::put('/location', [MerchantController::class, 'updateLocation']); // Mettre à jour coordonnées GPS
});

// Routes publiques des commerçants
Route::prefix('merchants')->group(function () {
    Route::get('/nearby', [MerchantController::class, 'nearby']); // Commerçants à proximité
});

// Routes administrateur (protégées)
Route::prefix('admin')->middleware(\App\Http\Middleware\ApiAuthMiddleware::class)->group(function () {
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
});

// Routes temporaires pour les tests (à sécuriser plus tard)
Route::prefix('admin')->group(function () {
    Route::get('/users', [\App\Http\Controllers\Admin\AdminUserController::class, 'index']);
    Route::patch('/users/{id}/suspend', [\App\Http\Controllers\Admin\AdminUserController::class, 'suspend']);
    Route::patch('/users/{id}/unsuspend', [\App\Http\Controllers\Admin\AdminUserController::class, 'unsuspend']);

    // Merchant moderation routes
    Route::get('/moderation', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'moderation']);
    Route::post('/merchants/{id}/approve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'approve']);
    Route::post('/merchants/{id}/reject', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'reject']);
    Route::post('/products/{id}/approve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'approveProduct']);
    Route::post('/products/{id}/reject', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'rejectProduct']);
    Route::post('/reservations/{id}/resolve', [\App\Http\Controllers\Admin\AdminMerchantController::class, 'resolveReservation']);
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