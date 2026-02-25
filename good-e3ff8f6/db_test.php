<?php
// Direct database connection test
echo "<!DOCTYPE html>";
echo "<html>";
echo "<head>";
echo "<title>Database Connection Test</title>";
echo "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>";
echo "</head>";
echo "<body>";
echo "<div class='container mt-4'>";

echo "<h1>🔍 Database Connection Test</h1>";

// Test 1: Basic connection
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-primary text-white'>Test 1: MySQL Connection</div>";
echo "<div class='card-body'>";

try {
    $conn = new mysqli("localhost", "root", "", "exam");
    if ($conn->connect_error) {
        echo "<div class='alert alert-danger'>❌ Connection Failed: " . $conn->connect_error . "</div>";
    } else {
        echo "<div class='alert alert-success'>✅ Connected Successfully!</div>";
        echo "<p><strong>Host:</strong> localhost</p>";
        echo "<p><strong>User:</strong> root</p>";
        echo "<p><strong>Database:</strong> exam</p>";
        echo "<p><strong>MySQL Version:</strong> " . $conn->server_info . "</p>";
    }
    $conn->close();
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>❌ Error: " . $e->getMessage() . "</div>";
}

echo "</div>";
echo "</div>";

// Test 2: List databases
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-info text-white'>Test 2: Available Databases</div>";
echo "<div class='card-body'>";

try {
    $conn = new mysqli("localhost", "root", "");
    $result = $conn->query("SHOW DATABASES");
    
    if ($result) {
        echo "<div class='table-responsive'>";
        echo "<table class='table table-striped'>";
        echo "<thead><tr><th>Database Name</th></tr></thead>";
        echo "<tbody>";
        
        while ($row = $result->fetch_array()) {
            $db_name = $row[0];
            echo "<tr>";
            echo "<td><strong>" . htmlspecialchars($db_name) . "</strong></td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
        echo "</div>";
    }
    $conn->close();
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>❌ Error: " . $e->getMessage() . "</div>";
}

echo "</div>";
echo "</div>";

// Test 3: Exam database tables
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-success text-white'>Test 3: EXAM Database Tables</div>";
echo "<div class='card-body'>";

try {
    $conn = new mysqli("localhost", "root", "", "exam");
    $result = $conn->query("SHOW TABLES");
    
    if ($result) {
        echo "<div class='table-responsive'>";
        echo "<table class='table table-striped'>";
        echo "<thead><tr><th>Table Name</th><th>Records</th></tr></thead>";
        echo "<tbody>";
        
        while ($row = $result->fetch_array()) {
            $table_name = $row[0];
            $count_result = $conn->query("SELECT COUNT(*) as count FROM `$table_name`");
            $count = $count_result ? $count_result->fetch_array()['count'] : 0;
            
            echo "<tr>";
            echo "<td><strong>" . htmlspecialchars($table_name) . "</strong></td>";
            echo "<td><span class='badge bg-info'>$count</span></td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
        echo "</div>";
    }
    $conn->close();
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>❌ Error: " . $e->getMessage() . "</div>";
}

echo "</div>";
echo "</div>";

// Test 4: Users data
echo "<div class='card mb-4'>";
echo "<div class='card-header bg-warning text-white'>Test 4: Users Table Data</div>";
echo "<div class='card-body'>";

try {
    $conn = new mysqli("localhost", "root", "", "exam");
    $result = $conn->query("SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    
    if ($result) {
        echo "<div class='table-responsive'>";
        echo "<table class='table table-striped table-hover'>";
        echo "<thead><tr><th>ID</th><th>Email</th><th>Full Name</th><th>Created</th></tr></thead>";
        echo "<tbody>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td><code>" . substr($row['id'], 0, 8) . "...</code></td>";
            echo "<td>" . htmlspecialchars($row['email']) . "</td>";
            echo "<td>" . htmlspecialchars($row['full_name']) . "</td>";
            echo "<td>" . $row['created_at'] . "</td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
        echo "</div>";
    }
    $conn->close();
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>❌ Error: " . $e->getMessage() . "</div>";
}

echo "</div>";
echo "</div>";

echo "<div class='alert alert-info'>";
echo "<h5>🔧 Troubleshooting Tips:</h5>";
echo "<ul>";
echo "<li>If connection fails, check if MySQL is running in XAMPP Control Panel</li>";
echo "<li>Make sure MySQL service is started</li>";
echo "<li>Verify database name: <code>exam</code></li>";
echo "<li>Check user credentials: root@localhost (no password)</li>";
echo "</ul>";
echo "</div>";

echo "</body>";
echo "</html>";
?>
