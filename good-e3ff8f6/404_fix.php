<?php
// 404 Error Handler and Fix Tool
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get the requested URL
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$host = $_SERVER['HTTP_HOST'];

echo "<!DOCTYPE html>";
echo "<html lang='en'>";
echo "<head>";
echo "<meta charset='utf-8'>";
echo "<meta name='viewport' content='width=device-width, initial-scale=1'>";
echo "<title>🔧 404 Fix Tool</title>";
echo "<style>";
echo "body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; background: #f8f9fa; }";
echo ".card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }";
echo ".btn { display: inline-block; padding: 12px 24px; margin: 10px 5px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; border: none; cursor: pointer; }";
echo ".btn-success { background: #28a745; } .btn-warning { background: #ffc107; color: black; } .btn-danger { background: #dc3545; }";
echo ".alert { padding: 15px; margin: 15px 0; border-radius: 5px; }";
echo ".alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }";
echo ".alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }";
echo ".alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }";
echo "pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }";
echo ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }";
echo "</style>";
echo "</head>";
echo "<body>";

echo "<div class='card'>";
echo "<h1>🔧 404 Page Not Found - COMPLETE FIX</h1>";

echo "<div class='alert alert-info'>";
echo "<strong>📊 Current Request:</strong><br>";
echo "• URL: <code>" . htmlspecialchars($requestUri) . "</code><br>";
echo "• Method: " . $method . "<br>";
echo "• Host: " . $host . "<br>";
echo "• Time: " . date('Y-m-d H:i:s') . "<br>";
echo "• Port: " . $_SERVER['SERVER_PORT'] . "<br>";
echo "</div>";

echo "<h2>🚨 Common 404 Issues & Fixes:</h2>";

// Check if this is a common wrong URL
$wrongUrls = [
    '/adii/',
    '/ac_project/',
    '/localhost/',
    '/index.html',
    '/main.html'
];

foreach ($wrongUrls as $wrongUrl) {
    if (strpos($requestUri, $wrongUrl) !== false) {
        echo "<div class='alert alert-danger'>";
        echo "<h3>❌ Wrong URL Detected: " . htmlspecialchars($wrongUrl) . "</h3>";
        echo "<p><strong>Problem:</strong> Using wrong path</p>";
        echo "<p><strong>Fix:</strong> Use correct URLs below</p>";
        echo "</div>";
    }
}

echo "<div class='grid'>";

echo "<div class='card'>";
echo "<h3>✅ WORKING URLs</h3>";
echo "<p><strong>Always use these URLs:</strong></p>";
echo "<p><a href='http://localhost:8080/' class='btn btn-success'>Home Page</a></p>";
echo "<p><a href='http://localhost:8080/register.php' class='btn btn-success'>Registration</a></p>";
echo "<p><a href='http://localhost:8080/login.php' class='btn btn-success'>Login</a></p>";
echo "<p><a href='http://localhost:8080/phpmyadmin_alt.php' class='btn btn-success'>Database</a></p>";
echo "<p><a href='http://localhost:8080/file_complaint.php' class='btn btn-success'>File Complaint</a></p>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>🔧 QUICK FIXES</h3>";
echo "<p><strong>1. Use Port 8080:</strong></p>";
echo "<p><code>http://localhost:8080/</code> (not just localhost/)</p>";
echo "<p><strong>2. Clear Cache:</strong></p>";
echo "<p>Press Ctrl+Shift+Delete</p>";
echo "<p><strong>3. Check File Names:</strong></p>";
echo "<p>Use exact file names below</p>";
echo "</div>";

echo "</div>";

echo "<h2>📁 Available Files:</h2>";
echo "<div class='card'>";

// List all PHP files
$phpFiles = glob('*.php');
$htmlFiles = glob('*.html');
$allFiles = array_merge($phpFiles, $htmlFiles);
sort($allFiles);

echo "<div class='grid'>";
foreach ($allFiles as $file) {
    echo "<div style='margin: 10px 0;'>";
    echo "<a href='" . htmlspecialchars($file) . "' class='btn'>" . htmlspecialchars($file) . "</a>";
    echo "</div>";
}
echo "</div>";
echo "</div>";

echo "<h2>🎯 Step-by-Step Solution:</h2>";
echo "<div class='alert alert-success'>";
echo "<h3>✅ SOLUTION STEPS:</h3>";
echo "<ol>";
echo "<li><strong>Click 'Home Page' button above</strong></li>";
echo "<li><strong>Test Registration page</strong></li>";
echo "<li><strong>Test Login page</strong></li>";
echo "<li><strong>Test Database page</strong></li>";
echo "<li><strong>If any page shows 404, tell me which one</strong></li>";
echo "</ol>";
echo "</div>";

echo "<h2>🔍 Debug Information:</h2>";
echo "<div class='card'>";
echo "<pre>";
echo "Request URI: " . $requestUri . "\n";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "\n";
echo "PHP Self: " . $_SERVER['PHP_SELF'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Server Port: " . $_SERVER['SERVER_PORT'] . "\n";
echo "HTTP Host: " . $_SERVER['HTTP_HOST'] . "\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "</pre>";
echo "</div>";

echo "<h2>🚀 Test These Examples:</h2>";
echo "<div class='grid'>";

echo "<div class='card'>";
echo "<h3>Example 1: Registration</h3>";
echo "<p><strong>Wrong:</strong> <code>https://observx.netlify.app/adii/register.php</code></p>";
echo "<p><strong>Correct:</strong> <code>http://localhost:8080/register.php</code></p>";
echo "<p><a href='http://localhost:8080/register.php' class='btn btn-success'>Test Correct URL</a></p>";
echo "</div>";

echo "<div class='card'>";
echo "<h3>Example 2: Login</h3>";
echo "<p><strong>Wrong:</strong> <code>http://localhost/login.php</code></p>";
echo "<p><strong>Correct:</strong> <code>http://localhost:8080/login.php</code></p>";
echo "<p><a href='http://localhost:8080/login.php' class='btn btn-success'>Test Correct URL</a></p>";
echo "</div>";

echo "</div>";

echo "<div class='alert alert-info'>";
echo "<h3>💡 If Still Getting 404:</h3>";
echo "<p>1. Make sure PHP server is running on port 8080</p>";
echo "<p>2. Check that you're using <code>http://localhost:8080/</code></p>";
echo "<p>3. Clear browser cache and restart</p>";
echo "<p>4. Tell me the exact URL that's showing 404</p>";
echo "</div>";

echo "</div>";
echo "</body>";
echo "</html>";
?>
