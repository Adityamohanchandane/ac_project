<?php
// create_db.php — helper to create the `exam` database and `users` table.
// Usage:
// 1) Copy this file to your XAMPP htdocs folder (e.g., C:\\xampp\\htdocs) and open
//    http://localhost/create_db.php in the browser.
// 2) Or run on the machine with PHP CLI: php create_db.php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbName = 'exam';

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
  `user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `incident_date` DATETIME DEFAULT NULL,
  `user_location` JSON DEFAULT NULL,
  `crime_location` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `assigned_to` VARCHAR(64) DEFAULT NULL,
  `police_remarks` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

if ($mysqli->query($createComplaints)) {
    out('`complaints` table created or already exists.');
} else {
    http_response_code(500);
    out('Failed to create complaints table: ' . $mysqli->error);
    exit;
}

out('Done. You can now use the application with the MySQL database.');

$mysqli->close();

?>
