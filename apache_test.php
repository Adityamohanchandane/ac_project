<?php
echo "<h1>🚀 XAMPP Apache Test</h1>";
echo "<p>✅ Apache is working!</p>";
echo "<p>📅 Time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>🔧 PHP Version: " . phpversion() . "</p>";
echo "<p>📁 Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p>🌐 Server Name: " . $_SERVER['SERVER_NAME'] . "</p>";
echo "<p>📍 Current File: " . __FILE__ . "</p>";

// Test database connection
echo "<h2>🗄️ Database Test</h2>";
try {
    $conn = new mysqli("localhost", "root", "", "exam");
    if ($conn->connect_error) {
        echo "<p>❌ Database Error: " . $conn->connect_error . "</p>";
    } else {
        echo "<p>✅ Database Connected!</p>";
        $result = $conn->query("SHOW TABLES");
        echo "<p>📊 Tables in 'exam' database: " . $result->num_rows . "</p>";
    }
    $conn->close();
} catch (Exception $e) {
    echo "<p>❌ Exception: " . $e->getMessage() . "</p>";
}

echo "<h2>📋 Available Files</h2>";
$files = glob(__DIR__ . '/*.php');
foreach ($files as $file) {
    $filename = basename($file);
    echo "<p>📄 <a href='$filename'>$filename</a></p>";
}
?>
