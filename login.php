<?php
// CORS: Allow same origin and localhost for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
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
$isAjax = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) ||
           (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
           (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $errors[] = 'Email and password are required.';
    } else {
        $user = find_user_by_email($email);
        if (!$user) {
            $errors[] = 'No account found with that email.';
        } else {
            if (verify_password($password, $user['password'])) {
                // login success
                $_SESSION['user'] = [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user'
                ];
                
                if ($isAjax) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'message' => 'Login successful']);
                    exit;
                } else {
                    header('Location: dashboard.php');
                    exit;
                }
            } else {
                $errors[] = 'Incorrect password.';
            }
        }
    }
    
    if (!empty($errors)) {
        $isAjax = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) ||
                 (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
                 (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);
                 
        if ($isAjax) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
            exit;
        }
    }
}

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login - ObservX</title>
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
      background: url('https://d3lzcn6mbbadaf.cloudfront.net/media/details/ANI-20241214151801.jpg') no-repeat center center fixed;
      background-size: cover;
      -webkit-background-size: cover;
      -moz-background-size: cover;
      -o-background-size: cover;
      position: relative;
    }
    
    .login-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 0;
    }
    
    .login-card {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.95);
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 450px;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .login-card h3 {
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      text-align: center;
      font-weight: 600;
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
      transition: all 0.3s ease;
      background-color: rgba(255, 255, 255, 0.9);
    }
    
    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
    }
    
    .btn-primary {
      padding: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      background: linear-gradient(135deg, #0d6efd, #0b5ed7);
      border: none;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .alert {
      border: none;
      border-radius: 8px;
    }
    
    .alert-danger {
      background-color: #f8d7da;
      color: #842029;
    }
    
    .text-center a {
      color: #0d6efd;
      text-decoration: none;
      font-weight: 500;
    }
    
    .text-center a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 576px) {
      .login-card {
        padding: 2rem 1.5rem;
        margin: 1rem;
      }
      
      .login-container {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      <div class="text-center mb-4">
        <img src="https://img.freepik.com/premium-vector/eye-logo-vector-design_9999-14585.jpg" 
             alt="ObservX" style="height: 60px; margin-bottom: 1rem;">
           <h3>ObservX Portal</h3>
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

      <form method="post" action="login.php">
        <div class="mb-3">
          <label class="form-label">Email Address</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-envelope"></i></span>
            <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($email) ?>" required
                   placeholder="Enter your email address">
          </div>
        </div>
        
        <div class="mb-4">
          <div class="d-flex justify-content-between">
            <label class="form-label">Password</label>
            <a href="#" class="small text-muted text-decoration-none">Forgot password?</a>
          </div>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-lock"></i></span>
            <input type="password" name="password" class="form-control" required
                   placeholder="Enter your password">
          </div>
        </div>
        
        <button class="btn btn-primary w-100 py-2">
          <i class="bi bi-box-arrow-in-right me-2"></i>Login to Account
        </button>
      </form>

      <div class="text-center mt-4">
        <p class="mb-0 text-muted">Don't have an account? 
          <a href="register.php" class="fw-semibold text-decoration-none">
            Create an account
          </a>
        </p>
      </div>
      
      <div class="d-flex justify-content-center mt-4 pt-3 border-top">
        <a href="#" class="btn btn-outline-secondary btn-sm me-2">
          <i class="bi bi-google"></i>
        </a>
        <a href="#" class="btn btn-outline-primary btn-sm me-2">
          <i class="bi bi-facebook"></i>
        </a>
        <a href="#" class="btn btn-outline-info btn-sm">
          <i class="bi bi-twitter-x"></i>
        </a>
      </div>
    </div>
  </div>
</body>
</html>