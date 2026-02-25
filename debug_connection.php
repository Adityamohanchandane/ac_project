<?php
// Simple connection test
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Database Connection Test</h1>";

// Test basic connection
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'observx';

echo "<p>Trying to connect to: $host as $user...</p>";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    echo "<p style='color: red;'>❌ Connection failed: " . mysqli_connect_error() . "</p>";
    echo "<p>Check:</p>";
    echo "<ul>";
    echo "<li>XAMPP Apache is running</li>";
    echo "<li>XAMPP MySQL is running</li>";
    echo "<li>Database 'observx' exists</li>";
    echo "<li>User 'root' has no password</li>";
    echo "</ul>";
} else {
    echo "<p style='color: green;'>✅ Connected successfully!</p>";
    
    // Test if tables exist
    $tables = ['users', 'complaints', 'police_stations'];
    foreach ($tables as $table) {
        $result = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
        if (mysqli_num_rows($result) > 0) {
            echo "<p style='color: green;'>✅ Table '$table' exists</p>";
        } else {
            echo "<p style='color: red;'>❌ Table '$table' missing</p>";
        }
    }
    
    mysqli_close($conn);
}

echo "<h2>PHP Info</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>MySQLi Extension: " . (extension_loaded('mysqli') ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>Session Support: " . (session_status() !== PHP_SESSION_DISABLED ? '✅ Available' : '❌ Missing') . "</p>";
?>
