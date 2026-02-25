<?php
// CORS: Allow same origin and localhost for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://localhost(:[0-9]+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_HOST']);
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check authentication status
session_start();

require_once __DIR__ . '/db.php';

if (isset($_SESSION['user'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'authenticated' => true,
        'user' => $_SESSION['user']
    ]);
} else {
    header('Content-Type: application/json');
    echo json_encode([
        'authenticated' => false
    ]);
}
?>
