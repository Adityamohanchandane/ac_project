<?php
session_start();

// Check if this is an AJAX request
$isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

session_unset();
session_destroy();

if ($isAjax) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
} else {
    header('Location: http://localhost:5173/#/');
}
exit;
?>