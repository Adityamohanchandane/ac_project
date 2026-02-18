<?php
require_once __DIR__ . '/db.php';
session_start();

$errors = [];
$email = '';
$fullName = '';
$mobile = '';
$address = '';
$isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';
  $password2 = $_POST['password2'] ?? '';
  $fullName = trim($_POST['fullName'] ?? '');
  $mobile = trim($_POST['mobile'] ?? '');
  $address = trim($_POST['address'] ?? '');

  if ($email === '' || $password === '' || $password2 === '') {
    $errors[] = 'All fields are required.';
  } elseif ($password !== $password2) {
    $errors[] = 'Passwords do not match.';
  } elseif (find_user_by_email($email)) {
    $errors[] = 'An account with that email already exists.';
  } else {
    $extra = [
      'full_name' => $fullName,
      'mobile' => $mobile,
      'address' => $address,
    ];
    $user = add_user($email, $password, 'user', $extra);
    
    if ($isAjax) {
      header('Content-Type: application/json');
      echo json_encode(['success' => true, 'message' => 'Registration successful']);
      exit;
    } else {
      header('Location: login.php');
      exit;
    }
  }
  
  if ($isAjax && !empty($errors)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: url('registration-hero.webp') no-repeat center center fixed;
      background-size: cover;
      position: relative;
    }
    
    .registration-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }

    .registration-box {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      padding: 2.5rem;
      width: 100%;
      max-width: 500px;
      position: relative;
      z-index: 2;
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
      color: #2c3e50;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .registration-header p {
      color: #7f8c8d;
      margin: 0;
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
      background: #3498db;
      border: none;
      padding: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .btn-register:hover {
      background: #2980b9;
      transform: translateY(-2px);
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
