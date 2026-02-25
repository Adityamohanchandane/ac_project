INSERT INTO police_stations (
  id, police_id, station_name, email, password,
  station_latitude, station_longitude, jurisdiction_radius, address, phone, created_at
) VALUES (
  'station_adii123',
  'POL_ADII',
  'Adii Police Station',
  'adii123@gmail.com',
  '$2y$10$iv4s9j1gylBWMP7W0Y0HDeY92rtcHgxUlXpPRvJmpaCEUHWdjj0Su',
  19.00000000,
  72.00000000,
  10.00,
  'Local address',
  '0000000000',
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  station_name = VALUES(station_name),
  station_latitude = VALUES(station_latitude),
  station_longitude = VALUES(station_longitude);<?php
// create_db.php — helper to create the `observx` database and required tables.
// Usage:
// 1) Copy this file to your XAMPP htdocs folder (e.g., C:\\xampp\\htdocs) and open
//    http://localhost/create_db.php in the browser.
// 2) Or run on the machine with PHP CLI: php create_db.php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbName = 'observx';

function out($msg) { echo htmlspecialchars($msg) . "<br>\n"; }

// Connect to MySQL server
$mysqli = new mysqli($host, $user, $pass);
if ($mysqli->connect_error) {
    http_response_code(500);
    out('Connection failed: ' . $mysqli->connect_error);
    exit;
}

out('Connected to MySQL.');

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($mysqli->query($sql)) {
    out("Database `$dbName` ready.");
} else {
    http_response_code(500);
    out('Failed to create database: ' . $mysqli->error);
    exit;
}

// Select database
if (!$mysqli->select_db($dbName)) {
    http_response_code(500);
    out('Failed to select database: ' . $mysqli->error);
    exit;
}

// Create users table
$createUsers = <<<SQL
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `full_name` VARCHAR(255) DEFAULT '',
  `mobile` VARCHAR(50) DEFAULT '',
  `address` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createUsers)) {
    out('`users` table created or already exists.');
} else {
    http_response_code(500);
    out('Failed to create users table: ' . $mysqli->error);
    exit;
}

// Create contact/messages table `sonu`
$createSonu = <<<SQL
CREATE TABLE IF NOT EXISTS `sonu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createSonu)) {
    out('`sonu` table created or already exists.');
} else {
    http_response_code(500);
    out('Failed to create sonu table: ' . $mysqli->error);
    exit;
}

// Create complaints table
$createComplaints = <<<SQL
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` VARCHAR(64) NOT NULL,
  `complaint_id` VARCHAR(64) UNIQUE NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_email` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `incident_date` DATETIME DEFAULT NULL,
  `user_location` JSON DEFAULT NULL,
  `crime_location` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `priority_level` VARCHAR(20) DEFAULT 'normal',
  `assigned_station_id` VARCHAR(64) DEFAULT NULL,
  `assigned_to` VARCHAR(64) DEFAULT NULL,
  `police_remarks` TEXT DEFAULT NULL,
  `escalated` BOOLEAN DEFAULT FALSE,
  `escalated_at` DATETIME DEFAULT NULL,
  `feedback_submitted` BOOLEAN DEFAULT FALSE,
  `feedback_rating` INT DEFAULT NULL,
  `feedback_comment` TEXT DEFAULT NULL,
  `feedback_date` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_complaint_id` (`complaint_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_user_email` (`user_email`),
  KEY `idx_assigned_station` (`assigned_station_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createComplaints)) {
    out('`complaints` table created or already exists.');
} else {
    http_response_code(500);
    out('Failed to create complaints table: ' . $mysqli->error);
    exit;
}

// Create police stations table
$createPoliceStations = <<<SQL
CREATE TABLE IF NOT EXISTS `police_stations` (
  `id` VARCHAR(64) NOT NULL,
  `police_id` VARCHAR(50) NOT NULL UNIQUE,
  `station_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `station_latitude` DECIMAL(10, 8) NOT NULL,
  `station_longitude` DECIMAL(11, 8) NOT NULL,
  `jurisdiction_radius` DECIMAL(5, 2) DEFAULT 10.00,
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_police_id` (`police_id`),
  UNIQUE KEY `uniq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createPoliceStations)) {
    out('`police_stations` table created or already exists.');
} else {
    http_response_code(500);
    out('Failed to create police_stations table: ' . $mysqli->error);
    exit;
}

// Insert test police station if not exists
$testPoliceStation = <<<SQL
INSERT INTO `police_stations` (
  `id`, `police_id`, `station_name`, `email`, `password`, 
  `station_latitude`, `station_longitude`, `jurisdiction_radius`, 
  `address`, `phone`
) VALUES (
  'station_001', 
  'POL001', 
  'Central Police Station', 
  'central@observx.gov.in', 
  '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  19.0760, 
  72.8777, 
  10.00,
  'Mumbai Central, Maharashtra',
  '022-12345678'
) ON DUPLICATE KEY UPDATE `station_name` = VALUES(`station_name`);
SQL;

if ($mysqli->query($testPoliceStation)) {
    out('Test police station inserted or already exists.');
} else {
    out('Note: Police station insert skipped (may already exist): ' . $mysqli->error);
}

// Insert test users for demo/testing
$testPassword = password_hash('password123', PASSWORD_DEFAULT);
$testUsers = <<<SQL
INSERT INTO `users` (
  `id`, `email`, `password`, `role`, `full_name`, `mobile`, `address`
) VALUES 
  ('user_test_001', 'test@example.com', '$testPassword', 'user', 'Test User', '9876543210', 'Test Address'),
  ('user_admin_001', 'admin@example.com', '$testPassword', 'admin', 'Admin User', '9876543211', 'Admin Address')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
SQL;

// Execute with error suppression since emails might already exist
@$mysqli->query($testUsers);

out('Done. You can now use the application with the MySQL database.');
out('');
out('Test Credentials:');
out('  Email: test@example.com | Password: password123 (User)');
out('  Email: admin@example.com | Password: password123 (Admin)');
out('');
out('Police Station Login:');
out('  Email: central@observx.gov.in | Password: password');

$mysqli->close();

?>
