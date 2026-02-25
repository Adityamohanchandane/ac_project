<?php
// Simple get complaints handler
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    // Get complaints from file
    $complaintsFile = 'data/complaints.json';
    $complaints = [];
    
    if (file_exists($complaintsFile)) {
        $complaints = json_decode(file_get_contents($complaintsFile), true) ?: [];
    }
    
    // Filter by user if specified
    if ($userId) {
        $complaints = array_filter($complaints, function($complaint) use ($userId) {
            return $complaint['user_id'] === $userId;
        });
    }
    
    echo json_encode([
        'success' => true,
        'complaints' => array_values($complaints)
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
