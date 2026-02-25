<?php

// Enable output buffering and error handling for JSON responses

ob_start();

error_reporting(E_ALL);

require_once __DIR__ . '/config.php';

// Get configuration
$config = include __DIR__ . '/config.php';
$conn = $config['conn'];

// Function to send clean JSON response

if (!function_exists('send_json_response')) {

    function send_json_response($success, $message, $data = null) {

        ob_clean();

        header('Content-Type: application/json');

        header("Access-Control-Allow-Origin: *");

        $response = ['success' => $success, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);

        exit;

    }

}



// db.php - Database helper for MySQL connection

// Uses MySQL database for user storage



// Database connection

$host = "localhost";

$user = "root";

$pass = "";

$db   = "exam";



$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {

    // Check if this is an AJAX request

    $isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

    if ($isAjax) {

        send_json_response(false, 'Database connection failed');

    } else {

        die("Connection failed: " . $conn->connect_error);

    }

}

$conn->set_charset("utf8mb4");



function find_user_by_email($email) {

    global $conn;

    $email = strtolower($email);

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");

    if ($stmt === false) {
        return null;
    }

    $stmt->bind_param("s", $email);

    $stmt->execute();

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

    $created_at = date('c');

    

    $full_name = $extra['full_name'] ?? '';

    $mobile = $extra['mobile'] ?? '';

    $address = $extra['address'] ?? '';

    

    $stmt = $conn->prepare("INSERT INTO users (id, email, password, role, full_name, mobile, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    if ($stmt === false) {
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
            ORDER BY distance LIMIT 1";
    
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
function get_station_complaints($station_id, $limit = null) {
    global $conn;
    
    $sql = "SELECT * FROM complaints WHERE assigned_station_id = ? ORDER BY 
            CASE WHEN priority_level = 'emergency' THEN 0 ELSE 1 END,
            created_at DESC";
    
    if ($limit) {
        $sql .= " LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $station_id, $limit);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $station_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    
    $stmt->close();
    return $complaints;
}

// Get complaints for specific user email
function get_user_complaints($user_email, $limit = null) {
    global $conn;
    
    $sql = "SELECT * FROM complaints WHERE user_email = ? ORDER BY created_at DESC";
    
    if ($limit) {
        $sql .= " LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $user_email, $limit);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $user_email);
    }
    
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
    
    // Escalate emergency complaints older than 10 minutes
    $emergency_time = date('Y-m-d H:i:s', strtotime('-10 minutes'));
    $sql = "UPDATE complaints SET escalated = TRUE, escalated_at = NOW() 
            WHERE priority_level = 'emergency' AND status NOT IN ('resolved', 'closed') 
            AND created_at < ? AND escalated = FALSE";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $emergency_time);
    $stmt->execute();
    $stmt->close();
    
    // Escalate normal complaints older than 48 hours
    $normal_time = date('Y-m-d H:i:s', strtotime('-48 hours'));
    $sql = "UPDATE complaints SET escalated = TRUE, escalated_at = NOW() 
            WHERE priority_level = 'normal' AND status NOT IN ('resolved', 'closed') 
            AND created_at < ? AND escalated = FALSE";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $normal_time);
    $stmt->execute();
    $stmt->close();
}

// Submit feedback
function submit_complaint_feedback($complaint_id, $rating, $comment) {
    global $conn;
    
    $sql = "UPDATE complaints SET feedback_submitted = TRUE, feedback_rating = ?, feedback_comment = ?, escalated = TRUE, escalated_at = NOW() 
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isi", $rating, $comment, $complaint_id);
    
    if ($stmt->execute()) {
        $stmt->close();
        return true;
    }
    
    $stmt->close();
    return false;
}

?>