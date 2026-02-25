<?php
// Simple debug script for registration
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Registration Debug - Simple</h1>";

// Step 1: Check if config.php exists and works
echo "<h2>Step 1: Config Check</h2>";
if (file_exists(__DIR__ . '/config.php')) {
    echo "<p style='color: green;'>✓ config.php exists</p>";
    try {
        $config = require_once __DIR__ . '/config.php';
        echo "<p style='color: green;'>✓ config.php loaded successfully</p>";
        if (isset($config['conn']) && $config['conn']) {
            echo "<p style='color: green;'>✓ Database connection available</p>";
        } else {
            echo "<p style='color: red;'>✗ Database connection failed</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ config.php error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color: red;'>✗ config.php not found</p>";
}

// Step 2: Check if db.php exists and loads
echo "<h2>Step 2: DB Functions Check</h2>";
if (file_exists(__DIR__ . '/db.php')) {
    echo "<p style='color: green;'>✓ db.php exists</p>";
    try {
        require_once __DIR__ . '/db.php';
        echo "<p style='color: green;'>✓ db.php loaded successfully</p>";
        
        // Test find_user_by_email function
        if (function_exists('find_user_by_email')) {
            echo "<p style='color: green;'>✓ find_user_by_email function exists</p>";
        } else {
            echo "<p style='color: red;'>✗ find_user_by_email function missing</p>";
        }
        
        // Test add_user function
        if (function_exists('add_user')) {
            echo "<p style='color: green;'>✓ add_user function exists</p>";
        } else {
            echo "<p style='color: red;'>✗ add_user function missing</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ db.php error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color: red;'>✗ db.php not found</p>";
}

// Step 3: Test database operations
echo "<h2>Step 3: Database Operations Test</h2>";
try {
    global $conn;
    if ($conn) {
        echo "<p style='color: green;'>✓ Global conn available</p>";
        
        // Test simple query
        $result = $conn->query("SELECT 1");
        if ($result) {
            echo "<p style='color: green;'>✓ Simple query works</p>";
        } else {
            echo "<p style='color: red;'>✗ Simple query failed: " . $conn->error . "</p>";
        }
        
        // Check users table
        $result = $conn->query("DESCRIBE users");
        if ($result) {
            echo "<p style='color: green;'>✓ Users table accessible</p>";
            echo "<table border='1'><tr><th>Field</th><th>Type</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr><td>{$row['Field']}</td><td>{$row['Type']}</td></tr>";
            }
            echo "</table>";
        } else {
            echo "<p style='color: red;'>✗ Users table not accessible: " . $conn->error . "</p>";
        }
    } else {
        echo "<p style='color: red;'>✗ Global conn not available</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Database test error: " . $e->getMessage() . "</p>";
}

// Step 4: Test actual user creation
echo "<h2>Step 4: User Creation Test</h2>";
try {
    $test_email = 'test_' . time() . '@example.com';
    $test_data = [
        'full_name' => 'Test User',
        'mobile' => '9876543210',
        'address' => 'Test Address'
    ];
    
    echo "<p>Testing user creation for: $test_email</p>";
    
    // Check if user already exists
    $existing = find_user_by_email($test_email);
    if ($existing) {
        echo "<p style='color: orange;'>⚠ Test user already exists, deleting...</p>";
        $stmt = $conn->prepare("DELETE FROM users WHERE email = ?");
        $stmt->bind_param("s", $test_email);
        $stmt->execute();
        $stmt->close();
    }
    
    // Try to create user
    $new_user = add_user($test_email, 'testpass123', 'user', $test_data);
    if ($new_user) {
        echo "<p style='color: green;'>✓ User created successfully!</p>";
        echo "<pre>" . print_r($new_user, true) . "</pre>";
        
        // Clean up
        $stmt = $conn->prepare("DELETE FROM users WHERE email = ?");
        $stmt->bind_param("s", $test_email);
        $stmt->execute();
        $stmt->close();
        echo "<p style='color: blue;'>Test user cleaned up</p>";
    } else {
        echo "<p style='color: red;'>✗ User creation failed</p>";
        echo "<p>MySQL Error: " . $conn->error . "</p>";
        echo "<p>MySQL Errno: " . $conn->errno . "</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ User creation exception: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p><a href='register.php'>Go to Registration Page</a></p>";
echo "<p><a href='test_registration_fix.php'>Run Full Test</a></p>";
?>
