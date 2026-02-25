<?php
// Test complaint endpoint
echo "<h1>🚨 Complaint Test</h1>";
echo "<p>✅ file_complaint.php is accessible!</p>";

// Test database connection
require_once __DIR__ . '/db.php';

echo "<h2>🗄️ Database Test</h2>";
try {
    $conn = new mysqli("localhost", "root", "", "observx");
    if ($conn->connect_error) {
        echo "<p>❌ Database Error: " . $conn->connect_error . "</p>";
    } else {
        echo "<p>✅ Database Connected!</p>";
        
        // Check complaints table
        $result = $conn->query("SHOW TABLES LIKE 'complaints'");
        if ($result && $result->num_rows > 0) {
            echo "<p>✅ Complaints table exists!</p>";
            
            // Count complaints
            $count_result = $conn->query("SELECT COUNT(*) as count FROM complaints");
            $count = $count_result ? $count_result->fetch_array()['count'] : 0;
            echo "<p>📊 Total complaints: " . $count . "</p>";
        } else {
            echo "<p>❌ Complaints table not found!</p>";
        }
    }
    $conn->close();
} catch (Exception $e) {
    echo "<p>❌ Exception: " . $e->getMessage() . "</p>";
}

echo "<h2>📋 Test Complaint Submission</h2>";
echo "<form method='post' action='file_complaint.php'>";
echo "<input type='hidden' name='test' value='1'>";
echo "<button type='submit' class='btn btn-primary'>Test Submit</button>";
echo "</form>";

echo "<h2>🔗 Available Files</h2>";
echo "<p><a href='file_complaint.php'>file_complaint.php</a></p>";
echo "<p><a href='phpmyadmin_alt.php'>Database Viewer</a></p>";
echo "<p><a href='register.php'>Registration</a></p>";
echo "<p><a href='login.php'>Login</a></p>";
?>
