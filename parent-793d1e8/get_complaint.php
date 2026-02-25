<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

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
    
    $sql = "SELECT id, complaint_id, title, category, description, status, created_at, updated_at 
             FROM complaints 
             WHERE complaint_id = ? 
             ORDER BY created_at DESC";
    
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
        'complaint' => [
            'id' => $complaint['id'],
            'complaint_id' => $complaint['complaint_id'],
            'title' => $complaint['title'],
            'category' => $complaint['category'],
            'description' => $complaint['description'],
            'status' => $complaint['status'],
            'created_at' => $complaint['created_at'],
            'updated_at' => $complaint['updated_at']
        ]
    ]);
    
    $stmt->close();
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
