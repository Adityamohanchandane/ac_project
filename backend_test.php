<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 Complete Backend Test</h1>";
echo "<style>body { font-family: Arial, sans-serif; margin: 20px; } .success { color: green; } .error { color: red; } .warning { color: orange; } .test-box { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }</style>";

// Test 1: Config and Database
echo "<div class='test-box'>";
echo "<h2>📊 Database & Config Test</h2>";

try {
    require_once __DIR__ . '/config.php';
    $config = include __DIR__ . '/config.php';
    $conn = $config['conn'];
    echo "<p class='success'>✅ Config.php loaded successfully</p>";
    
    if ($conn) {
        echo "<p class='success'>✅ Database connected</p>";
        
        // Test tables
        $tables = ['users', 'complaints', 'police_stations'];
        foreach ($tables as $table) {
            $result = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
            if (mysqli_num_rows($result) > 0) {
                echo "<p class='success'>✅ Table '$table' exists</p>";
            } else {
                echo "<p class='error'>❌ Table '$table' missing</p>";
            }
        }
    } else {
        echo "<p class='error'>❌ Database connection failed</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
}
echo "</div>";

// Test 2: Core Functions
echo "<div class='test-box'>";
echo "<h2>🔧 Core Functions Test</h2>";

// Test user functions
if (function_exists('find_user_by_email')) {
    echo "<p class='success'>✅ find_user_by_email() exists</p>";
} else {
    echo "<p class='error'>❌ find_user_by_email() missing</p>";
}

if (function_exists('add_user')) {
    echo "<p class='success'>✅ add_user() exists</p>";
} else {
    echo "<p class='error'>❌ add_user() missing</p>";
}

if (function_exists('verify_password')) {
    echo "<p class='success'>✅ verify_password() exists</p>";
} else {
    echo "<p class='error'>❌ verify_password() missing</p>";
}

// Test police functions
if (function_exists('find_police_by_email')) {
    echo "<p class='success'>✅ find_police_by_email() exists</p>";
} else {
    echo "<p class='error'>❌ find_police_by_email() missing</p>";
}

if (function_exists('find_nearest_police_station')) {
    echo "<p class='success'>✅ find_nearest_police_station() exists</p>";
} else {
    echo "<p class='error'>❌ find_nearest_police_station() missing</p>";
}

// Test complaint functions
if (function_exists('get_user_complaints')) {
    echo "<p class='success'>✅ get_user_complaints() exists</p>";
} else {
    echo "<p class='error'>❌ get_user_complaints() missing</p>";
}

if (function_exists('get_station_complaints')) {
    echo "<p class='success'>✅ get_station_complaints() exists</p>";
} else {
    echo "<p class='error'>❌ get_station_complaints() missing</p>";
}
echo "</div>";

// Test 3: File System
echo "<div class='test-box'>";
echo "<h2>📁 File System Test</h2>";

$upload_dir = __DIR__ . '/uploads/';
if (is_dir($upload_dir)) {
    echo "<p class='success'>✅ Uploads directory exists</p>";
    if (is_writable($upload_dir)) {
        echo "<p class='success'>✅ Uploads directory is writable</p>";
    } else {
        echo "<p class='warning'>⚠️ Uploads directory is not writable</p>";
    }
} else {
    echo "<p class='warning'>⚠️ Uploads directory does not exist (will be created)</p>";
}

// Check key files
$key_files = [
    'config.php' => 'Configuration',
    'db.php' => 'Database Functions', 
    'register.php' => 'Registration',
    'login.php' => 'Login',
    'file_complaint.php' => 'File Complaint',
    'get_complaints.php' => 'Get Complaints',
    'police-login.php' => 'Police Login',
    'check_auth.php' => 'Check Auth'
];

foreach ($key_files as $file => $description) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "<p class='success'>✅ $file ($description) exists</p>";
    } else {
        echo "<p class='error'>❌ $file ($description) missing</p>";
    }
}
echo "</div>";

// Test 4: Database Operations
echo "<div class='test-box'>";
echo "<h2>🗄️ Database Operations Test</h2>";

global $conn;
if ($conn) {
    // Test user count
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM users");
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        echo "<p class='success'>✅ Users table query works - Count: " . $row['count'] . "</p>";
    } else {
        echo "<p class='error'>❌ Users table query failed: " . mysqli_error($conn) . "</p>";
    }
    
    // Test complaint count
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM complaints");
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        echo "<p class='success'>✅ Complaints table query works - Count: " . $row['count'] . "</p>";
    } else {
        echo "<p class='error'>❌ Complaints table query failed: " . mysqli_error($conn) . "</p>";
    }
    
    // Test police station count
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM police_stations");
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        echo "<p class='success'>✅ Police stations table query works - Count: " . $row['count'] . "</p>";
    } else {
        echo "<p class='error'>❌ Police stations table query failed: " . mysqli_error($conn) . "</p>";
    }
}
echo "</div>";

// Test 5: PHP Environment
echo "<div class='test-box'>";
echo "<h2>🐘 PHP Environment Test</h2>";

echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>MySQLi Extension: " . (extension_loaded('mysqli') ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>Session Support: " . (session_status() !== PHP_SESSION_DISABLED ? '✅ Available' : '❌ Missing') . "</p>";
echo "<p>File Uploads: " . (ini_get('file_uploads') ? '✅ Enabled' : '❌ Disabled') . "</p>";
echo "<p>Max Upload Size: " . ini_get('upload_max_filesize') . "</p>";
echo "<p>Post Max Size: " . ini_get('post_max_size') . "</p>";
echo "</div>";

echo "<h2>🔗 Quick Links</h2>";
echo "<p><a href='test_registration.php'>📝 Test Registration</a></p>";
echo "<p><a href='debug_connection.php'>🔌 Debug Connection</a></p>";
echo "<p><a href='index.html'>🏠 Main Application</a></p>";
echo "<p><a href='register.php'>📋 Registration Form</a></p>";
echo "<p><a href='login.php'>🔐 Login Form</a></p>";

echo "<h2>📋 Summary</h2>";
echo "<p>If all tests show ✅, your backend is ready!</p>";
echo "<p>If you see ❌ errors, check the specific items above.</p>";
?>
