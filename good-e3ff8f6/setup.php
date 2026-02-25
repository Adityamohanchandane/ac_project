<?php
/**
 * Database Setup and Initialization Script
 * Use this to verify and set up your database
 */

echo "=== ObservX Database Setup ===\n\n";

// Check if users.json exists and is readable
$usersFile = __DIR__ . '/users.json';

if (!file_exists($usersFile)) {
    echo "❌ users.json not found!\n";
} else {
    echo "✅ users.json exists\n";
    
    // Load and display users
    $users = json_decode(file_get_contents($usersFile), true);
    echo "   Users count: " . count($users) . "\n";
    
    if (count($users) > 0) {
        echo "\n📋 Current Users:\n";
        foreach ($users as $user) {
            echo "   - Email: {$user['email']}, Role: {$user['role']}\n";
        }
    }
}

// Check PHP version
echo "\n✅ PHP Version: " . phpversion() . "\n";

// Check required extensions
$extensions = ['json', 'session'];
echo "\n📦 Required Extensions:\n";
foreach ($extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "   ✅ $ext\n";
    } else {
        echo "   ❌ $ext (MISSING)\n";
    }
}

// Check for MySQL extension (optional)
echo "\n🔧 Optional Extensions:\n";
$optionalExts = ['mysqli', 'pdo_mysql'];
foreach ($optionalExts as $ext) {
    if (extension_loaded($ext)) {
        echo "   ✅ $ext\n";
    } else {
        echo "   ⚠️  $ext (not available, using JSON fallback)\n";
    }
}

// Test MySQL connection if configured
echo "\n🗄️  Database Connection Test:\n";
$host = "localhost";
$user = "root";
$pass = "";
$db = "exam";

if (extension_loaded('mysqli')) {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        echo "   ⚠️  MySQL: Connection failed - {$conn->connect_error}\n";
        echo "   💡 Using JSON fallback instead\n";
    } else {
        echo "   ✅ MySQL: Connected to '$db' database\n";
        
        // Check if required tables exist
        $result = $conn->query("SHOW TABLES");
        $tables = [];
        while ($row = $result->fetch_row()) {
            $tables[] = $row[0];
        }
        
        if (count($tables) > 0) {
            echo "   📊 Tables found: " . implode(", ", $tables) . "\n";
        } else {
            echo "   ⚠️  No tables found in database\n";
        }
        
        $conn->close();
    }
} else {
    echo "   ℹ️  MySQLi not available, using JSON file storage\n";
}

echo "\n✅ Setup verification complete!\n";
echo "\n📚 To get started:\n";
echo "   1. Visit: http://localhost/ac_project/login.php\n";
echo "   2. Test login with: test@example.com / password123\n";
echo "   3. Or register a new account\n";
echo "\n";
?>
