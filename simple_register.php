<?php
require_once 'db.php';
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
        
        if ($user) {
            $success = 'Registration successful! <a href="login.php">Login here</a>';
        } else {
            $errors[] = 'Registration failed. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Register - Secure India</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .register-form {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 500px;
    }
  </style>
</head>
<body>
  <div class="register-form">
    <h2 class="text-center mb-4">Create Account</h2>
    
    <?php if (!empty($errors)): ?>
      <div class="alert alert-danger">
        <?php foreach ($errors as $error): ?>
          <div><?php echo htmlspecialchars($error); ?></div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
    
    <?php if ($success): ?>
      <div class="alert alert-success">
        <?php echo $success; ?>
      </div>
    <?php endif; ?>

    <form method="POST">
      <div class="mb-3">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control" name="fullName" required>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" name="email" required>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Mobile</label>
        <input type="tel" class="form-control" name="mobile" required>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Address</label>
        <textarea class="form-control" name="address" rows="2"></textarea>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" class="form-control" name="password" required>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Confirm Password</label>
        <input type="password" class="form-control" name="password2" required>
      </div>
      
      <button type="submit" class="btn btn-primary w-100">Register</button>
    </form>
    
    <p class="text-center mt-3">
      Already have an account? <a href="login.php">Login here</a>
    </p>
  </div>
</body>
</html>
