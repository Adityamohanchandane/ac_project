<?php

// Enable output buffering and error handling for JSON responses

ob_start();

error_reporting(E_ALL);

ini_set('display_errors', 1);



// Function to send clean JSON response

function send_json_response($success, $message) {

    ob_clean();

    header('Content-Type: application/json');

    echo json_encode(['success' => $success, 'message' => $message]);

    exit;

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

    $stmt = $conn->prepare("SELECT * FROM users WHERE LOWER(email) = ?");

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



?>