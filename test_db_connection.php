<?php
// Test database connection and table existence
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Database Connection Test</h2>";

// Test basic connection
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'observx';

echo "<h3>Testing MySQL Connection...</h3>";

// Test connection without database first
$conn_test = mysqli_connect($host, $user, $password);
if (!$conn_test) {
    echo "<p style='color: red;'>❌ MySQL Connection Failed: " . mysqli_connect_error() . "</p>";
    echo "<p><strong>Solution:</strong> Start MySQL/XAMPP services or check credentials</p>";
} else {
    echo "<p style='color: green;'>✅ MySQL Connection Successful</p>";
    
    // Check if database exists
    $db_check = mysqli_query($conn_test, "SHOW DATABASES LIKE 'observx'");
    if (mysqli_num_rows($db_check) == 0) {
        echo "<p style='color: orange;'>⚠️ Database 'observx' does not exist</p>";
        
        // Try to create database
        if (mysqli_query($conn_test, "CREATE DATABASE observx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
            echo "<p style='color: green;'>✅ Database 'observx' created successfully</p>";
        } else {
            echo "<p style='color: red;'>❌ Failed to create database: " . mysqli_error($conn_test) . "</p>";
        }
    } else {
        echo "<p style='color: green;'>✅ Database 'observx' exists</p>";
    }
    
    mysqli_close($conn_test);
}

echo "<h3>Testing Full Database Connection...</h3>";

// Test connection with database
$conn = mysqli_connect($host, $user, $password, $database);
if (!$conn) {
    echo "<p style='color: red;'>❌ Database Connection Failed: " . mysqli_connect_error() . "</p>";
} else {
    echo "<p style='color: green;'>✅ Database Connection Successful</p>";
    
    // Check if users table exists
    $table_check = mysqli_query($conn, "SHOW TABLES LIKE 'users'");
    if (mysqli_num_rows($table_check) == 0) {
        echo "<p style='color: orange;'>⚠️ Table 'users' does not exist</p>";
        
        // Create users table
        $create_table = "CREATE TABLE `users` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        if (mysqli_query($conn, $create_table)) {
            echo "<p style='color: green;'>✅ Table 'users' created successfully</p>";
        } else {
            echo "<p style='color: red;'>❌ Failed to create table: " . mysqli_error($conn) . "</p>";
        }
    } else {
        echo "<p style='color: green;'>✅ Table 'users' exists</p>";
        
        // Show table structure
        $result = mysqli_query($conn, "DESCRIBE users");
        echo "<h4>Users Table Structure:</h4>";
        echo "<table border='1'><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th></tr>";
        while ($row = mysqli_fetch_assoc($result)) {
            echo "<tr><td>{$row['Field']}</td><td>{$row['Type']}</td><td>{$row['Null']}</td><td>{$row['Key']}</td></tr>";
        }
        echo "</table>";
    }
    
    // Test insert operation
    echo "<h3>Testing Registration Operation...</h3>";
    $test_email = 'test_' . time() . '@example.com';
    $test_id = uniqid('', true);
    $hashed_password = password_hash('test123', PASSWORD_DEFAULT);
    
    $insert_test = "INSERT INTO users (id, email, password, role, full_name, mobile, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
    $stmt = mysqli_prepare($conn, $insert_test);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "ssssss", $test_id, $test_email, $hashed_password, 'user', 'Test User', '1234567890');
        if (mysqli_stmt_execute($stmt)) {
            echo "<p style='color: green;'>✅ Test registration successful</p>";
            
            // Clean up test record
            mysqli_query($conn, "DELETE FROM users WHERE email = '$test_email'");
            echo "<p>✅ Test record cleaned up</p>";
        } else {
            echo "<p style='color: red;'>❌ Test registration failed: " . mysqli_stmt_error($stmt) . "</p>";
        }
        mysqli_stmt_close($stmt);
    } else {
        echo "<p style='color: red;'>❌ Failed to prepare statement: " . mysqli_error($conn) . "</p>";
    }
    
    mysqli_close($conn);
}

echo "<h3>PHP Configuration Check</h3>";
echo "<p>PHP Version: " . PHP_VERSION . "</p>";
echo "<p>MySQLi Extension: " . (extension_loaded('mysqli') ? '✅ Enabled' : '❌ Disabled') . "</p>";
echo "<p>JSON Extension: " . (extension_loaded('json') ? '✅ Enabled' : '❌ Disabled') . "</p>";

echo "<h3>Next Steps</h3>";
echo "<ol>";
echo "<li>If MySQL connection failed: Start XAMPP/WAMP MySQL service</li>";
echo "<li>If database doesn't exist: Import db_schema.sql via phpMyAdmin</li>";
echo "<li>If tables don't exist: Run the schema creation script</li>";
echo "<li>Test registration again after fixing database issues</li>";
echo "</ol>";
?>
