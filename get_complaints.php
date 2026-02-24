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
    // For now, get all complaints (in real app, filter by user_id)
    $sql = "SELECT id, complaint_id, user_id, title, category, description, status, created_at, updated_at 
             FROM complaints 
             ORDER BY created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result === false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = [
            'id' => $row['id'],
            'complaint_id' => $row['complaint_id'],
            'user_id' => $row['user_id'],
            'title' => $row['title'],
            'category' => $row['category'],
            'description' => $row['description'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'complaints' => $complaints
    ]);
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
