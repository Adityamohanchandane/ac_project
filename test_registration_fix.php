<?php
// Test script to verify registration fixes
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Registration Fix Test</h1>";

// Load database connection
require_once __DIR__ . '/config.php';

// Test 1: Database Connection
echo "<h2>✓ Test 1: Database Connection</h2>";
if ($conn) {
    echo "<p style='color: green;'>Database connection: SUCCESS</p>";
} else {
    echo "<p style='color: red;'>Database connection: FAILED</p>";
    exit;
}

// Test 2: Check if users table exists
echo "<h2>✓ Test 2: Users Table Check</h2>";
$result = $conn->query("SHOW TABLES LIKE 'users'");
if ($result && $result->num_rows > 0) {
    echo "<p style='color: green;'>Users table exists: SUCCESS</p>";
} else {
    echo "<p style='color: red;'>Users table missing: FAILED</p>";
}

// Test 3: Test find_user_by_email function
echo "<h2>✓ Test 3: find_user_by_email Function</h2>";
require_once __DIR__ . '/db.php';

$test_email = 'nonexistent_' . time() . '@test.com';
$user = find_user_by_email($test_email);
if ($user === null) {
    echo "<p style='color: green;'>find_user_by_email returns null for non-existent user: SUCCESS</p>";
} else {
    echo "<p style='color: red;'>find_user_by_email should return null for non-existent user: FAILED</p>";
}

// Test 4: Test add_user function
echo "<h2>✓ Test 4: add_user Function</h2>";
$test_user_email = 'test_user_' . time() . '@test.com';
$test_user_data = [
    'full_name' => 'Test User',
    'mobile' => '1234567890',
    'address' => '123 Test Street'
];

$new_user = add_user($test_user_email, 'testpassword123', 'user', $test_user_data);
if ($new_user) {
    echo "<p style='color: green;'>add_user function: SUCCESS</p>";
    echo "<pre>User created: " . print_r($new_user, true) . "</pre>";
    
    // Clean up - delete test user
    $stmt = $conn->prepare("DELETE FROM users WHERE email = ?");
    $stmt->bind_param("s", $test_user_email);
    $stmt->execute();
    $stmt->close();
    echo "<p style='color: blue;'>Test user cleaned up</p>";
} else {
    echo "<p style='color: red;'>add_user function: FAILED</p>";
    echo "<p>MySQL Error: " . $conn->error . "</p>";
}

// Test 5: Test duplicate email handling
echo "<h2>✓ Test 5: Duplicate Email Handling</h2>";
$dup_email = 'duplicate_test_' . time() . '@test.com';

// Create first user
$user1 = add_user($dup_email, 'password123', 'user', $test_user_data);
if ($user1) {
    echo "<p>First user created successfully</p>";
    
    // Try to create duplicate
    $user2 = add_user($dup_email, 'password456', 'user', $test_user_data);
    if ($user2 === null) {
        echo "<p style='color: green;'>Duplicate email correctly rejected: SUCCESS</p>";
    } else {
        echo "<p style='color: red;'>Duplicate email should be rejected: FAILED</p>";
    }
    
    // Clean up
    $stmt = $conn->prepare("DELETE FROM users WHERE email = ?");
    $stmt->bind_param("s", $dup_email);
    $stmt->execute();
    $stmt->close();
} else {
    echo "<p style='color: red;'>Could not create test user for duplicate test</p>";
}

echo "<h2>✓ All Tests Completed</h2>";
echo "<p><a href='register.php'>Go to Registration Page</a></p>";
?>
