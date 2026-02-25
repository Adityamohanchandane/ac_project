<?php
// CORS: Allow same origin and localhost for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Allow localhost for development and the production domain
if ($origin && (preg_match('#^https?://localhost(:[0-9]+)?$#', $origin) || strpos($origin, 'https://observx.netlify.app') === 0)) {
  header("Access-Control-Allow-Origin: {$origin}");
  header('Access-Control-Allow-Credentials: true');
} else {
  header('Access-Control-Allow-Origin: *');
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
session_start();

$errors = [];
$email = '';
$isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $errors[] = 'Email and password are required.';
    } else {
        $police = find_police_by_email($email);
        if (!$police) {
            $errors[] = 'No police station found with that email.';
        } else {
            if (verify_police_password($email, $password)) {
                // login success
                $_SESSION['police'] = [
                    'id' => $police['id'],
                    'police_id' => $police['police_id'],
                    'email' => $police['email'],
                    'station_name' => $police['station_name'],
                    'role' => 'police'
                ];
                
                if ($isAjax) {
                    header('Content-Type: application/json');
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Login successful',
                        'police' => [
                            'id' => $police['id'],
                            'police_id' => $police['police_id'],
                            'email' => $police['email'],
                            'station_name' => $police['station_name'],
                            'role' => 'police'
                        ]
                    ]);
                    exit;
                } else {
                    header('Location: police-dashboard.php');
                    exit;
                }
            } else {
                $errors[] = 'Incorrect password.';
            }
        }
    }
    
    if ($isAjax && !empty($errors)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit;
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Police Login - ObservX</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #1a3a52 0%, #2d5a7b 100%);
      position: relative;
    }
    
    .login-card {
      position: relative;
      background: rgba(255, 255, 255, 0.95);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 450px;
      border: 2px solid #ffc107;
    }
    
    .login-card h3 {
      color: #1a3a52;
      margin-bottom: 1.5rem;
      text-align: center;
      font-weight: 600;
    }
    
    .badge-police {
      background-color: #ffc107;
      color: #1a3a52;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 1rem;
      font-weight: 600;
      text-align: center;
      width: 100%;
    }
    
    .form-label {
      font-weight: 500;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .form-control {
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.9);
    }
    
    .form-control:focus {
      border-color: #ffc107;
      box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
    }
    
    .btn-police {
      background: linear-gradient(135deg, #ffc107, #ffb300);
      color: #1a3a52;
      border: none;
      padding: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }
    
    .btn-police:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
      color: #1a3a52;
    }
    
    .alert {
      border: none;
      border-radius: 8px;
    }
    
    .text-center a {
      color: #ffc107;
      text-decoration: none;
      font-weight: 500;
    }
    
    .text-center a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      <div class="text-center mb-4">
        <div class="badge-police">
          <i class="bi bi-shield-lock me-2"></i>POLICE PORTAL
        </div>
        <h3>Police Admin Login</h3>
        <p class="text-muted small">Authorized personnel only</p>
      </div>
      
      <?php if (!empty($errors)): ?>
        <div class="alert alert-danger mb-4">
          <?php foreach ($errors as $e): ?>
            <div class="d-flex align-items-center">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <?= htmlspecialchars($e) ?>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <form method="post" action="police-login.php">
        <div class="mb-3">
          <label class="form-label">Police Email ID</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-envelope"></i></span>
            <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($email) ?>" required
                   placeholder="Enter your police email">
          </div>
        </div>
        
        <div class="mb-4">
          <label class="form-label">Password</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-lock"></i></span>
            <input type="password" name="password" class="form-control" required
                   placeholder="Enter your password">
          </div>
        </div>
        
        <button class="btn btn-police w-100 py-2">
          <i class="bi bi-shield-check me-2"></i>Login to Portal
        </button>
      </form>

      <div class="text-center mt-4 pt-3 border-top">
        <p class="text-muted small mb-0">For access issues, contact your administrator</p>
      </div>
    </div>
  </div>
</body>
</html>
