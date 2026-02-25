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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get query parameters
        $complaint_id = $_GET['id'] ?? null;
        $user_email = $_GET['user_email'] ?? null;
        $station_id = $_GET['station_id'] ?? null;
        $status_filter = $_GET['status'] ?? null;
        $category_filter = $_GET['category'] ?? null;
        
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
        }
        
        // Build base query with filters
        $sql = "SELECT * FROM complaints WHERE 1=1";
        $params = [];
        $types = "";
        
        // Add filters
        if ($user_email) {
            $sql .= " AND user_email = ?";
            $params[] = $user_email;
            $types .= "s";
        }
        
        if ($station_id) {
            $sql .= " AND assigned_station_id = ?";
            $params[] = $station_id;
            $types .= "s";
        }
        
        if ($status_filter) {
            $sql .= " AND status = ?";
            $params[] = $status_filter;
            $types .= "s";
        }
        
        if ($category_filter) {
            $sql .= " AND category = ?";
            $params[] = $category_filter;
            $types .= "s";
        }
        
        // Add ordering
        $sql .= " ORDER BY 
            CASE WHEN priority_level = 'emergency' THEN 0 ELSE 1 END,
            created_at DESC";
        
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        // Bind parameters if any
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
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
                'updated_at' => $row['updated_at'],
                'evidence_file' => $row['evidence_file'],
                'user_location' => $row['user_location'],
                'is_emergency' => $row['is_emergency'] ?? false
            ];
        }
        
        $stmt->close();
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'complaints' => $complaints
        ]);
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
