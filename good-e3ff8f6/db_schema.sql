-- SQL schema for the PHP app (XAMPP / MySQL)
-- Creates database `exam` and `users` table expected by `db.php`

CREATE DATABASE IF NOT EXISTS `exam` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `exam`;

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

-- You can import this file in phpMyAdmin or run: mysql -u root -p < db_schema.sql
