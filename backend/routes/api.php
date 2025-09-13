<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReservationController;

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
    Route::middleware('auth:api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Routes des produits
Route::prefix('products')->group(function () {
    // Routes publiques (consultation)
    Route::get('/', [ProductController::class, 'index']); // Liste des produits
    Route::get('/{id}', [ProductController::class, 'show']); // Détail d'un produit
    Route::get('/categories/list', [ProductController::class, 'categories']); // Liste des catégories

    // Routes protégées (gestion des produits)
    Route::middleware('auth:api')->group(function () {
        Route::post('/', [ProductController::class, 'store']); // Ajouter un produit (commerçant)
        Route::put('/{id}', [ProductController::class, 'update']); // Modifier un produit
        Route::delete('/{id}', [ProductController::class, 'destroy']); // Supprimer un produit
    });
});

// Routes des réservations (toutes protégées)
Route::prefix('reservations')->middleware('auth:api')->group(function () {
    // Routes pour les consommateurs
    Route::get('/', [ReservationController::class, 'index']); // Mes réservations
    Route::post('/', [ReservationController::class, 'store']); // Créer une réservation
    Route::get('/{id}', [ReservationController::class, 'show']); // Détail de ma réservation
    Route::post('/{id}/cancel', [ReservationController::class, 'cancel']); // Annuler ma réservation

    // Routes pour les commerçants
    Route::get('/merchant/list', [ReservationController::class, 'merchantReservations']); // Réservations reçues
    Route::post('/{id}/confirm', [ReservationController::class, 'confirm']); // Confirmer une réservation
    Route::post('/{id}/complete', [ReservationController::class, 'complete']); // Marquer comme terminée
});

// Routes des catégories (alternative)
Route::get('categories', [ProductController::class, 'categories']);

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