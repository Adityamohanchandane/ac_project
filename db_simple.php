<?php
// Simple database configuration for local development
class Database {
    private $host = 'localhost';
    private $username = 'root';
    private $password = '';
    private $database = 'observx_secure';
    private $conn;
    
    public function __construct() {
        $this->connect();
    }
    
    private function connect() {
        try {
            // Create database if it doesn't exist
            $conn = new mysqli($this->host, $this->username, $this->password);
            if ($conn->connect_error) {
                throw new Exception("Connection failed: " . $conn->connect_error);
            }
            
            // Create database
            $conn->query("CREATE DATABASE IF NOT EXISTS {$this->database}");
            $conn->close();
            
            // Connect to database
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->database);
            
            if ($this->conn->connect_error) {
                throw new Exception("Database connection failed: " . $this->conn->connect_error);
            }
            
            // Create tables if they don't exist
            $this->createTables();
            
        } catch (Exception $e) {
            // Fallback to SQLite if MySQL fails
            $this->connectSQLite();
        }
    }
    
    private function connectSQLite() {
        try {
            $this->conn = new PDO('sqlite:observx_secure.db');
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTablesSQLite();
        } catch (Exception $e) {
            // Final fallback to file-based storage
            $this->initFileStorage();
        }
    }
    
    private function createTables() {
        // Users table
        $this->conn->query("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                role ENUM('user', 'police', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Complaints table
        $this->conn->query("
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                incident_date DATE,
                location VARCHAR(255),
                status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Emergency complaints table
        $this->conn->query("
            CREATE TABLE IF NOT EXISTS emergency_complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                emergency_type VARCHAR(100) NOT NULL,
                urgency_level ENUM('low', 'medium', 'high') NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                photo_location VARCHAR(255),
                contact_number VARCHAR(20),
                emergency_name VARCHAR(255),
                status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Insert demo users
        $this->insertDemoUsers();
    }
    
    private function createTablesSQLite() {
        // Users table
        $this->conn->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Complaints table
        $this->conn->exec("
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                incident_date TEXT,
                location TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Emergency complaints table
        $this->conn->exec("
            CREATE TABLE IF NOT EXISTS emergency_complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                emergency_type TEXT NOT NULL,
                urgency_level TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                photo_location TEXT,
                contact_number TEXT,
                emergency_name TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        $this->insertDemoUsersSQLite();
    }
    
    private function initFileStorage() {
        // Create data directory if it doesn't exist
        if (!file_exists('data')) {
            mkdir('data', 0777, true);
        }
        
        // Initialize users file
        if (!file_exists('data/users.json')) {
            $demoUsers = [
                [
                    'id' => 1,
                    'email' => 'user@observx.com',
                    'password' => password_hash('user123', PASSWORD_DEFAULT),
                    'full_name' => 'Demo User',
                    'phone' => '1234567890',
                    'address' => 'Demo Address',
                    'role' => 'user',
                    'created_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 2,
                    'email' => 'police@observx.com',
                    'password' => password_hash('police123', PASSWORD_DEFAULT),
                    'full_name' => 'Demo Police',
                    'phone' => '0987654321',
                    'address' => 'Police Station',
                    'role' => 'police',
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ];
            file_put_contents('data/users.json', json_encode($demoUsers, JSON_PRETTY_PRINT));
        }
        
        // Initialize complaints file
        if (!file_exists('data/complaints.json')) {
            file_put_contents('data/complaints.json', json_encode([], JSON_PRETTY_PRINT));
        }
        
        // Initialize emergency complaints file
        if (!file_exists('data/emergency_complaints.json')) {
            file_put_contents('data/emergency_complaints.json', json_encode([], JSON_PRETTY_PRINT));
        }
    }
    
    private function insertDemoUsers() {
        // Check if demo users exist
        $result = $this->conn->query("SELECT COUNT(*) as count FROM users WHERE email IN ('user@observx.com', 'police@observx.com')");
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            // Insert demo user
            $this->conn->query("
                INSERT INTO users (email, password, full_name, phone, address, role) 
                VALUES ('user@observx.com', '" . password_hash('user123', PASSWORD_DEFAULT) . "', 'Demo User', '1234567890', 'Demo Address', 'user')
            ");
            
            // Insert demo police
            $this->conn->query("
                INSERT INTO users (email, password, full_name, phone, address, role) 
                VALUES ('police@observx.com', '" . password_hash('police123', PASSWORD_DEFAULT) . "', 'Demo Police', '0987654321', 'Police Station', 'police')
            ");
        }
    }
    
    private function insertDemoUsersSQLite() {
        // Check if demo users exist
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM users WHERE email IN ('user@observx.com', 'police@observx.com')");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row['count'] == 0) {
            // Insert demo user
            $stmt = $this->conn->prepare("
                INSERT INTO users (email, password, full_name, phone, address, role) 
                VALUES ('user@observx.com', ?, 'Demo User', '1234567890', 'Demo Address', 'user')
            ");
            $stmt->execute([password_hash('user123', PASSWORD_DEFAULT)]);
            
            // Insert demo police
            $stmt = $this->conn->prepare("
                INSERT INTO users (email, password, full_name, phone, address, role) 
                VALUES ('police@observx.com', ?, 'Demo Police', '0987654321', 'Police Station', 'police')
            ");
            $stmt->execute([password_hash('police123', PASSWORD_DEFAULT)]);
        }
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function query($sql, $params = []) {
        try {
            if ($this->conn instanceof mysqli) {
                $stmt = $this->conn->prepare($sql);
                if ($stmt === false) {
                    throw new Exception("Prepare failed: " . $this->conn->error);
                }
                
                if (!empty($params)) {
                    $types = str_repeat('s', count($params));
                    $stmt->bind_param($types, ...$params);
                }
                
                $stmt->execute();
                return $stmt;
            } elseif ($this->conn instanceof PDO) {
                $stmt = $this->conn->prepare($sql);
                $stmt->execute($params);
                return $stmt;
            }
        } catch (Exception $e) {
            return $this->fallbackToFile($sql, $params);
        }
    }
    
    private function fallbackToFile($sql, $params = []) {
        // Simple file-based fallback for basic operations
        if (strpos($sql, 'SELECT') !== false) {
            if (strpos($sql, 'users') !== false) {
                $users = json_decode(file_get_contents('data/users.json'), true);
                return $users;
            }
        }
        return null;
    }
}

// Global database instance
$db = null;

function getDB() {
    global $db;
    if ($db === null) {
        $db = new Database();
    }
    return $db;
}

// Helper function to send JSON response
function sendJsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
?>
