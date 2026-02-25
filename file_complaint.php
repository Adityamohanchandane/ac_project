<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session and check authentication
session_start();
if (!isset($_SESSION['user'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Load configuration
$config = require_once __DIR__ . '/config.php';
$max_file_size = $config['max_file_size'];
$allowed_types = $config['allowed_types'];
$upload_dir = $config['upload_dir'];

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if this is a FormData request (file upload) or JSON request
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        // Handle FormData with file upload
        $title = $_POST['title'] ?? '';
        $category = $_POST['category'] ?? '';
        $incident_date = $_POST['incident_date'] ?? '';
        $user_location = $_POST['user_location'] ?? '';
        $crime_location = $_POST['crime_location'] ?? '';
        $description = $_POST['description'] ?? '';
        $priority_level = $_POST['priority_level'] ?? 'normal';
        $status = $_POST['status'] ?? 'pending';
        
        // Handle file upload with security
        $evidenceFile = null;
        if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['evidence'];
            
            // Validate file size
            if ($file['size'] > $max_file_size) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'File too large. Maximum size is 10MB.']);
                exit;
            }
            
            // Validate file type using both extension and MIME
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowedMimeTypes = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'pdf' => 'application/pdf',
                'mp4' => 'video/mp4'
            ];
            
            if (!in_array($fileExtension, $allowed_types)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed types: ' . implode(', ', $allowed_types)]);
                exit;
            }
            
            // Check MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, array_values($allowedMimeTypes))) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Invalid file format.']);
                exit;
            }
            
            // Generate unique filename
            $fileName = 'evidence_' . $complaint_id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExtension;
            
            $evidenceFile = [
                'tmp_name' => $file['tmp_name'],
                'name' => $fileName,
                'extension' => $fileExtension
            ];
        }
    } else {
        // Handle JSON request
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        $title = $data['title'] ?? '';
        $category = $data['category'] ?? '';
        $incident_date = $data['incident_date'] ?? '';
        $user_location = $data['user_location'] ?? '';
        $crime_location = $data['crime_location'] ?? '';
        $description = $data['description'] ?? '';
        $priority_level = $data['priority_level'] ?? 'normal';
        $status = $data['status'] ?? 'pending';
        
        $evidenceFile = null;
    }
    
    // Basic validation
    if (empty($title) || empty($category) || empty($description)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Title, category and description are required.']);
        exit;
    }

    // Generate unique complaint ID and internal ID
    $complaint_id = 'CMP' . strtoupper(uniqid());
    $id = uniqid('', true);
    
    // For emergency complaints, set high priority status
    if ($category === 'emergency' || $priority_level === 'emergency') {
        $status = 'high_priority';
        $priority_level = 'emergency';
    }
    
    // Get user email and ID from session
    $user_email = $_SESSION['user']['email'] ?? '';
    $user_id = $_SESSION['user']['id'] ?? uniqid('user_', true);
    
    // Convert location data to JSON strings
    $user_location_json = null;
    $crime_location_json = null;
    $user_location_arr = null;
    $crime_location_arr = null;

    if (!empty($user_location)) {
        if (is_array($user_location)) {
            $user_location_arr = $user_location;
            $user_location_json = json_encode($user_location);
        } else {
            $decoded = json_decode($user_location, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $user_location_arr = $decoded;
                $user_location_json = json_encode($decoded);
            } else {
                $user_location_json = $user_location;
            }
        }
    }

    if (!empty($crime_location)) {
        if (is_array($crime_location)) {
            $crime_location_arr = $crime_location;
            $crime_location_json = json_encode($crime_location);
        } else {
            $decoded = json_decode($crime_location, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $crime_location_arr = $decoded;
                $crime_location_json = json_encode($decoded);
            } else {
                $crime_location_json = $crime_location;
            }
        }
    }
    
    // Handle null values for dates
    $incident_date_val = !empty($incident_date) ? $incident_date : null;
    
    // Determine nearest police station from location (if available)
    $assigned_station_id = null;
    $lat = null;
    $lng = null;

    $location_for_assignment = $crime_location_arr ?: $user_location_arr;
    if (is_array($location_for_assignment)) {
        if (isset($location_for_assignment['latitude'])) {
            $lat = $location_for_assignment['latitude'];
        } elseif (isset($location_for_assignment['lat'])) {
            $lat = $location_for_assignment['lat'];
        }

        if (isset($location_for_assignment['longitude'])) {
            $lng = $location_for_assignment['longitude'];
        } elseif (isset($location_for_assignment['lng'])) {
            $lng = $location_for_assignment['lng'];
        }
    }

    if ($lat !== null && $lng !== null) {
        $station = find_nearest_police_station((float)$lat, (float)$lng);
        if ($station && isset($station['id'])) {
            $assigned_station_id = $station['id'];
        }
    }

    // Timestamps
    $created_at = date('Y-m-d H:i:s');

    // Insert into complaints table
    $sql = "INSERT INTO complaints (
                id,
                complaint_id,
                user_id,
                user_email,
                title,
                category,
                incident_date,
                user_location,
                crime_location,
                description,
                status,
                priority_level,
                assigned_station_id,
                created_at,
                updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
            )";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param(
        "ssssssssssssss",
        $id,
        $complaint_id,
        $user_id,
        $user_email,
        $title,
        $category,
        $incident_date_val,
        $user_location_json,
        $crime_location_json,
        $description,
        $status,
        $priority_level,
        $assigned_station_id,
        $created_at
    );
    
    if ($stmt->execute()) {
        // Handle file upload if present
        $evidencePath = null;
        if ($evidenceFile) {
            // Ensure uploads directory exists
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            $uploadPath = $upload_dir . $evidenceFile['name'];
            
            // Best-effort save of evidence (path not stored in DB yet)
            @move_uploaded_file($evidenceFile['tmp_name'], $uploadPath);
            $evidencePath = 'uploads/' . $evidenceFile['name'];
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Complaint filed successfully',
            'complaint_id' => $complaint_id,
            'evidence_file' => $evidencePath
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to file complaint. Please try again.']);
    }
    
    $stmt->close();
} else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
