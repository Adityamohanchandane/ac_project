<?php
// Add CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check authentication status
session_start();

if (isset($_SESSION['user'])) {
    header('Content-Type: application/json');
    header("Access-Control-Allow-Origin: *");
    echo json_encode([
        'authenticated' => true,
        'user' => $_SESSION['user']
    ]);
} else {
    header('Content-Type: application/json');
    header("Access-Control-Allow-Origin: *");
    echo json_encode([
        'authenticated' => false
    ]);
}
?>
