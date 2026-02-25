<?php
// Simple login handler with fallback
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Demo users
$demoUsers = [
    'user@observx.com' => [
        'password' => 'user123',
        'role' => 'user',
        'full_name' => 'Demo User'
    ],
    'police@observx.com' => [
        'password' => 'police123',
        'role' => 'police',
        'full_name' => 'Demo Police'
    ]
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (isset($demoUsers[$email]) && $demoUsers[$email]['password'] === $password) {
        $user = $demoUsers[$email];
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'email' => $email,
                'role' => $user['role'],
                'full_name' => $user['full_name'],
                'id' => 'demo_' . time()
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
