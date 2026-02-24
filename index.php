<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔧 Page Not Found Fix</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px 5px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
        }
        .btn-success { background: #28a745; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-danger { background: #dc3545; }
        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔧 Page Not Found - DIAGNOSIS & FIX</h1>
        
        <div class="alert alert-info">
            <strong>📊 Current Status:</strong><br>
            • PHP Server: Running on port 8080 ✅<br>
            • Current Page: <code><?php echo $_SERVER['REQUEST_URI']; ?></code><br>
            • Server Time: <?php echo date('Y-m-d H:i:s'); ?>
        </div>

        <h2>🔍 Test These URLs:</h2>
        
        <div class="alert alert-success">
            <h3>✅ Working URLs:</h3>
            <p><a href="http://localhost:8080/" class="btn btn-success">Home (This Page)</a></p>
            <p><a href="http://localhost:8080/register.php" class="btn btn-success">Registration</a></p>
            <p><a href="http://localhost:8080/login.php" class="btn btn-success">Login</a></p>
            <p><a href="http://localhost:8080/phpmyadmin_alt.php" class="btn btn-success">Database Admin</a></p>
        </div>

        <h2>🚨 Common Issues & Fixes:</h2>
        
        <div class="alert alert-danger">
            <h3>❌ Issue 1: Wrong Port</h3>
            <p><strong>Problem:</strong> Using port 80 instead of 8080</p>
            <p><strong>Fix:</strong> Always use <code>http://localhost:8080/</code></p>
            <p><a href="http://localhost:8080/" class="btn btn-warning">Try Correct Port</a></p>
        </div>

        <div class="alert alert-danger">
            <h3>❌ Issue 2: Wrong File Name</h3>
            <p><strong>Problem:</strong> File doesn't exist</p>
            <p><strong>Fix:</strong> Check available files below</p>
        </div>

        <h2>📁 Available Files:</h2>
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
            <?php
            $files = glob('*.php');
            $files = array_merge($files, glob('*.html'));
            sort($files);
            foreach ($files as $file) {
                echo "<p><a href='$file' class='btn'>$file</a></p>";
            }
            ?>
        </div>

        <h2>🔧 Quick Fixes:</h2>
        
        <div class="alert alert-info">
            <h3>💡 Solution 1: Use Working URLs</h3>
            <p>Always use these URLs:</p>
            <ul>
                <li><strong>Registration:</strong> <code>http://localhost:8080/register.php</code></li>
                <li><strong>Login:</strong> <code>http://localhost:8080/login.php</code></li>
                <li><strong>Complaints:</strong> <code>http://localhost:8080/file_complaint.php</code></li>
                <li><strong>Database:</strong> <code>http://localhost:8080/phpmyadmin_alt.php</code></li>
            </ul>
        </div>

        <div class="alert alert-info">
            <h3>💡 Solution 2: Clear Browser Cache</h3>
            <p>Press <strong>Ctrl+Shift+Delete</strong> and clear cache</p>
            <p>Then restart browser</p>
        </div>

        <div class="alert alert-info">
            <h3>💡 Solution 3: Check Server Status</h3>
            <p>PHP Server should be running on port 8080</p>
            <p>Check terminal for server status</p>
        </div>

        <h2>🎯 Test Steps:</h2>
        <ol>
            <li>Click "Home" button above</li>
            <li>Try registration page</li>
            <li>Try login page</li>
            <li>Try database admin</li>
            <li>If any page shows "not found", tell me which one</li>
        </ol>

        <div class="alert alert-success">
            <h3>✅ If All Working:</h3>
            <p>Use these URLs for your application:</p>
            <p><a href="http://localhost:5173" class="btn btn-success">Main Frontend</a></p>
            <p><a href="http://localhost:8080/index_local.html" class="btn btn-success">Local App</a></p>
        </div>

        <h2>🔍 Debug Info:</h2>
        <pre>
Current URL: <?php echo $_SERVER['REQUEST_URI']; ?>
Server Port: <?php echo $_SERVER['SERVER_PORT']; ?>
Request Method: <?php echo $_SERVER['REQUEST_METHOD']; ?>
HTTP Host: <?php echo $_SERVER['HTTP_HOST']; ?>
        </pre>
    </div>
</body>
</html>
