<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>ObservX Application Test</h1>";

// Test config loading
try {
    require_once __DIR__ . '/config.php';
    echo "<p style='color: green;'>✅ Config.php loaded successfully</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Config.php error: " . $e->getMessage() . "</p>";
    exit;
}

// Test database functions
try {
    $config = include __DIR__ . '/config.php';
    $conn = $config['conn'];
    
    if ($conn) {
        echo "<p style='color: green;'>✅ Database connection from config works</p>";
        
        // Test a simple query
        $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM users");
        if ($result) {
            $row = mysqli_fetch_assoc($result);
            echo "<p style='color: green;'>✅ Database query works - Users count: " . $row['count'] . "</p>";
        } else {
            echo "<p style='color: red;'>❌ Database query failed: " . mysqli_error($conn) . "</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
}

// Test file uploads directory
$upload_dir = __DIR__ . '/uploads/';
if (is_dir($upload_dir)) {
    echo "<p style='color: green;'>✅ Uploads directory exists</p>";
    if (is_writable($upload_dir)) {
        echo "<p style='color: green;'>✅ Uploads directory is writable</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ Uploads directory is not writable</p>";
    }
} else {
    echo "<p style='color: orange;'>⚠️ Uploads directory does not exist (will be created automatically)</p>";
}

echo "<h2>Next Steps</h2>";
echo "<p>1. Visit: <a href='debug_connection.php'>debug_connection.php</a> to test database</p>";
echo "<p>2. Visit: <a href='index.html'>index.html</a> to test main application</p>";
echo "<p>3. Check browser console (F12) for JavaScript errors</p>";
?>
