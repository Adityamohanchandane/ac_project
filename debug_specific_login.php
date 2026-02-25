<?php
// Debug specific login issue for adii@gmail.com
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/db.php';

echo "<h2>Debug Login for adii@gmail.com</h2>";

// Test database connection
if (!$conn) {
    echo "<p style='color: red;'>❌ Database connection failed</p>";
    exit;
}

$email = 'adii@gmail.com';
echo "<h3>Checking user: {$email}</h3>";

// Check if user exists
echo "<h3>1. Direct Database Query</h3>";
$direct_query = mysqli_query($conn, "SELECT * FROM users WHERE email = '$email'");
if ($direct_query) {
    $user_count = mysqli_num_rows($direct_query);
    echo "<p>Direct query found: <strong>{$user_count}</strong> users</p>";
    
    if ($user_count > 0) {
        $user_data = mysqli_fetch_assoc($direct_query);
        echo "<h4>User Details:</h4>";
        echo "<pre>";
        print_r($user_data);
        echo "</pre>";
    }
} else {
    echo "<p style='color: red;'>❌ Direct query failed: " . mysqli_error($conn) . "</p>";
}

// Test the find_user_by_email function
echo "<h3>2. Testing find_user_by_email Function</h3>";
$found_user = find_user_by_email($email);
if ($found_user) {
    echo "<p style='color: green;'>✅ User found via function</p>";
    echo "<pre>";
    print_r($found_user);
    echo "</pre>";
} else {
    echo "<p style='color: red;'>❌ User NOT found via function</p>";
}

// If user exists, test password verification
if ($found_user) {
    echo "<h3>3. Password Verification Tests</h3>";
    
    // Test common passwords
    $test_passwords = ['password', '12345678', 'adii123', 'admin', 'test123', 'adii'];
    
    foreach ($test_passwords as $test_pass) {
        if (verify_password($test_pass, $found_user['password'])) {
            echo "<p style='color: green;'>✅ Password '{$test_pass}' WORKS!</p>";
            echo "<p><strong>This user can login with: {$test_pass}</strong></p>";
        } else {
            echo "<p style='color: orange;'>⚠️ Password '{$test_pass}' failed</p>";
        }
    }
}

// Check all users in database
echo "<h3>4. All Users in Database</h3>";
$all_users = mysqli_query($conn, "SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC");
if ($all_users) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Email</th><th>Full Name</th><th>Created At</th></tr>";
    while ($user = mysqli_fetch_assoc($all_users)) {
        $row_style = ($user['email'] === $email) ? "background: yellow;" : "";
        echo "<tr style='{$row_style}'>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['full_name']}</td>";
        echo "<td>{$user['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>❌ Error fetching users: " . mysqli_error($conn) . "</p>";
}

// Create test user if doesn't exist
if (!$found_user) {
    echo "<h3>5. Creating Test User</h3>";
    echo "<p style='color: orange;'>User {$email} not found. Creating test user...</p>";
    
    $test_id = uniqid('', true);
    $hashed_password = password_hash('adii123', PASSWORD_DEFAULT);
    $created_at = date('Y-m-d H:i:s');
    
    $insert_query = "INSERT INTO users (id, email, password, role, full_name, mobile, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $insert_query);
    
    if ($stmt) {
        $role = 'user';
        $full_name = 'Adii Test User';
        $mobile = '1234567890';
        mysqli_stmt_bind_param($stmt, "sssssss", $test_id, $email, $hashed_password, $role, $full_name, $mobile, $created_at);
        if (mysqli_stmt_execute($stmt)) {
            echo "<p style='color: green;'>✅ Test user created successfully!</p>";
            echo "<p><strong>Login Credentials:</strong></p>";
            echo "<p>Email: {$email}</p>";
            echo "<p>Password: adii123</p>";
        } else {
            echo "<p style='color: red;'>❌ Failed to create user: " . mysqli_stmt_error($stmt) . "</p>";
        }
        mysqli_stmt_close($stmt);
    }
}

// Test login simulation
echo "<h3>6. Login Simulation</h3>";
if ($found_user) {
    echo "<form method='post' action='login.php' style='background: #e9ecef; padding: 15px; border-radius: 5px;'>";
    echo "<h4>Test Login for {$email}:</h4>";
    echo "<div class='mb-3'>";
    echo "<label>Email:</label><br>";
    echo "<input type='email' name='email' value='{$email}' required style='width: 100%; padding: 5px;'>";
    echo "</div>";
    echo "<div class='mb-3'>";
    echo "<label>Password:</label><br>";
    echo "<input type='password' name='password' value='adii123' required style='width: 100%; padding: 5px;'>";
    echo "</div>";
    echo "<button type='submit' class='btn btn-primary'>Test Login Now</button>";
    echo "</form>";
}

mysqli_close($conn);
?>
