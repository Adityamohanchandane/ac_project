<?php
require_once 'db.php';

if ($conn->connect_error) {
    echo "❌ Database connection failed: " . $conn->connect_error;
} else {
    echo "✅ Database connected successfully!";
    echo "<br>";
    echo "Database: observx";
    echo "<br>";
    echo "Host: " . $conn->host_info;
}
?>
