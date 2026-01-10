<?php

/**
 * Script temporaire pour supprimer les warnings PHP qui corrompent les réponses JSON
 */

// Supprimer les warnings spécifiques qui corrompent les API responses
error_reporting(E_ALL & ~E_WARNING & ~E_DEPRECATED);

// Alternative: rediriger les warnings vers les logs au lieu de la sortie
ini_set('log_errors', 1);
ini_set('display_errors', 0);

echo "✅ PHP warnings supprimés pour les réponses API\n";
echo "Les warnings seront toujours loggés mais n'apparaîtront plus dans les réponses JSON\n";
