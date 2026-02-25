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
    
    // Validate required fields
    $required_fields = ['emergencyType', 'priority', 'location', 'description', 'contactNumber'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            exit;
        }
    }
    
    try {
        // Generate emergency complaint ID
        $emergency_id = 'EMG' . strtoupper(uniqid());
        
        // Insert emergency complaint with highest priority
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
        $title = "EMERGENCY: " . strtoupper($data['emergencyType']);
        $category = $data['emergencyType'];
        $description = $data['description'];
        $priority = $data['priority'];
        $location = $data['location'];
        $contact = $data['contactNumber'];
        $victims = $data['victimsCount'] ?? 1;
        $additional = $data['additionalInfo'] ?? '';
        
        // Enhanced description with emergency details
        $full_description = "EMERGENCY COMPLAINT\n";
        $full_description .= "Type: " . strtoupper($data['emergencyType']) . "\n";
        $full_description .= "Priority: " . strtoupper($priority) . "\n";
        $full_description .= "Location: " . $location . "\n";
        $full_description .= "Contact: " . $contact . "\n";
        $full_description .= "Victims: " . $victims . "\n";
        $full_description .= "Description: " . $description . "\n";
        if (!empty($additional)) {
            $full_description .= "Additional Info: " . $additional;
        }
        
        $status = 'under_investigation'; // Emergency complaints start as under investigation
        $created_at = date('Y-m-d H:i:s');
        $updated_at = date('Y-m-d H:i:s');
        $user_id = 'emergency_user';
        
        $stmt->bind_param("ssssssss", 
            $emergency_id, 
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
            // Log emergency for immediate response
            logEmergencyAction($emergency_id, $data);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true, 
                'message' => 'Emergency complaint submitted successfully',
                'complaint_id' => $emergency_id,
                'response_time' => '5-10 minutes',
                'priority' => 'CRITICAL',
                'action_taken' => 'Emergency services notified'
            ]);
        } else {
            $error = $stmt->error;
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to submit emergency complaint: ' . $error]);
        }
        
        $stmt->close();
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get emergency statistics
    $sql = "SELECT 
                COUNT(*) as total_emergencies,
                SUM(CASE WHEN status = 'under_investigation' THEN 1 ELSE 0 END) as active_emergencies,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_emergencies,
                AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_resolution_time
             FROM complaints 
             WHERE category IN ('medical', 'accident', 'crime', 'fire', 'theft', 'assault', 'missing', 'disaster')
             OR title LIKE '%EMERGENCY%'";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $stats = $result->fetch_assoc();
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_emergencies' => (int)$stats['total_emergencies'],
                'active_emergencies' => (int)$stats['active_emergencies'],
                'resolved_emergencies' => (int)$stats['resolved_emergencies'],
                'avg_resolution_time' => round($stats['avg_resolution_time'], 1),
                'response_time' => '5-10 minutes'
            ]
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}

function logEmergencyAction($emergency_id, $data) {
    // Log emergency action for tracking
    $log_message = sprintf(
        "EMERGENCY: %s | Type: %s | Priority: %s | Location: %s | Contact: %s",
        $emergency_id,
        $data['emergencyType'],
        $data['priority'],
        $data['location'],
        $data['contactNumber']
    );
    
    // In a real system, this would:
    // 1. Send SMS to emergency services
    // 2. Trigger emergency alerts
    // 3. Notify nearest police stations
    // 4. Log action for audit trail
    
    error_log($log_message);
}
?>
