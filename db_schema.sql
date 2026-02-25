-- SQL schema for the PHP app (XAMPP / MySQL)
-- Creates database `observx` and `users` table expected by `db.php`

CREATE DATABASE IF NOT EXISTS `observx` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `observx`;

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

-- Contact/messages table (used by `database.php`)
CREATE TABLE IF NOT EXISTS `sonu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaints table (optional: for moving JSON complaints to MySQL)
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

-- Police stations table
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

-- Insert test police station
INSERT INTO `police_stations` (
  `id`, `police_id`, `station_name`, `email`, `password`, 
  `station_latitude`, `station_longitude`, `jurisdiction_radius`, 
  `address`, `phone`
) VALUES (
  'station_001', 
  'POL001', 
  'Central Police Station', 
  'central@observx.gov.in', 
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  19.0760, 
  72.8777, 
  10.00,
  'Mumbai Central, Maharashtra',
  '022-12345678'
) ON DUPLICATE KEY UPDATE `station_name` = VALUES(`station_name`);

-- You can import this file in phpMyAdmin or run: mysql -u root -p < db_schema.sql
