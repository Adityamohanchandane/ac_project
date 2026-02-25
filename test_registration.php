<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Registration Test</h1>";

// Test config loading
try {
    require_once __DIR__ . '/config.php';
    $config = include __DIR__ . '/config.php';
    $conn = $config['conn'];
    echo "<p style='color: green;'>✅ Config loaded successfully</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Config error: " . $e->getMessage() . "</p>";
    exit;
}

// Test database connection
if ($conn) {
    echo "<p style='color: green;'>✅ Database connected</p>";
    
    // Test if users table exists
    $result = mysqli_query($conn, "SHOW TABLES LIKE 'users'");
    if (mysqli_num_rows($result) > 0) {
        echo "<p style='color: green;'>✅ Users table exists</p>";
        
        // Test user creation function
        if (function_exists('find_user_by_email')) {
            echo "<p style='color: green;'>✅ find_user_by_email function exists</p>";
        } else {
            echo "<p style='color: red;'>❌ find_user_by_email function missing</p>";
        }
        
        if (function_exists('add_user')) {
            echo "<p style='color: green;'>✅ add_user function exists</p>";
        } else {
            echo "<p style='color: red;'>❌ add_user function missing</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Users table missing</p>";
        echo "<p>Import db_schema.sql to create tables</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Database connection failed</p>";
}

echo "<h2>Test Registration Form</h2>";
?>
<form method="POST" action="register.php" style="max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <div class="mb-3">
        <label>Email:</label>
        <input type="email" name="email" class="form-control" required>
    </div>
    <div class="mb-3">
        <label>Password:</label>
        <input type="password" name="password" class="form-control" required>
    </div>
    <div class="mb-3">
        <label>Confirm Password:</label>
        <input type="password" name="password2" class="form-control" required>
    </div>
    <div class="mb-3">
        <label>Full Name:</label>
        <input type="text" name="fullName" class="form-control" required>
    </div>
    <div class="mb-3">
        <label>Mobile:</label>
        <input type="tel" name="mobile" class="form-control" required>
    </div>
    <div class="mb-3">
        <label>Address:</label>
        <textarea name="address" class="form-control" required></textarea>
    </div>
    <button type="submit" class="btn btn-primary">Test Register</button>
</form>

<p><a href="index.html">← Back to Main App</a></p>
?>
