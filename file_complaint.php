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
    // Check if this is a multipart/form-data request (file upload)
    if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
        // Handle file upload
        $file = $_FILES['evidence'];
        $file_name = $file['name'];
        $file_tmp = $file['tmp_name'];
        $file_size = $file['size'];
        $file_type = $file['type'];
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'];
        if (!in_array($file_type, $allowed_types)) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only images, PDF, and MP4 allowed.']);
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
            // Get other form data
            $title = $_POST['title'] ?? '';
            $category = $_POST['category'] ?? '';
            $incident_date = $_POST['incident_date'] ?? '';
            $user_location = $_POST['user_location'] ?? '';
            $crime_location = $_POST['crime_location'] ?? '';
            $description = $_POST['description'] ?? '';
            
            // Generate unique complaint ID
            $complaint_id = 'CMP' . strtoupper(uniqid());
            
            // Insert complaint with evidence file
            $sql = "INSERT INTO complaints (complaint_id, user_id, title, category, description, status, evidence_file, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            
            if ($stmt === false) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $user_id = $_SESSION['user']['id'] ?? 'user123';
            $status = 'pending';
            $created_at = date('Y-m-d H:i:s');
            $evidence_file = $unique_filename;
            
            $stmt->bind_param("ssssssss", $complaint_id, $user_id, $title, $category, $description, $status, $evidence_file, $created_at);
            
            if ($stmt->execute()) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true, 
                    'message' => 'Complaint filed successfully with evidence',
                    'complaint_id' => $complaint_id,
                    'evidence_file' => $unique_filename,
                    'file_url' => 'http://localhost:8080/uploads/' . $unique_filename
                ]);
            } else {
                $error = $stmt->error;
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Failed to file complaint: ' . $error]);
            }
            
            $stmt->close();
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
        }
    } else {
        // Handle JSON request (existing functionality)
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
        
        // Insert complaint without evidence
        $sql = "INSERT INTO complaints (complaint_id, user_id, title, category, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $user_id = $_SESSION['user']['id'] ?? 'user123';
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
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
