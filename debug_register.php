<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing registration page...<br>";

try {
    require_once 'db.php';
    echo "✅ db.php loaded<br>";
    
    if ($conn->connect_error) {
        echo "❌ Database connection failed: " . $conn->connect_error;
    } else {
        echo "✅ Database connected<br>";
    }
    
    // Test if find_user_by_email function exists
    if (function_exists('find_user_by_email')) {
        echo "✅ find_user_by_email function exists<br>";
    } else {
        echo "❌ find_user_by_email function not found<br>";
    }
    
    // Test if add_user function exists
    if (function_exists('add_user')) {
        echo "✅ add_user function exists<br>";
    } else {
        echo "❌ add_user function not found<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
