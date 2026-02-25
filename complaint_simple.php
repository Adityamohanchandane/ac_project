<?php
// Simple complaint handler
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? '';
    $description = $_POST['description'] ?? '';
    $incidentDate = $_POST['incident_date'] ?? '';
    $location = $_POST['location'] ?? '';
    $userId = $_POST['user_id'] ?? 'demo_user';
    
    // Simple validation
    if (empty($title) || empty($category) || empty($description)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please fill in all required fields'
        ]);
        exit;
    }
    
    // Store in file
    $complaintData = [
        'id' => 'complaint_' . time(),
        'user_id' => $userId,
        'title' => $title,
        'category' => $category,
        'description' => $description,
        'incident_date' => $incidentDate,
        'location' => $location,
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // Save to file
    $complaintsFile = 'data/complaints.json';
    $complaints = [];
    
    if (file_exists($complaintsFile)) {
        $complaints = json_decode(file_get_contents($complaintsFile), true) ?: [];
    }
    
    $complaints[] = $complaintData;
    
    // Create data directory if it doesn't exist
    if (!file_exists('data')) {
        mkdir('data', 0777, true);
    }
    
    file_put_contents($complaintsFile, json_encode($complaints, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Complaint filed successfully',
        'complaint' => $complaintData
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
