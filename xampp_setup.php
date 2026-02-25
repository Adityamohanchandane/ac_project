<?php
// Database configuration for XAMPP
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'observx_police';

// Create connection
$conn = new mysqli($host, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if it doesn't exist
$sql = "CREATE DATABASE IF NOT EXISTS $database";
if ($conn->query($sql) === TRUE) {
    echo "Database created successfully or already exists<br>";
} else {
    echo "Error creating database: " . $conn->error . "<br>";
}

// Select the database
$conn->select_db($database);

// Create users table
$sql = "CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'police') NOT NULL DEFAULT 'user',
    full_name VARCHAR(255),
    mobile VARCHAR(20),
    address TEXT,
    user_location JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "Table 'users' created successfully or already exists<br>";
} else {
    echo "Error creating users table: " . $conn->error . "<br>";
}

// Create complaints table
$sql = "CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(255) PRIMARY KEY,
    complaint_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE,
    user_location JSON,
    crime_location JSON,
    status ENUM('pending', 'investigating', 'resolved', 'rejected') DEFAULT 'pending',
    priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to VARCHAR(255),
    police_remarks TEXT,
    evidence_file VARCHAR(255),
    feedback_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";

if ($conn->query($sql) === TRUE) {
    echo "Table 'complaints' created successfully or already exists<br>";
} else {
    echo "Error creating complaints table: " . $conn->error . "<br>";
}

// Insert police user if not exists
$police_email = 'adii123@gmail.com';
$police_password = password_hash('adii123', PASSWORD_DEFAULT);

$sql = "INSERT IGNORE INTO users (id, email, password, role, full_name, mobile, address) 
        VALUES (UUID(), ?, ?, 'police', 'Police Officer', '1234567890', 'Police Station')";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $police_email, $police_password);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo "Police user created successfully<br>";
    } else {
        echo "Police user already exists<br>";
    }
} else {
    echo "Error creating police user: " . $stmt->error . "<br>";
}

$stmt->close();
$conn->close();

echo "<br><strong>Database setup completed!</strong><br>";
echo "You can now use the system with XAMPP.<br>";
echo "<a href='index.html'>Go to Homepage</a>";
?>
