<?php
/**
 * Database Configuration for ObservX
 * Update these values for your production environment
 */

// Database Configuration
$host = getenv('DB_HOST') ?: 'localhost';
$user = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: '';
$database = getenv('DB_NAME') ?: 'observx';

// Create database connection
$conn = mysqli_connect($host, $user, $password, $database);

// Check connection
if (!$conn) {
    error_log("Database connection failed: " . mysqli_connect_error());
    die("Database connection failed. Please check configuration.");
}

// Set charset
$conn->set_charset("utf8mb4");

// Base URL for API calls (auto-detect)
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$base_url = $protocol . '://' . $host . dirname($_SERVER['PHP_SELF']);

// Upload configuration
$upload_dir = __DIR__ . '/uploads/';
$max_file_size = 10 * 1024 * 1024; // 10MB
$allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov'];

// Ensure uploads directory exists
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        error_log("Failed to create uploads directory: " . $upload_dir);
    }
}

// Return configuration
return [
    'conn' => $conn,
    'base_url' => $base_url,
    'upload_dir' => $upload_dir,
    'max_file_size' => $max_file_size,
    'allowed_types' => $allowed_types
];
?>
