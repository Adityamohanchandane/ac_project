<?php
// Simple test like a human would do
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🧪 Quick Human Test</h1>";

// Test 1: Database connection
echo "<h2>1. Database Connection</h2>";
try {
    $conn = new mysqli("localhost", "root", "", "observx");
    if ($conn->connect_error) {
        echo "<p style='color: red;'>❌ Database connection failed: " . $conn->connect_error . "</p>";
        echo "<p>Fix: Start XAMPP MySQL and create 'observx' database</p>";
    } else {
        echo "<p style='color: green;'>✅ Database connected successfully</p>";
        
        // Test if tables exist
        $tables = ['users', 'complaints', 'police_stations'];
        foreach ($tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result->num_rows > 0) {
                echo "<p style='color: green;'>✅ Table '$table' exists</p>";
            } else {
                echo "<p style='color: red;'>❌ Table '$table' missing</p>";
            }
        }
        $conn->close();
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Exception: " . $e->getMessage() . "</p>";
}

// Test 2: File permissions
echo "<h2>2. File Permissions</h2>";
if (is_dir(__DIR__ . '/uploads')) {
    echo "<p style='color: green;'>✅ Uploads directory exists</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Uploads directory missing (will be created)</p>";
}

// Test 3: PHP functions
echo "<h2>3. Required PHP Functions</h2>";
echo "<p>password_hash: " . (function_exists('password_hash') ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>password_verify: " . (function_exists('password_verify') ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>mysqli: " . (extension_loaded('mysqli') ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>session: " . (session_status() !== PHP_SESSION_DISABLED ? '✅ Available' : '❌ Missing') . "</p>";

// Test 4: Registration form test
echo "<h2>4. Test Registration Form</h2>";
?>
<form method="POST" action="register.php" style="max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h3>Test Registration</h3>
    <div style="margin-bottom: 10px;">
        <label>Email: <input type="email" name="email" style="width: 100%; padding: 5px;" required></label>
    </div>
    <div style="margin-bottom: 10px;">
        <label>Password: <input type="password" name="password" style="width: 100%; padding: 5px;" required></label>
    </div>
    <div style="margin-bottom: 10px;">
        <label>Confirm: <input type="password" name="password2" style="width: 100%; padding: 5px;" required></label>
    </div>
    <div style="margin-bottom: 10px;">
        <label>Name: <input type="text" name="fullName" style="width: 100%; padding: 5px;" required></label>
    </div>
    <div style="margin-bottom: 10px;">
        <label>Mobile: <input type="tel" name="mobile" style="width: 100%; padding: 5px;" required></label>
    </div>
    <div style="margin-bottom: 10px;">
        <label>Address: <textarea name="address" style="width: 100%; padding: 5px;" required></textarea></label>
    </div>
    <button type="submit" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Test Register</button>
</form>

<?php
echo "<h2>5. Quick Links</h2>";
echo "<p><a href='register.php'>📝 Registration Form</a></p>";
echo "<p><a href='login.php'>🔐 Login Form</a></p>";
echo "<p><a href='index.html'>🏠 Main Application</a></p>";

echo "<h2>🎯 What to Check</h2>";
echo "<ol>";
echo "<li>Test the registration form above</li>";
echo "<li>If it works, registration is fixed</li>";
echo "<li>If it fails, check the error messages above</li>";
echo "<li>Make sure XAMPP Apache and MySQL are running</li>";
echo "<li>Ensure 'observx' database exists</li>";
echo "</ol>";
?>
