<?php
// Simple endpoint to trigger escalation checks (for cron or manual testing)

require_once __DIR__ . '/db.php';

// Optional basic protection: only allow CLI or localhost
if (php_sapi_name() !== 'cli') {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($remote !== '127.0.0.1' && $remote !== '::1') {
        header('HTTP/1.1 403 Forbidden');
        echo 'Forbidden';
        exit;
    }
}

$result = check_escalations();

header('Content-Type: application/json');
echo json_encode([
    'success' => (bool)$result,
    'message' => $result ? 'Escalation check completed' : 'Escalation update failed',
]);

?>

