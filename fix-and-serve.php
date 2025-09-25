<?php

// Supprimer tous les warnings PHP qui corrompent les réponses JSON
error_reporting(E_ERROR | E_PARSE | E_CORE_ERROR | E_CORE_WARNING | E_COMPILE_ERROR | E_COMPILE_WARNING);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Démarrer le serveur Laravel
echo "🔧 Starting Laravel server without PHP warnings...\n";
echo "🚀 Server will start on http://localhost:8000\n";
echo "📡 API endpoints will be available at http://localhost:8000/api/*\n";
echo "⚡ Press Ctrl+C to stop\n\n";

// Changer vers le répertoire backend
chdir(__DIR__ . '/backend');

// Exécuter le serveur Laravel
passthru('php artisan serve --host=127.0.0.1 --port=8000');
?>