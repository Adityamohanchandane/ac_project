<?php
// Session debug tool
session_start();

echo "<h1>🔍 Session Debug Tool</h1>";

echo "<h2>Current Session Status:</h2>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

echo "<h2>Session ID:</h2>";
echo "<p>" . session_id() . "</p>";

echo "<h2>Cookie Status:</h2>";
echo "<pre>";
print_r($_COOKIE);
echo "</pre>";

echo "<h2>Test Session:</h2>";
$_SESSION['test'] = 'Session working at ' . date('Y-m-d H:i:s');
$_SESSION['user'] = [
    'id' => 'test123',
    'email' => 'test@example.com',
    'role' => 'user',
    'full_name' => 'Test User'
];

echo "<p>✅ Test session data set</p>";

echo "<h2>After Setting:</h2>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

echo "<h2>🔗 Test Links:</h2>";
echo "<p><a href='check_auth.php'>Check Auth API</a></p>";
echo "<p><a href='login.php'>Login Page</a></p>";
echo "<p><a href='register.php'>Register Page</a></p>";
echo "<p><a href='index.html'>Frontend</a></p>";

// Clear session test
if (isset($_GET['clear'])) {
    session_destroy();
    echo "<p>🗑️ Session cleared! <a href=''>Refresh</a></p>";
}
?>
