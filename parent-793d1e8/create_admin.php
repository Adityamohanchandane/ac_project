<?php
// create_admin.php — create a user in the `exam` database using existing db.php helpers
// Usage (browser): http://localhost/create_admin.php?email=admin%40example.com&password=secret&role=admin
// Usage (CLI): php create_admin.php email@example.com secret admin

require_once __DIR__ . '/db.php';

$isCli = php_sapi_name() === 'cli';

if ($isCli) {
    $email = $argv[1] ?? null;
    $password = $argv[2] ?? null;
    $role = $argv[3] ?? 'admin';
} else {
    $email = $_GET['email'] ?? null;
    $password = $_GET['password'] ?? null;
    $role = $_GET['role'] ?? 'admin';
}

if (!$email || !$password) {
    $msg = 'Missing email or password. Provide ?email=...&password=...';
    if ($isCli) { echo $msg.PHP_EOL; exit(1); }
    echo htmlspecialchars($msg); exit;
}

if (find_user_by_email($email)) {
    $msg = 'User already exists with that email.';
    if ($isCli) { echo $msg.PHP_EOL; exit(1); }
    echo htmlspecialchars($msg); exit;
}

$user = add_user($email, $password, $role, ['full_name' => 'Admin User']);
if ($user) {
    $msg = 'User created: ' . $user['email'];
    if ($isCli) { echo $msg.PHP_EOL; exit(0); }
    echo htmlspecialchars($msg);
} else {
    $msg = 'Failed to create user.';
    if ($isCli) { echo $msg.PHP_EOL; exit(1); }
    echo htmlspecialchars($msg);
}

?>
