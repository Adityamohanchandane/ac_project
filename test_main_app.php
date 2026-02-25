<?php
// Test main application like a human user
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🏠 Main Application Test</h1>";

// Test database connection first
$conn = new mysqli("localhost", "root", "", "observx");
if ($conn->connect_error) {
    echo "<div style='background: #ffe6e6; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3 style='color: #d63031;'>❌ DATABASE CONNECTION FAILED</h3>";
    echo "<p><strong>Error:</strong> " . $conn->connect_error . "</p>";
    echo "<h4>🔧 FIX STEPS:</h4>";
    echo "<ol>";
    echo "<li>Start XAMPP Control Panel</li>";
    echo "<li>Click 'Start' for Apache</li>";
    echo "<li>Click 'Start' for MySQL</li>";
    echo "<li>Import db_schema.sql to create 'observx' database</li>";
    echo "<li>Refresh this page</li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #e6f7ff; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3 style='color: #0066cc;'>✅ DATABASE CONNECTED</h3>";
    
    // Check tables
    $users_check = $conn->query("SELECT COUNT(*) as count FROM users");
    $complaints_check = $conn->query("SELECT COUNT(*) as count FROM complaints");
    
    if ($users_check && $complaints_check) {
        $users_count = $users_check->fetch_assoc()['count'];
        $complaints_count = $complaints_check->fetch_assoc()['count'];
        
        echo "<p><strong>Users:</strong> $users_count</p>";
        echo "<p><strong>Complaints:</strong> $complaints_count</p>";
        
        echo "<h4>🎯 TEST REGISTRATION:</h4>";
        echo "<p>Try registering a new user below:</p>";
        echo "<a href='register.php' style='background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>📝 Go to Registration</a>";
        
        echo "<h4>🎯 TEST LOGIN:</h4>";
        echo "<p>Try logging in with existing user:</p>";
        echo "<a href='login.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔐 Go to Login</a>";
        
        echo "<h4>🎯 TEST MAIN APP:</h4>";
        echo "<p>Test the full application:</p>";
        echo "<a href='index.html' style='background: #6f42c1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🏠 Go to Main App</a>";
        
    } else {
        echo "<p style='color: red;'>❌ Error checking tables</p>";
    }
    
    echo "</div>";
    $conn->close();
}

echo "<div style='margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;'>";
echo "<h3>📋 HUMAN TESTING CHECKLIST:</h3>";
echo "<ul>";
echo "<li>☐ XAMPP Apache is running (green in control panel)</li>";
echo "<li>☐ XAMPP MySQL is running (green in control panel)</li>";
echo "<li>☐ Database 'observx' exists</li>";
echo "<li>☐ Registration form loads without errors</li>";
echo "<li>☐ Can register new user</li>";
echo "<li>☐ Can login with registered user</li>";
echo "<li>☐ Main application loads</li>";
echo "<li>☐ Can file complaint</li>";
echo "</ul>";
echo "</div>";
?>
