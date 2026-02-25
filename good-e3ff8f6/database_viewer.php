<?php
// Simple database viewer for XAMPP
require_once __DIR__ . '/db.php';

echo "<!DOCTYPE html>";
echo "<html>";
echo "<head>";
echo "<title>Database Viewer - ObservX</title>";
echo "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>";
echo "</head>";
echo "<body>";
echo "<div class='container mt-4'>";
echo "<h1>📊 Database Viewer - ObservX</h1>";
echo "<p class='lead'>XAMPP MySQL Database Status</p>";

// Show tables
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-primary text-white'>📋 Database Tables</div>";
echo "<div class='card-body'>";

$tables_result = $conn->query("SHOW TABLES");
if ($tables_result) {
    echo "<div class='table-responsive'>";
    echo "<table class='table table-striped'>";
    echo "<thead><tr><th>Table Name</th><th>Records</th><th>Action</th></tr></thead>";
    echo "<tbody>";
    
    while ($row = $tables_result->fetch_array()) {
        $table_name = $row[0];
        $count_result = $conn->query("SELECT COUNT(*) as count FROM `$table_name`");
        $count = $count_result ? $count_result->fetch_array()['count'] : 0;
        
        echo "<tr>";
        echo "<td><strong>$table_name</strong></td>";
        echo "<td><span class='badge bg-info'>$count</span></td>";
        echo "<td><button class='btn btn-sm btn-outline-primary' onclick='viewTable(\"$table_name\")'>View</button></td>";
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
    echo "</div>";
}

echo "</div>";
echo "</div>";

// Show users table details
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-success text-white'>👥 Users Table</div>";
echo "<div class='card-body'>";

$users_result = $conn->query("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
if ($users_result) {
    echo "<div class='table-responsive'>";
    echo "<table class='table table-striped table-hover'>";
    echo "<thead><tr><th>ID</th><th>Email</th><th>Full Name</th><th>Role</th><th>Created</th></tr></thead>";
    echo "<tbody>";
    
    while ($row = $users_result->fetch_assoc()) {
        echo "<tr>";
        echo "<td><code>" . substr($row['id'], 0, 8) . "...</code></td>";
        echo "<td>" . htmlspecialchars($row['email']) . "</td>";
        echo "<td>" . htmlspecialchars($row['full_name']) . "</td>";
        echo "<td><span class='badge bg-" . ($row['role'] === 'police' ? 'warning' : 'primary') . "'>" . $row['role'] . "</span></td>";
        echo "<td>" . $row['created_at'] . "</td>";
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
    echo "</div>";
}

echo "</div>";
echo "</div>";

echo "<script>
function viewTable(tableName) {
    window.open('view_table.php?table=' + tableName, '_blank');
}
</script>";

echo "</body>";
echo "</html>";
?>
