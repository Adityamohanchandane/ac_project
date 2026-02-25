<?php
// Enable output buffering and error handling for JSON responses
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS: Allow same origin and localhost for development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://localhost(:[0-9]+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_HOST']);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Log every request arrival (minimal, no output)
@file_put_contents(__DIR__ . '/debug.log', "[" . date('Y-m-d H:i:s') . "] REQUEST: " . ($_SERVER['REQUEST_METHOD'] ?? '-') . " " . ($_SERVER['REQUEST_URI'] ?? '-') . " AJAX=" . (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false ? '1' : '0') . PHP_EOL, FILE_APPEND | LOCK_EX);

require_once __DIR__ . '/db.php';
session_start();


// Simple debug logger (appends to debug.log). Safe for local debugging.
function write_debug_log($msg) {
  $file = __DIR__ . '/debug.log';
  $time = date('Y-m-d H:i:s');
  // Mask newlines in message to keep single-line entries
  $entry = "[{$time}] " . str_replace("\n", " ", $msg) . PHP_EOL;
  @file_put_contents($file, $entry, FILE_APPEND | LOCK_EX);
}

$errors = [];
$email = '';
$fullName = '';
$mobile = '';
$address = '';
$isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

  $email = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';
  $password2 = $_POST['password2'] ?? '';
  $fullName = trim($_POST['fullName'] ?? '');
  $mobile = trim($_POST['mobile'] ?? '');
  $address = trim($_POST['address'] ?? '');

  try {
    if ($email === '' || $password === '' || $password2 === '' || $fullName === '' || $mobile === '') {
      $errors[] = 'All fields are required.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $errors[] = 'Please enter a valid email address.';
    } elseif (strlen($password) < 8) {
      $errors[] = 'Password must be at least 8 characters long.';
    } elseif ($password !== $password2) {
      $errors[] = 'Passwords do not match.';
    } elseif (!preg_match('/^[0-9]{10}$/', $mobile)) {
      $errors[] = 'Please enter a valid 10-digit mobile number.';
    } elseif (strlen($fullName) < 3) {
      $errors[] = 'Full name must be at least 3 characters long.';
    } elseif (find_user_by_email($email)) {
      $errors[] = 'An account with that email already exists.';
    } else {
      $extra = [
        'full_name' => $fullName,
        'mobile' => $mobile,
        'address' => $address,
      ];
      $user = add_user($email, $password, 'user', $extra);

      if ($user) {
        if ($isAjax) {
          send_json_response(true, 'Registration successful!');
        } else {
          header('Location: login.php');
          exit;
        }
      } else {
        $errors[] = 'Registration failed. Please try again.';
      }
    }

    if (!empty($errors)) {
      if ($isAjax) {
        $errMsg = implode(' ', $errors);
        write_debug_log("Registration error for email={$email}: {$errMsg}");
        send_json_response(false, $errMsg);
      }
    }
  } catch (Exception $e) {
    if ($isAjax) {
      write_debug_log('Exception during registration for email=' . ($email ?? '') . ': ' . $e->getMessage() . ' TRACE: ' . $e->getTraceAsString());
      send_json_response(false, 'Server error: ' . $e->getMessage());
    } else {
      $errors[] = 'Server error occurred. Please try again.';
      write_debug_log('Non-AJAX exception during registration: ' . $e->getMessage());
    }
  }
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
    body, html {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .registration-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .registration-box {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      padding: 2.5rem;
      width: 100%;
      max-width: 500px;
    }

    .registration-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .registration-header img {
      height: 80px;
      margin-bottom: 1rem;
    }

    .registration-header h2 {
      color: #1e3c72;
      font-weight: 700;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }

    .registration-header p {
      color: #6c757d;
      margin: 0;
      font-size: 1.1rem;
    }

    .form-label {
      font-weight: 500;
      color: #2c3e50;
    }

    .form-control {
      border-radius: 8px;
      border: 1px solid #ddd;
      padding: 0.75rem 1rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #3498db;
      box-shadow: 0 0 0 0.25rem rgba(52, 152, 219, 0.25);
    }

    .btn-register {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border: none;
      padding: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      color: white;
      transition: all 0.3s ease;
    }

    .btn-register:hover {
      background: linear-gradient(135deg, #162a48 0%, #1f3d6b 100%);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(30, 60, 114, 0.3);
    }

    .login-link {
      text-align: center;
      margin-top: 1.5rem;
    }

    .alert {
      border-radius: 8px;
    }

    @media (max-width: 576px) {
      .registration-box {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="registration-container">
    <div class="registration-box">
      <div class="registration-header">
        <img src="https://img.freepik.com/premium-vector/eye-logo-vector-design_9999-14585.jpg" alt="ObservX">
        <h2>Create Account</h2>
        <p>Join our community today</p>
      </div>

      <?php if (!empty($errors)): ?>
        <div class="alert alert-danger">
          <?php foreach ($errors as $error): ?>
            <div class="d-flex align-items-center mb-2">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <?php echo htmlspecialchars($error); ?>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <form method="POST" action="register.php">
        <div class="mb-3">
          <label for="fullName" class="form-label">Full Name</label>
          <input type="text" class="form-control" id="fullName" name="fullName" value="<?php echo htmlspecialchars($fullName); ?>" placeholder="Enter your name" required>
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Email Address</label>
          <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" placeholder="Enter your email" required>
        </div>

        <div class="mb-3">
          <label for="mobile" class="form-label">Mobile Number</label>
          <input type="tel" class="form-control" id="mobile" name="mobile" value="<?php echo htmlspecialchars($mobile); ?>" placeholder="Enter your mobile" required>
        </div>

        <div class="mb-3">
          <label for="address" class="form-label">Address</label>
          <textarea class="form-control" id="address" name="address" rows="2" placeholder="Enter your address"><?php echo htmlspecialchars($address); ?></textarea>
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" name="password" placeholder="Create a password" required>
        </div>

        <div class="mb-4">
          <label for="password2" class="form-label">Confirm Password</label>
          <input type="password" class="form-control" id="password2" name="password2" placeholder="Confirm password" required>
        </div>

        <button type="submit" class="btn btn-primary btn-register w-100 py-2">
          Register
        </button>

        <div class="login-link">
          Already have an account? <a href="login.php">Sign in</a>
        </div>
      </form>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
