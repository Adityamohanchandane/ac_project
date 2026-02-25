<?php
// CORS headers for Vite app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
session_start();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';
    $fullName = trim($_POST['fullName'] ?? '');
    $mobile = trim($_POST['mobile'] ?? '');
    $address = trim($_POST['address'] ?? '');

    // Basic validation
    if ($email === '' || $password === '' || $password2 === '') {
        $errors[] = 'All fields are required.';
    } elseif ($password !== $password2) {
        $errors[] = 'Passwords do not match.';
    } elseif (strlen($password) < 6) {
        $errors[] = 'Password must be at least 6 characters.';
    } else {
        // Check if user exists
        $existingUser = find_user_by_email($email);
        if ($existingUser) {
            $errors[] = 'An account with that email already exists.';
        } else {
            // Register new user
            $extra = [
                'full_name' => $fullName,
                'mobile' => $mobile,
                'address' => $address,
            ];
            $user = add_user($email, $password, 'user', $extra);
            
            if ($user) {
                // Check if AJAX request (multiple ways)
                $isAjax = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) ||
                         (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
                         (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);
                
                if ($isAjax) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'message' => 'Registration successful!']);
                    exit;
                } else {
                    $success = 'Registration successful! <a href="login.php">Login here</a>';
                }
            } else {
                $errors[] = 'Registration failed. Please try again.';
            }
        }
        
        // Return JSON response for AJAX requests
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
    
    // Rest of the code remains the same
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Register - ObservX</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .register-form {
      background: white;
      padding: 2.5rem;
      border-radius: 15px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .register-form h2 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 2rem;
      font-weight: 700;
    }
    .form-label {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    .form-control {
      border: 2px solid #e1e8ed;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      transition: all 0.3s ease;
    }
    .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
    .btn-register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 0.875rem;
      font-weight: 600;
      border-radius: 10px;
      color: white;
      transition: all 0.3s ease;
      width: 100%;
    }
    .btn-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
    .alert {
      border-radius: 10px;
      border: none;
      padding: 1rem;
    }
    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #6c757d;
    }
    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .login-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="register-form">
    <h2><i class="bi bi-person-plus-fill"></i> Create Account</h2>
    
    <?php if (!empty($errors)): ?>
      <div class="alert alert-danger">
        <?php foreach ($errors as $error): ?>
          <div><i class="bi bi-exclamation-triangle-fill me-2"></i><?php echo htmlspecialchars($error); ?></div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
    
    <?php if ($success): ?>
      <div class="alert alert-success">
        <i class="bi bi-check-circle-fill me-2"></i><?php echo $success; ?>
      </div>
    <?php endif; ?>

    <form method="POST" id="registerForm">
      <div class="mb-3">
        <label for="fullName" class="form-label">Full Name</label>
        <input type="text" class="form-control" id="fullName" name="fullName" 
               value="<?php echo htmlspecialchars($fullName ?? ''); ?>" 
               placeholder="Enter your full name" required>
      </div>
      
      <div class="mb-3">
        <label for="email" class="form-label">Email Address</label>
        <input type="email" class="form-control" id="email" name="email" 
               value="<?php echo htmlspecialchars($email ?? ''); ?>" 
               placeholder="Enter your email" required>
      </div>
      
      <div class="mb-3">
        <label for="mobile" class="form-label">Mobile Number</label>
        <input type="tel" class="form-control" id="mobile" name="mobile" 
               value="<?php echo htmlspecialchars($mobile ?? ''); ?>" 
               placeholder="Enter your mobile number" required>
      </div>
      
      <div class="mb-3">
        <label for="address" class="form-label">Address</label>
        <textarea class="form-control" id="address" name="address" rows="3" 
                  placeholder="Enter your address"><?php echo htmlspecialchars($address ?? ''); ?></textarea>
      </div>
      
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" name="password" 
               placeholder="Create a password (min 6 characters)" required>
      </div>
      
      <div class="mb-4">
        <label for="password2" class="form-label">Confirm Password</label>
        <input type="password" class="form-control" id="password2" name="password2" 
               placeholder="Confirm your password" required>
      </div>
      
      <button type="submit" class="btn btn-primary btn-register">
        <i class="bi bi-person-plus me-2"></i>Register Account
      </button>
    </form>
    
    <div class="login-link">
      Already have an account? <a href="login.php">Sign in here</a>
    </div>
  </div>
</body>
</html>
