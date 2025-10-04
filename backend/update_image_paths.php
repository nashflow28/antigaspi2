<?php

/**
 * Script pour mettre à jour les chemins des images des produits
 * Usage: php update_image_paths.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔄 Mise à jour des chemins d'images...\n\n";

// Mettre à jour les chemins d'images pour les nouveaux produits
$updated = DB::table('products')
    ->where('image_url', 'LIKE', 'images/%')
    ->update([
        'image_url' => DB::raw("REPLACE(image_url, 'images/', 'storage/products/')")
    ]);

echo "✅ {$updated} produits mis à jour avec les nouveaux chemins d'images\n";

// Vérifier les résultats
$products = DB::table('products')
    ->where('image_url', 'LIKE', 'storage/products/%')
    ->select('id', 'name', 'image_url')
    ->limit(5)
    ->get();

echo "\n📋 Exemples de produits mis à jour:\n";
foreach ($products as $product) {
    echo "  - [{$product->id}] {$product->name}: {$product->image_url}\n";
}

echo "\n✨ Mise à jour terminée!\n";
