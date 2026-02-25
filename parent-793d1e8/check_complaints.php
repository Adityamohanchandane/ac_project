<?php
require_once __DIR__ . '/db.php';

echo "<h2>Complaints Table Structure</h2>";

// Check if complaints table exists
$result = $conn->query("SHOW TABLES LIKE 'complaints'");
if ($result->num_rows > 0) {
    echo "<p>✅ Complaints table exists</p>";
    
    // Show structure
    $structure = $conn->query("DESCRIBE complaints");
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th></tr>";
    while ($row = $structure->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Show data
    $data = $conn->query("SELECT * FROM complaints LIMIT 5");
    if ($data->num_rows > 0) {
        echo "<h3>Recent Complaints:</h3>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Created</th></tr>";
        while ($row = $data->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($row['id']) . "</td>";
            echo "<td>" . htmlspecialchars($row['title']) . "</td>";
            echo "<td>" . htmlspecialchars($row['category']) . "</td>";
            echo "<td>" . htmlspecialchars($row['status']) . "</td>";
            echo "<td>" . htmlspecialchars($row['created_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No complaints found in database</p>";
    }
} else {
    echo "<p>❌ Complaints table does not exist</p>";
}
?>
