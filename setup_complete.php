<?php
/**
 * Complete Database Setup Script
 * This script will create the database and all required tables
 */

// Database configuration
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'observx';

function out($msg) { 
    echo htmlspecialchars($msg) . "<br>\n"; 
    flush();
}

// Connect to MySQL server
$mysqli = new mysqli($host, $user, $password);
if ($mysqli->connect_error) {
    out('Connection failed: ' . $mysqli->connect_error);
    exit;
}

out('Connected to MySQL server.');

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($mysqli->query($sql)) {
    out("Database `$database` created successfully.");
} else {
    out('Failed to create database: ' . $mysqli->error);
    exit;
}

// Select database
if (!$mysqli->select_db($database)) {
    out('Failed to select database: ' . $mysqli->error);
    exit;
}

out("Using database: `$database`");

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
    out('✓ Users table created successfully.');
} else {
    out('Failed to create users table: ' . $mysqli->error);
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
  `evidence_file` VARCHAR(255) DEFAULT NULL,
  `is_emergency` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_complaint_id` (`complaint_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_user_email` (`user_email`),
  KEY `idx_assigned_station` (`assigned_station_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority_level`),
  KEY `idx_emergency` (`is_emergency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createComplaints)) {
    out('✓ Complaints table created successfully.');
} else {
    out('Failed to create complaints table: ' . $mysqli->error);
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
    out('✓ Police stations table created successfully.');
} else {
    out('Failed to create police stations table: ' . $mysqli->error);
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
    out('✓ Contact messages table created successfully.');
} else {
    out('Failed to create contact messages table: ' . $mysqli->error);
}

// Insert test police station
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
    out('✓ Test police station inserted successfully.');
} else {
    out('Note: Police station insert skipped (may already exist): ' . $mysqli->error);
}

// Insert test users
$testPassword = password_hash('password123', PASSWORD_DEFAULT);
$testUsers = <<<SQL
INSERT INTO `users` (
  `id`, `email`, `password`, `role`, `full_name`, `mobile`, `address`
) VALUES 
  ('user_test_001', 'test@example.com', '$testPassword', 'user', 'Test User', '9876543210', 'Test Address'),
  ('user_admin_001', 'admin@example.com', '$testPassword', 'admin', 'Admin User', '9876543211', 'Admin Address')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
SQL;

if ($mysqli->query($testUsers)) {
    out('✓ Test users inserted successfully.');
} else {
    out('Note: Test users insert skipped (May already exist): ' . $mysqli->error);
}

// Create uploads directory
$uploads_dir = __DIR__ . '/uploads';
if (!is_dir($uploads_dir)) {
    if (mkdir($uploads_dir, 0755, true)) {
        out('✓ Uploads directory created successfully.');
    } else {
        out('Failed to create uploads directory: ' . $uploads_dir);
    }
} else {
    out('✓ Uploads directory already exists.');
}

out('');
out('🎉 DATABASE SETUP COMPLETED SUCCESSFULLY! 🎉');
out('');
out('Test Credentials:');
out('  User Login:');
out('    Email: test@example.com');
out('    Password: password123');
out('');
out('  Admin Login:');
out('    Email: admin@example.com');
out('    Password: password123');
out('');
out('  Police Station Login:');
out('    Email: central@observx.gov.in');
out('    Password: password');
out('');
out('Database Name: observx');
out('All tables are ready for use!');

$mysqli->close();
?>
