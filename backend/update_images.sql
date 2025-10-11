-- Script SQL pour mettre à jour les chemins d'images des produits
-- À exécuter dans phpMyAdmin ou mysql CLI

USE antigaspi_fresh;

-- Mettre à jour les chemins d'images
UPDATE products
SET image_url = REPLACE(image_url, 'images/', 'storage/products/')
WHERE image_url LIKE 'images/%';

-- Vérifier les résultats
SELECT id, name, image_url
FROM products
WHERE image_url LIKE 'storage/products/%'
LIMIT 15;
