<?php
// Simple registration handler
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = $_POST['full_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $address = $_POST['address'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Simple validation
    if (empty($fullName) || empty($email) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please fill in all required fields'
        ]);
        exit;
    }
    
    // Store in file (simple fallback)
    $userData = [
        'full_name' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'address' => $address,
        'password' => $password,
        'role' => 'user',
        'id' => 'user_' . time(),
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // Save to file
    $usersFile = 'data/users.json';
    $users = [];
    
    if (file_exists($usersFile)) {
        $users = json_decode(file_get_contents($usersFile), true) ?: [];
    }
    
    $users[] = $userData;
    
    // Create data directory if it doesn't exist
    if (!file_exists('data')) {
        mkdir('data', 0777, true);
    }
    
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user' => $userData
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
