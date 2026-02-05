<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
$user = $_SESSION['user'];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard - ObservX</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm">
          <div class="card-body">
            <h3 class="card-title">Welcome, <?= htmlspecialchars($user['email']) ?></h3>
            <p>Role: <?= htmlspecialchars($user['role']) ?></p>
            <a href="logout.php" class="btn btn-secondary">Logout</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>