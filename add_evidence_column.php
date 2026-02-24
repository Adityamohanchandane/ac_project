<?php
// Add evidence_file column to complaints table
require_once __DIR__ . '/db.php';

// SQL to add evidence_file column if it doesn't exist
$sql = "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS evidence_file VARCHAR(255) NULL AFTER description";

if ($conn->query($sql)) {
    echo "✅ evidence_file column added successfully to complaints table";
} else {
    echo "❌ Error adding evidence_file column: " . $conn->error;
}

$conn->close();
?>
