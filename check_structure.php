<?php
require_once __DIR__ . '/db.php';

echo "<h2>Complaints Table Structure</h2>";

// Show structure
$structure = $conn->query("DESCRIBE complaints");
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
while ($row = $structure->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Default']) . "</td>";
    echo "</tr>";
}
echo "</table>";

// Show indexes
$indexes = $conn->query("SHOW INDEX FROM complaints");
echo "<h3>Indexes:</h3>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Table</th><th>Non_unique</th><th>Key_name</th><th>Column_name</th></tr>";
while ($row = $indexes->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . htmlspecialchars($row['Table']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Non_unique']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Key_name']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Column_name']) . "</td>";
    echo "</tr>";
}
echo "</table>";
?>
