<?php
// Test endpoint simple pour vérifier le problème JSON

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Forcer l'arrêt des warnings
error_reporting(0);
ini_set('display_errors', 0);

// Réponse JSON simple
$response = [
    'status' => 'success',
    'message' => 'Test endpoint working',
    'timestamp' => date('Y-m-d H:i:s'),
    'data' => [
        'test' => true,
        'warnings_suppressed' => true
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
exit;
?>