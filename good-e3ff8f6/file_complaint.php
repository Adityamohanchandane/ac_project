<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
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
    
    $title = $data['title'] ?? '';
    $category = $data['category'] ?? '';
    $incident_date = $data['incident_date'] ?? '';
    $user_location = $data['user_location'] ?? '';
    $crime_location = $data['crime_location'] ?? '';
    $description = $data['description'] ?? '';
    
    // Generate unique complaint ID
    $complaint_id = 'CMP' . strtoupper(uniqid());
    
    // Use existing complaints table structure
    // Insert complaint (id is auto-increment, complaint_id is unique)
    $sql = "INSERT INTO complaints (complaint_id, user_id, title, category, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    // For now, we'll use a dummy user ID since we don't have user session
    $user_id = 'user123';
    $status = 'pending';
    $created_at = date('Y-m-d H:i:s');
    
    $stmt->bind_param("sssssss", $complaint_id, $user_id, $title, $category, $description, $status, $created_at);
    
    if ($stmt->execute()) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Complaint filed successfully',
            'complaint_id' => $complaint_id
        ]);
    } else {
        $error = $stmt->error;
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to file complaint: ' . $error]);
    }
    
    $stmt->close();
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
