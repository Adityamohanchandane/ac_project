<?php
// Simple auth test and session fix
session_start();

// Clear any existing session and start fresh
if (isset($_GET['reset'])) {
    session_destroy();
    session_start();
    echo "<h2>🔄 Session Reset!</h2>";
    echo "<p><a href='?'>Continue</a></p>";
    exit;
}

// Set a test session if requested
if (isset($_GET['set_session'])) {
    $_SESSION['user'] = [
        'id' => 'test123',
        'email' => 'test@example.com',
        'role' => 'user',
        'full_name' => 'Test User'
    ];
    $_SESSION['authenticated'] = true;
    echo "<h2>✅ Test Session Set!</h2>";
    echo "<p><a href='check_auth.php'>Check Auth</a></p>";
    exit;
}

// Check current session
echo "<h1>🔍 Session Status</h1>";
echo "<div class='alert alert-info'>";
echo "<strong>Session ID:</strong> " . session_id() . "<br>";
echo "<strong>Session Data:</strong><br>";
echo "<pre style='background: #f8f9fa; padding: 10px; border-radius: 5px;'>";
print_r($_SESSION);
echo "</pre>";
echo "</div>";

// Test check_auth endpoint
echo "<h2>🔗 Test check_auth.php</h2>";
echo "<div class='card'>";
echo "<div class='card-body'>";
echo "<p>Testing: <code>http://localhost:8080/check_auth.php</code></p>";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "Accept: application/json\r\n"
    ]
]);

$response = file_get_contents('http://localhost:8080/check_auth.php', false, $context);
if ($response !== false) {
    $data = json_decode($response, true);
    echo "<h3>✅ Response Received:</h3>";
    echo "<pre style='background: #d4edda; padding: 10px; border-radius: 5px;'>";
    echo json_encode($data, JSON_PRETTY_PRINT);
    echo "</pre>";
} else {
    echo "<h3>❌ No Response from check_auth.php</h3>";
}

echo "</div>";
echo "</div>";

echo "<div class='mt-3'>";
echo "<h3>🔧 Debug Actions:</h3>";
echo "<p><a href='?set_session=1' class='btn btn-primary'>Set Test Session</a></p>";
echo "<p><a href='?reset=1' class='btn btn-warning'>Reset Session</a></p>";
echo "<p><a href='index_local.html' class='btn btn-success'>Try Local App</a></p>";
echo "</div>";

// Add some basic styling
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
    .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    .card { border: 1px solid #ddd; border-radius: 8px; margin: 10px 0; }
    .card-body { padding: 20px; }
    .btn { padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 5px; }
    .btn-primary { background: #007bff; color: white; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-success { background: #28a745; color: white; }
    pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
</style>";
?>
