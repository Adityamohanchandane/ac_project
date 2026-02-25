<?php
// Login diagnostic tool
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/db.php';

echo "<h2>Login System Diagnostic</h2>";

// Test database connection first
echo "<h3>1. Database Connection Test</h3>";
if (!$conn) {
    echo "<p style='color: red;'>❌ Database connection failed</p>";
    echo "<p><strong>Solution:</strong> Fix database connection first using test_db_connection.php</p>";
    exit;
} else {
    echo "<p style='color: green;'>✅ Database connection successful</p>";
}

// Check if users table exists and has data
echo "<h3>2. Users Table Analysis</h3>";
$result = mysqli_query($conn, "SELECT COUNT(*) as count FROM users");
if ($result) {
    $row = mysqli_fetch_assoc($result);
    $user_count = $row['count'];
    echo "<p>Total users in database: <strong>{$user_count}</strong></p>";
    
    if ($user_count == 0) {
        echo "<p style='color: orange;'>⚠️ No users found in database</p>";
        echo "<p><strong>Solution:</strong> Register a user first at <a href='register.php'>register.php</a></p>";
    } else {
        echo "<p style='color: green;'>✅ Users table has data</p>";
        
        // Show recent users
        $recent_users = mysqli_query($conn, "SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        echo "<h4>Recent Users:</h4>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Email</th><th>Full Name</th><th>Created At</th></tr>";
        while ($user = mysqli_fetch_assoc($recent_users)) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['full_name']}</td>";
            echo "<td>{$user['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} else {
    echo "<p style='color: red;'>❌ Error checking users table: " . mysqli_error($conn) . "</p>";
}

// Test user lookup function
echo "<h3>3. User Lookup Function Test</h3>";
$test_email = '';
if ($user_count > 0) {
    // Get first user email for testing
    $first_user = mysqli_query($conn, "SELECT email FROM users LIMIT 1");
    if ($first_user) {
        $user_data = mysqli_fetch_assoc($first_user);
        $test_email = $user_data['email'];
        
        echo "<p>Testing lookup for email: <strong>{$test_email}</strong></p>";
        
        $found_user = find_user_by_email($test_email);
        if ($found_user) {
            echo "<p style='color: green;'>✅ User found successfully</p>";
            echo "<p>User ID: {$found_user['id']}</p>";
            echo "<p>Role: {$found_user['role']}</p>";
            echo "<p>Password Hash: " . substr($found_user['password'], 0, 20) . "...</p>";
        } else {
            echo "<p style='color: red;'>❌ User lookup failed</p>";
        }
    }
}

// Test password verification
echo "<h3>4. Password Verification Test</h3>";
if ($test_email && $found_user) {
    $test_passwords = ['password', '12345678', 'test123', 'admin'];
    
    foreach ($test_passwords as $test_pass) {
        if (verify_password($test_pass, $found_user['password'])) {
            echo "<p style='color: green;'>✅ Password '{$test_pass}' verified successfully</p>";
            echo "<p><strong>This user can login with password: {$test_pass}</strong></p>";
            break;
        } else {
            echo "<p style='color: orange;'>⚠️ Password '{$test_pass}' failed</p>";
        }
    }
}

// Test police login
echo "<h3>5. Police Login Test</h3>";
$police_result = mysqli_query($conn, "SELECT COUNT(*) as count FROM police_stations");
if ($police_result) {
    $police_count = mysqli_fetch_assoc($police_result)['count'];
    echo "<p>Police stations in database: <strong>{$police_count}</strong></p>";
    
    if ($police_count > 0) {
        $police_user = mysqli_query($conn, "SELECT email, station_name FROM police_stations LIMIT 1");
        if ($police_user) {
            $police_data = mysqli_fetch_assoc($police_user);
            $police_email = $police_data['email'];
            echo "<p>Testing police login for: <strong>{$police_email}</strong> ({$police_data['station_name']})</p>";
            
            $found_police = find_police_by_email($police_email);
            if ($found_police) {
                echo "<p style='color: green;'>✅ Police station found</p>";
                
                // Test default password from schema
                if (verify_police_password($police_email, 'password')) {
                    echo "<p style='color: green;'>✅ Police login successful with password: 'password'</p>";
                } else {
                    echo "<p style='color: orange;'>⚠️ Default password 'password' failed</p>";
                }
            } else {
                echo "<p style='color: red;'>❌ Police station lookup failed</p>";
            }
        }
    } else {
        echo "<p style='color: orange;'>⚠️ No police stations found</p>";
    }
}

// Session test
echo "<h3>6. Session Configuration</h3>";
if (session_status() === PHP_SESSION_ACTIVE) {
    echo "<p style='color: green;'>✅ Session is active</p>";
} else {
    echo "<p style='color: orange;'>⚠️ Session not active</p>";
}

echo "<p>Session Save Path: " . session_save_path() . "</p>";
echo "<p>Session ID: " . session_id() . "</p>";

// Common issues and solutions
echo "<h3>7. Common Login Issues & Solutions</h3>";
echo "<div style='background: #f8f9fa; padding: 15px; border-radius: 5px;'>";
echo "<h4>Issue 1: Database Connection Failed</h4>";
echo "<p><strong>Solution:</strong> Start MySQL/XAMPP service and run test_db_connection.php</p>";

echo "<h4>Issue 2: No Users in Database</h4>";
echo "<p><strong>Solution:</strong> Register a user first at register.php</p>";

echo "<h4>Issue 3: Incorrect Password</h4>";
echo "<p><strong>Solution:</strong> Use the exact password you registered with. Check password verification above.</p>";

echo "<h4>Issue 4: Session Issues</h4>";
echo "<p><strong>Solution:</strong> Clear browser cookies and ensure PHP session path is writable</p>";

echo "<h4>Issue 5: AJAX vs Form Submission</h4>";
echo "<p><strong>Solution:</strong> The login system handles both AJAX and regular form submissions. Check browser console for JavaScript errors.</p>";
echo "</div>";

// Test login form submission
echo "<h3>8. Quick Login Test</h3>";
if ($user_count > 0) {
    echo "<form method='post' action='login.php' style='background: #e9ecef; padding: 15px; border-radius: 5px;'>";
    echo "<h4>Test Login Form:</h4>";
    echo "<div class='mb-3'>";
    echo "<label>Email:</label><br>";
    echo "<input type='email' name='email' value='{$test_email}' required style='width: 100%; padding: 5px;'>";
    echo "</div>";
    echo "<div class='mb-3'>";
    echo "<label>Password:</label><br>";
    echo "<input type='password' name='password' required style='width: 100%; padding: 5px;'>";
    echo "</div>";
    echo "<button type='submit' class='btn btn-primary'>Test Login</button>";
    echo "</form>";
}

mysqli_close($conn);
?>
