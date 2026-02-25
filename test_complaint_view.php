<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

// Test database connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Get all complaints to test
$sql = "SELECT complaint_id, title, status, created_at FROM complaints ORDER BY created_at DESC LIMIT 5";
$result = $conn->query($sql);

if ($result === false) {
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    exit;
}

$complaints = [];
while ($row = $result->fetch_assoc()) {
    $complaints[] = $row;
}

echo json_encode([
    'success' => true,
    'message' => 'Found ' . count($complaints) . ' complaints',
    'complaints' => $complaints
]);
?>
