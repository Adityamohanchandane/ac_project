<?php
require_once 'db.php';

echo "<h2>Users in Database</h2>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>ID</th><th>Email</th><th>Full Name</th><th>Mobile</th><th>Address</th><th>Role</th><th>Created At</th></tr>";

$result = $conn->query("SELECT * FROM users ORDER BY created_at DESC");

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['id']) . "</td>";
        echo "<td>" . htmlspecialchars($row['email']) . "</td>";
        echo "<td>" . htmlspecialchars($row['full_name']) . "</td>";
        echo "<td>" . htmlspecialchars($row['mobile']) . "</td>";
        echo "<td>" . htmlspecialchars($row['address']) . "</td>";
        echo "<td>" . htmlspecialchars($row['role']) . "</td>";
        echo "<td>" . htmlspecialchars($row['created_at']) . "</td>";
        echo "</tr>";
    }
} else {
    echo "<tr><td colspan='7'>No users found in database</td></tr>";
}

echo "</table>";
echo "<br><br>";
echo "<a href='simple_register.php'>Go to Registration</a>";
?>
