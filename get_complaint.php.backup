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

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $complaint_id = $_GET['id'] ?? '';
    
    if (empty($complaint_id)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Complaint ID is required']);
        exit;
    }
    
    // Fetch full complaint record so the frontend has everything it needs
    $sql = "SELECT * FROM complaints WHERE complaint_id = ? LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $complaint_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit;
    }
    
    $complaint = $result->fetch_assoc();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'complaint' => $complaint
    ]);
    
    $stmt->close();
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
