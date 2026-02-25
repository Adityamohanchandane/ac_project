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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit;
    }
    
    try {
        // Generate complaint ID
        $complaint_id = 'CMP' . strtoupper(uniqid());
        
        // Insert complaint with all details
        $sql = "INSERT INTO complaints (
            complaint_id, 
            user_id, 
            title, 
            category, 
            description, 
            status, 
            priority, 
            created_at, 
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        // Prepare data
        $title = $data['complaintCategory'] . ': ' . ($data['type'] === 'emergency' ? 'EMERGENCY' : 'Normal') . ' Complaint';
        $category = $data['complaintCategory'];
        $priority = $data['priority'];
        
        // Build comprehensive description
        $full_description = "COMPLAINT TYPE: " . strtoupper($data['type']) . "\n";
        $full_description .= "CATEGORY: " . strtoupper($category) . "\n";
        $full_description .= "PRIORITY: " . strtoupper($priority) . "\n";
        $full_description .= "NAME: " . $data['fullName'] . "\n";
        $full_description .= "CONTACT: " . $data['contactNumber'] . "\n";
        $full_description .= "LOCATION: " . $data['location'] . "\n";
        if (!empty($data['city'])) {
            $full_description .= "CITY: " . $data['city'] . "\n";
        }
        if (!empty($data['landmark'])) {
            $full_description .= "LANDMARK: " . $data['landmark'] . "\n";
        }
        $full_description .= "DESCRIPTION: " . $data['description'] . "\n";
        if (!empty($data['incidentDateTime'])) {
            $full_description .= "INCIDENT DATE/TIME: " . $data['incidentDateTime'] . "\n";
        }
        if (!empty($data['witnesses'])) {
            $full_description .= "WITNESSES: " . $data['witnesses'] . "\n";
        }
        if (!empty($data['additionalDetails'])) {
            $full_description .= "ADDITIONAL INFO: " . $data['additionalDetails'] . "\n";
        }
        
        // Handle evidence
        $evidence_info = '';
        if (isset($data['evidence'])) {
            $evidence_files = [];
            
            // Handle photo uploads
            if (isset($data['evidence']['photos']) && is_array($data['evidence']['photos'])) {
                foreach ($data['evidence']['photos'] as $photo) {
                    $evidence_files[] = 'PHOTO: ' . $photo['name'] . ' (' . round($photo['size'] / 1024 / 1024, 2) . ' MB)';
                }
            }
            
            // Handle video uploads
            if (isset($data['evidence']['videos']) && is_array($data['evidence']['videos'])) {
                foreach ($data['evidence']['videos'] as $video) {
                    $evidence_files[] = 'VIDEO: ' . $video['name'] . ' (' . round($video['size'] / 1024 / 1024, 2) . ' MB)';
                }
            }
            
            if (!empty($evidence_files)) {
                $evidence_info = "\nEVIDENCE:\n" . implode("\n", $evidence_files);
                $full_description .= $evidence_info;
            }
        }
        
        $status = $data['type'] === 'emergency' ? 'under_investigation' : 'pending';
        $created_at = date('Y-m-d H:i:s');
        $updated_at = date('Y-m-d H:i:s');
        $user_id = 'user_' . time();
        
        $stmt->bind_param("ssssssss", 
            $complaint_id, 
            $user_id, 
            $title, 
            $category, 
            $full_description, 
            $status, 
            $priority, 
            $created_at, 
            $updated_at
        );
        
        if ($stmt->execute()) {
            // Log complaint action
            logComplaintAction($complaint_id, $data);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true, 
                'message' => 'Complaint submitted successfully',
                'complaint_id' => $complaint_id,
                'type' => $data['type'],
                'response_time' => $data['type'] === 'emergency' ? '5-10 minutes' : 'Standard processing',
                'priority' => $priority,
                'evidence_count' => isset($data['evidence']) ? count($data['evidence']['photos']) + count($data['evidence']['videos']) : 0
            ]);
        } else {
            $error = $stmt->error;
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to submit complaint: ' . $error]);
        }
        
        $stmt->close();
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get complaint statistics
    $sql = "SELECT 
                COUNT(*) as total_complaints,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'under_investigation' THEN 1 ELSE 0 END) as under_investigation,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_resolution_time
             FROM complaints";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $stats = $result->fetch_assoc();
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_complaints' => (int)$stats['total_complaints'],
                'high_priority' => (int)$stats['high_priority'],
                'medium_priority' => (int)$stats['medium_priority'],
                'low_priority' => (int)$stats['low_priority'],
                'pending' => (int)$stats['pending'],
                'under_investigation' => (int)$stats['under_investigation'],
                'resolved' => (int)$stats['resolved'],
                'avg_resolution_time' => round($stats['avg_resolution_time'], 1),
                'response_time' => 'Standard: 24-48 hours, Emergency: 5-10 minutes'
            ]
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}

function logComplaintAction($complaint_id, $data) {
    // Log complaint action for tracking
    $log_message = sprintf(
        "COMPLAINT: %s | Type: %s | Priority: %s | Category: %s | Contact: %s | Location: %s",
        $complaint_id,
        $data['type'],
        $data['priority'],
        $data['complaintCategory'],
        $data['contactNumber'],
        $data['location']
    );
    
    // In a real system, this would:
    // 1. Send confirmation SMS
    // 2. Email acknowledgment
    // 3. Store evidence files
    // 4. Log action for audit trail
    
    error_log($log_message);
}
?>
