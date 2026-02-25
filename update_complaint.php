<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS: allow Vite dev origin with credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Allow localhost for development and the production domain
if ($origin && (preg_match('#^https?://localhost(:[0-9]+)?$#', $origin) || strpos($origin, 'https://observx.netlify.app') === 0)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $complaint_id = $data['complaint_id'] ?? '';
    $new_status = $data['status'] ?? '';
    
    if (empty($complaint_id) || empty($new_status)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Complaint ID and status are required']);
        exit;
    }
    
    // Validate status
    $valid_statuses = ['pending', 'investigating', 'resolved', 'closed'];
    if (!in_array($new_status, $valid_statuses)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit;
    }
    
    // Update complaint status
    $sql = "UPDATE complaints SET status = ?, updated_at = NOW() WHERE complaint_id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("ss", $new_status, $complaint_id);
    
    if ($stmt->execute()) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Complaint status updated successfully'
        ]);
    } else {
        $error = $stmt->error;
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to update complaint: ' . $error]);
    }
    
    $stmt->close();
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
