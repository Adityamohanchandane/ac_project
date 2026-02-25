<?php
// CORS: Allow same origin and localhost for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://localhost(:[0-9]+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_HOST']);
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(false, 'Invalid request method');
}

// Basic auth check – allow both citizens and police to submit feedback
if (!isset($_SESSION['user']) && !isset($_SESSION['police'])) {
    send_json_response(false, 'Authentication required to submit feedback');
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    send_json_response(false, 'Invalid JSON payload');
}

$complaint_id = $data['complaint_id'] ?? '';
$rating = isset($data['rating']) ? (int)$data['rating'] : 0;
$comment = trim($data['comment'] ?? '');

if ($complaint_id === '' || $rating < 1 || $rating > 5) {
    send_json_response(false, 'Complaint ID and rating (1-5) are required');
}

// Look up internal ID from complaint_id
$stmt = $conn->prepare("SELECT id, status FROM complaints WHERE complaint_id = ?");
if ($stmt === false) {
    send_json_response(false, 'Database error: ' . $conn->error);
}

$stmt->bind_param("s", $complaint_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    send_json_response(false, 'Complaint not found');
}

$row = $result->fetch_assoc();
$stmt->close();

// Optionally require resolved/closed before feedback
if (!in_array($row['status'], ['resolved', 'closed'], true)) {
    // Allow but warn – adjust to strict requirement if desired
    // send_json_response(false, 'Feedback can only be submitted after resolution');
}

$internal_id = $row['id'];

if (!submit_complaint_feedback($internal_id, $rating, $comment)) {
    send_json_response(false, 'Failed to save feedback');
}

send_json_response(true, 'Feedback submitted successfully');

?>

