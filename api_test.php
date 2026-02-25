<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🚀 API Endpoints Test</h1>";
echo "<style>body { font-family: Arial, sans-serif; margin: 20px; } .success { color: green; } .error { color: red; } .warning { color: orange; } .test-box { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; } code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }</style>";

// Function to test API endpoint
function test_endpoint($url, $method = 'GET', $data = null, $description = '') {
    echo "<div class='test-box'>";
    echo "<h3>🔗 Testing: $description</h3>";
    echo "<p><strong>URL:</strong> <code>$url</code></p>";
    echo "<p><strong>Method:</strong> $method</p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    if ($method == 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<p class='error'>❌ CURL Error: $error</p>";
    } else {
        echo "<p><strong>HTTP Status:</strong> $http_code</p>";
        
        if ($http_code == 200) {
            echo "<p class='success'>✅ Endpoint reachable</p>";
        } elseif ($http_code == 404) {
            echo "<p class='error'>❌ File not found</p>";
        } elseif ($http_code == 500) {
            echo "<p class='error'>❌ Server error</p>";
        } else {
            echo "<p class='warning'>⚠️ HTTP $http_code</p>";
        }
        
        echo "<p><strong>Response:</strong></p>";
        echo "<pre style='background: #f4f4f4; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto;'>" . htmlspecialchars($body) . "</pre>";
    }
    
    echo "</div>";
}

$base_url = "https://observx.netlify.app/adii";

// Test all endpoints
echo "<h2>📡 Testing All API Endpoints</h2>";

// Test 1: Registration
test_endpoint("$base_url/register.php", "GET", null, "Registration Form");

// Test 2: Login
test_endpoint("$base_url/login.php", "GET", null, "Login Form");

// Test 3: Police Login
test_endpoint("$base_url/police-login.php", "GET", null, "Police Login Form");

// Test 4: Check Auth
test_endpoint("$base_url/check_auth.php", "GET", null, "Check Authentication");

// Test 5: Get Complaints
test_endpoint("$base_url/get_complaints.php", "GET", null, "Get All Complaints");

// Test 6: Get Single Complaint
test_endpoint("$base_url/get_complaint.php?id=test123", "GET", null, "Get Single Complaint");

// Test 7: File Complaint (GET test)
test_endpoint("$base_url/file_complaint.php", "GET", null, "File Complaint Endpoint");

// Test 8: Update Complaint
test_endpoint("$base_url/update_complaint.php", "GET", null, "Update Complaint Endpoint");

// Test 9: Test Registration POST
$test_data = http_build_query([
    'email' => 'test@example.com',
    'password' => 'test123',
    'password2' => 'test123',
    'fullName' => 'Test User',
    'mobile' => '1234567890',
    'address' => 'Test Address'
]);
test_endpoint("$base_url/register.php", "POST", $test_data, "Registration POST Test");

// Test 10: Test Login POST
$login_data = http_build_query([
    'email' => 'test@example.com',
    'password' => 'test123'
]);
test_endpoint("$base_url/login.php", "POST", $login_data, "Login POST Test");

echo "<h2>📊 Summary</h2>";
echo "<p>✅ Green = Working properly</p>";
echo "<p>⚠️ Orange = Partially working</p>";
echo "<p>❌ Red = Not working</p>";

echo "<h2>🔧 Next Steps</h2>";
echo "<p>1. Check which endpoints are failing</p>";
echo "<p>2. Look at error messages above</p>";
echo "<p>3. Fix specific issues</p>";
echo "<p>4. Re-run this test</p>";

echo "<p><a href='backend_test.php'>← Back to Backend Test</a></p>";
?>
