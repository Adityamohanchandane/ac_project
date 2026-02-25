<?php
/**
 * e2e_test.php
 * Automated end-to-end test for registration -> DB save -> login -> dashboard.
 * Usage: php e2e_test.php [base_url]
 * Example: php e2e_test.php http://localhost/adii
 */

$base = $argv[1] ?? 'http://localhost/adii';
if (substr($base, -1) === '/') $base = rtrim($base, '/');

// Generate test user data
$ts = time();
$email = "e2e_test_{$ts}@example.com";
$password = 'TestPass123';
$fullName = 'E2E Test User';
$mobile = '9999999999';
$address = 'Test Address';

echo "E2E Test starting against: {$base}\n";
echo "Test email: {$email}\n";

function http_post($url, $data, $headers = [], $cookieFile = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $resp = curl_exec($ch);
    if ($resp === false) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL error: {$err}");
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [ 'code' => $status, 'raw' => $resp ];
}

// 1) Register
echo "\n1) Registering user...\n";
$registerUrl = $base . '/register.php';
$post = http_build_query([
    'fullName' => $fullName,
    'email' => $email,
    'mobile' => $mobile,
    'address' => $address,
    'password' => $password,
    'password2' => $password
]);
try {
    $r = http_post($registerUrl, $post, ['Accept: application/json']);
    echo "HTTP {$r['code']}\n";
    echo substr($r['raw'], 0, 1000) . "\n";
} catch (Exception $e) {
    echo "Register request failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 2) Verify DB entry by connecting using config.php
echo "\n2) Checking database for saved user...\n";
$cfgPath = __DIR__ . '/config.php';
if (!file_exists($cfgPath)) {
    echo "config.php not found in project root. Cannot verify DB.\n";
    exit(1);
}

$cfg = require $cfgPath; // returns array with 'conn'
if (empty($cfg['conn'])) {
    echo "Database connection not available via config.php\n";
    exit(1);
}
$conn = $cfg['conn'];
$emailEsc = $conn->real_escape_string($email);
$q = "SELECT id,email,full_name,mobile,created_at FROM users WHERE email = '{$emailEsc}' LIMIT 1";
$res = $conn->query($q);
if ($res === false) {
    echo "DB query failed: " . $conn->error . "\n";
    exit(1);
}
if ($res->num_rows === 0) {
    echo "User not found in DB. Registration likely failed.\n";
    exit(1);
}
$row = $res->fetch_assoc();
echo "User found: " . json_encode($row) . "\n";

// 3) Login and capture session cookie
echo "\n3) Attempting login...\n";
$loginUrl = $base . '/login.php';
$cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "e2e_cookies_{$ts}.txt";
$loginPost = http_build_query(['email' => $email, 'password' => $password]);
try {
    $r2 = http_post($loginUrl, $loginPost, ['Accept: application/json'], $cookieFile);
    echo "HTTP {$r2['code']}\n";
    echo substr($r2['raw'], 0, 1000) . "\n";
} catch (Exception $e) {
    echo "Login request failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 4) Access dashboard with cookie
echo "\n4) Accessing dashboard with session cookie...\n";
$dashUrl = $base . '/dashboard.php';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $dashUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
$dashHtml = curl_exec($ch);
$dashCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP {$dashCode}\n";
if ($dashCode !== 200) {
    echo "Dashboard returned non-200. Response snippet:\n" . substr($dashHtml,0,1000) . "\n";
    exit(1);
}
if (strpos($dashHtml, $email) !== false) {
    echo "Dashboard shows logged-in user email. Login E2E SUCCESS.\n";
    exit(0);
} else {
    echo "Dashboard did not show the user email. Session may not be persisted.\n";
    echo "Response snippet:\n" . substr($dashHtml,0,1000) . "\n";
    exit(1);
}

?>
