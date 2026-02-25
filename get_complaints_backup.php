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
    // Check if this is a request for a specific complaint
    $complaint_id = $_GET['id'] ?? null;
    $user_email = $_GET['user_email'] ?? null;
    $station_id = $_GET['station_id'] ?? null;
    
    if ($complaint_id) {
        // Get specific complaint by ID
        $sql = "SELECT * FROM complaints WHERE complaint_id = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database query failed']);
            exit;
        }
        
        $stmt->bind_param("s", $complaint_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $complaint = $result->fetch_assoc();
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'complaint' => $complaint
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        }
        $stmt->close();
        exit;
    } elseif ($station_id) {
        // Police station complaints
        $complaints = get_station_complaints($station_id);
    } elseif ($user_email) {
        // User-specific complaints
        $complaints = get_user_complaints($user_email);
    } else {
        // Fallback to all complaints (for testing)
        $sql = "SELECT id, complaint_id, title, category, description, status, priority_level, 
                       assigned_station_id, user_email, created_at, updated_at 
                 FROM complaints 
                 ORDER BY 
                 CASE WHEN priority_level = 'emergency' THEN 0 ELSE 1 END,
                 created_at DESC";
        
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
                'title' => $row['title'],
                'category' => $row['category'],
                'description' => $row['description'],
                'status' => $row['status'],
                'priority_level' => $row['priority_level'],
                'assigned_station_id' => $row['assigned_station_id'],
                'user_email' => $row['user_email'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }
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
