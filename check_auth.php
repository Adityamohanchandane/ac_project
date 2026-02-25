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

session_start();

// Unified auth check for both citizens and police
$response = [
    'authenticated' => false,
    'user' => null,
];

// Citizen session
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $user = $_SESSION['user'];
    // Ensure a role field exists for frontend routing
    if (empty($user['role'])) {
        $user['role'] = 'user';
    }

    $response['authenticated'] = true;
    $response['user'] = $user;
}
// Police session (used by police dashboard)
elseif (isset($_SESSION['police']) && is_array($_SESSION['police'])) {
    $police = $_SESSION['police'];

    $response['authenticated'] = true;
    $response['user'] = [
        'id' => $police['id'] ?? null,
        'email' => $police['email'] ?? '',
        'role' => 'police',
        // Expose station identifiers for frontend filtering
        'station_id' => $police['id'] ?? null,
        'police_id' => $police['police_id'] ?? null,
        'station_name' => $police['station_name'] ?? null,
    ];
}

header('Content-Type: application/json');
echo json_encode($response);
?>
