<?php
require_once __DIR__ . '/db.php';
session_start();

$errors = [];
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';
  $password2 = $_POST['password2'] ?? '';
  $fullName = trim($_POST['fullName'] ?? '') ;
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

    // If request expects JSON (AJAX), return JSON response
    $acceptsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
    $isXhr = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    if ($acceptsJson || $isXhr) {
      header('Content-Type: application/json');
      echo json_encode(['success' => true, 'message' => 'Registration successful', 'user' => $user]);
      exit;
    }

    header('Location: login.php');
    exit;
  }
}

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Register - Secure India</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h3 class="card-title mb-3">Register</h3>
            <?php if (!empty($errors)): ?>
              <div class="alert alert-danger">
                <?php foreach ($errors as $e) echo "<div>" . htmlspecialchars($e) . "</div>"; ?>
              </div>
            <?php endif; ?>

            <form method="post" action="register.php">
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($email) ?>" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Confirm Password</label>
                <input type="password" name="password2" class="form-control" required>
              </div>
              <div class="d-grid">
                <button class="btn btn-primary">Register</button>
              </div>
            </form>

            <hr>
            <p class="small">Already have an account? <a href="login.php">Login here</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>