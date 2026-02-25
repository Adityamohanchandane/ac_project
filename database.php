<?php
// Database configuration
$host = "localhost";
$user = "root";
$pass = "";
$db   = "observx";

// Create connection with MySQLi
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Collect form data safely
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $conn->real_escape_string($_POST['cname']);
    $email = $conn->real_escape_string($_POST['cemail']);
    $message = $conn->real_escape_string($_POST['cmessage']);

    // Insert into DB using prepared statements (more secure)
    $sql = "INSERT INTO sonu (name, email, message) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $name, $email, $message);

    if ($stmt->execute()) {
        echo "Message sent successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }
    
    $stmt->close();
}

$conn->close();
?>
