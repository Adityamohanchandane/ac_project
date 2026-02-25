<?php

// Load configuration
$config = require_once __DIR__ . '/config.php';
$conn = $config['conn'];

// Function to send JSON response
function send_json_response($success, $message, $data = null) {
    header('Content-Type: application/json');
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// User functions
function find_user_by_email($email) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    if ($stmt === false) {
        error_log("Failed to prepare find_user_by_email statement: " . $conn->error);
        return null;
    }
    
    $stmt->bind_param("s", $email);
    if (!$stmt->execute()) {
        error_log("Failed to execute find_user_by_email query: " . $stmt->error);
        $stmt->close();
        return null;
    }
    
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    return $user;
}

function verify_password($plain, $hash) {
    return password_verify($plain, $hash);
}

function add_user($email, $password, $role = 'user', $extra = []) {
    global $conn;
    
    $id = uniqid('', true);
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $created_at = date('Y-m-d H:i:s');
    
    $full_name = $extra['full_name'] ?? '';
    $mobile = $extra['mobile'] ?? '';
    $address = $extra['address'] ?? '';
    
    $stmt = $conn->prepare("INSERT INTO users (id, email, password, role, full_name, mobile, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt === false) {
        error_log("Failed to prepare statement: " . $conn->error);
        return null;
    }
    
    $stmt->bind_param("ssssssss", $id, $email, $hashed_password, $role, $full_name, $mobile, $address, $created_at);
    
    if ($stmt->execute()) {
        $user = [
            'id' => $id,
            'email' => $email,
            'password' => $hashed_password,
            'role' => $role,
            'full_name' => $full_name,
            'mobile' => $mobile,
            'address' => $address,
            'created_at' => $created_at
        ];
        $stmt->close();
        return $user;
    } else {
        error_log("Failed to execute user insert: " . $stmt->error);
        $stmt->close();
        return null;
    }
}

// Police station functions
function find_police_by_email($email) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT * FROM police_stations WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $police = $result->fetch_assoc();
        $stmt->close();
        return $police;
    }
    
    $stmt->close();
    return null;
}

function verify_police_password($email, $password) {
    $police = find_police_by_email($email);
    
    if ($police && password_verify($password, $police['password'])) {
        return $police;
    }
    
    return null;
}

// Haversine formula to calculate distance between two points
function calculate_distance($lat1, $lon1, $lat2, $lon2) {
    $earth_radius = 6371; // Earth's radius in kilometers
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    $distance = $earth_radius * $c;
    
    return $distance;
}

// Find nearest police station to given coordinates
function find_nearest_police_station($latitude, $longitude) {
    global $conn;
    
    $sql = "SELECT *, 
            (6371 * acos(cos(radians(?)) * cos(radians(station_latitude)) * 
            cos(radians(station_longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(station_latitude)))) AS distance 
            FROM police_stations 
            WHERE (6371 * acos(cos(radians(?)) * cos(radians(station_latitude)) * 
            cos(radians(station_longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(station_latitude)))) <= jurisdiction_radius
            ORDER BY distance 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("dddddd", $latitude, $longitude, $latitude, $latitude, $longitude, $latitude);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $station = $result->fetch_assoc();
        $stmt->close();
        return $station;
    }
    
    $stmt->close();
    return null;
}

// Get complaints for specific police station
function get_station_complaints($station_id) {
    global $conn;
    
    $sql = "SELECT * FROM complaints 
             WHERE assigned_station_id = ? 
             ORDER BY 
             CASE WHEN priority_level = 'emergency' THEN 0 ELSE 1 END,
             created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $station_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    
    $stmt->close();
    return $complaints;
}

// Get complaints for specific user
function get_user_complaints($user_email) {
    global $conn;
    
    $sql = "SELECT * FROM complaints 
             WHERE user_email = ? 
             ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user_email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    
    $stmt->close();
    return $complaints;
}

// Check for escalations
function check_escalations() {
    global $conn;
    
    $sql = "UPDATE complaints 
             SET escalated = 1, escalated_at = NOW() 
             WHERE status = 'pending' 
             AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) 
             AND escalated = 0";
    
    $result = $conn->query($sql);
    return $result;
}

// Submit complaint feedback
function submit_complaint_feedback($complaint_id, $rating, $comment) {
    global $conn;
    
    $sql = "UPDATE complaints 
             SET feedback_submitted = 1, 
                 feedback_rating = ?, 
                 feedback_comment = ?, 
                 feedback_date = NOW() 
             WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iss", $rating, $comment, $complaint_id);
    
    if ($stmt->execute()) {
        $stmt->close();
        return true;
    }
    
    $stmt->close();
    return false;
}
?>
