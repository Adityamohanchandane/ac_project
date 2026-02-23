<?php
require_once __DIR__ . '/db.php';

$table = $_GET['table'] ?? '';
if (empty($table)) {
    die("Table name required");
}

// Security: Only allow specific tables
$allowed_tables = ['users', 'complaints', 'police_users', 'evidence_files'];
if (!in_array($table, $allowed_tables)) {
    die("Table not allowed");
}

echo "<!DOCTYPE html>";
echo "<html>";
echo "<head>";
echo "<title>Table Viewer - $table</title>";
echo "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>";
echo "</head>";
echo "<body>";
echo "<div class='container mt-4'>";

echo "<h2>📊 Table: <code>$table</code></h2>";

// Get table structure
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-info text-white'>🏗️ Table Structure</div>";
echo "<div class='card-body'>";

$structure_result = $conn->query("DESCRIBE `$table`");
if ($structure_result) {
    echo "<table class='table table-sm'>";
    echo "<thead><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th></tr></thead>";
    echo "<tbody>";
    
    while ($row = $structure_result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['Field'] . "</td>";
        echo "<td><code>" . $row['Type'] . "</code></td>";
        echo "<td>" . $row['Null'] . "</td>";
        echo "<td>" . $row['Key'] . "</td>";
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
}

echo "</div>";
echo "</div>";

// Get table data
echo "<div class='card'>";
echo "<div class='card-header bg-success text-white'>📋 Table Data (First 20 records)</div>";
echo "<div class='card-body'>";

$data_result = $conn->query("SELECT * FROM `$table` LIMIT 20");
if ($data_result) {
    // Get column names
    $fields = [];
    $structure_result = $conn->query("DESCRIBE `$table`");
    while ($row = $structure_result->fetch_assoc()) {
        $fields[] = $row['Field'];
    }
    
    echo "<div class='table-responsive'>";
    echo "<table class='table table-striped table-hover'>";
    echo "<thead><tr>";
    foreach ($fields as $field) {
        echo "<th>" . htmlspecialchars($field) . "</th>";
    }
    echo "</tr></thead>";
    echo "<tbody>";
    
    while ($row = $data_result->fetch_assoc()) {
        echo "<tr>";
        foreach ($fields as $field) {
            $value = $row[$field] ?? '';
            if (strlen($value) > 100) {
                $value = substr($value, 0, 100) . '...';
            }
            echo "<td>" . htmlspecialchars($value) . "</td>";
        }
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
    echo "</div>";
}

echo "</div>";
echo "</div>";

echo "<div class='mt-3'>";
echo "<a href='database_viewer.php' class='btn btn-primary'>← Back to Database Viewer</a>";
echo "</div>";

echo "</body>";
echo "</html>";
?>
