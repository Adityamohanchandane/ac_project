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

// Create uploads directory if it doesn't exist
$uploads_dir = __DIR__ . '/uploads';
if (!file_exists($uploads_dir)) {
    mkdir($uploads_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get form data
        $title = $_POST['title'] ?? '';
        $category = $_POST['category'] ?? '';
        $incident_date = $_POST['incident_date'] ?? date('Y-m-d H:i:s');
        $emergency_location = $_POST['emergency_location'] ?? '';
        $photo_location = $_POST['photo_location'] ?? '';
        $description = $_POST['description'] ?? '';
        $emergency_type = $_POST['emergency_type'] ?? '';
        $is_emergency = $_POST['is_emergency'] ?? 'false';
        $user_id = $_SESSION['user']['id'] ?? 'anonymous';
        $user_email = $_SESSION['user']['email'] ?? 'anonymous@example.com';
        
        // Handle file upload
        $evidence_file = null;
        $file_url = null;
        
        if (isset($_FILES['evidence_file']) && $_FILES['evidence_file']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['evidence_file'];
            $file_name = $file['name'];
            $file_tmp = $file['tmp_name'];
            $file_size = $file['size'];
            $file_type = $file['type'];
            
            // Validate file type
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mov', 'video/quicktime'];
            if (!in_array($file_type, $allowed_types)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only images, PDF, and videos allowed.']);
                exit;
            }
            
            // Validate file size (max 10MB)
            if ($file_size > 10 * 1024 * 1024) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'File size too large. Maximum 10MB allowed.']);
                exit;
            }
            
            // Generate unique filename
            $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
            $unique_filename = 'evidence_' . uniqid() . '.' . $file_extension;
            $upload_path = $uploads_dir . '/' . $unique_filename;
            
            // Move uploaded file
            if (move_uploaded_file($file_tmp, $upload_path)) {
                $evidence_file = $unique_filename;
                $file_url = 'http://localhost:8080/uploads/' . $unique_filename;
            }
        }
        
        // Generate unique complaint ID
        $complaint_id = 'CMP' . strtoupper(uniqid());
        
        // Prepare location data
        $location_data = null;
        if ($emergency_location) {
            $location_data = json_encode([
                'address' => $emergency_location,
                'captured_at' => date('Y-m-d H:i:s')
            ]);
        }
        
        // Set priority based on emergency type
        $priority_level = ($is_emergency === 'true') ? 'emergency' : 'normal';
        $status = 'pending';
        
        // Insert complaint
        $sql = "INSERT INTO complaints (
            complaint_id, user_id, user_email, title, category, description, status, 
            evidence_file, created_at, priority_level, user_location, is_emergency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $created_at = date('Y-m-d H:i:s');
        
        $stmt->bind_param(
            "ssssssssss", 
            $complaint_id, $user_id, $user_email, $title, $category, $description, $status, 
            $evidence_file, $created_at, $priority_level, $location_data, $is_emergency
        );
        
        if ($stmt->execute()) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true, 
                'message' => 'Complaint filed successfully',
                'complaint_id' => $complaint_id,
                'evidence_file' => $evidence_file,
                'file_url' => $file_url,
                'emergency_type' => $emergency_type,
                'location' => $emergency_location,
                'priority' => $priority_level,
                'status' => $status
            ]);
        } else {
            $error = $stmt->error;
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to file complaint: ' . $error]);
        }
        
        $stmt->close();
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
