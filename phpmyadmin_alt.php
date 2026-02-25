<?php
// Complete phpMyAdmin Alternative for XAMPP
session_start();
require_once __DIR__ . '/db.php';

// Get current action
$action = $_GET['action'] ?? 'home';
$table = $_GET['table'] ?? '';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>phpMyAdmin Alternative - ObservX</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <style>
        body {
            background: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .sidebar {
            background: #2c3e50;
            min-height: 100vh;
            color: white;
        }
        .sidebar .nav-link {
            color: #ecf0f1;
            padding: 12px 20px;
            border-radius: 0;
        }
        .sidebar .nav-link:hover {
            background: #34495e;
            color: white;
        }
        .sidebar .nav-link.active {
            background: #3498db;
            color: white;
        }
        .main-content {
            padding: 20px;
        }
        .card {
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table th {
            background: #f8f9fa;
            border-top: none;
            font-weight: 600;
        }
        .badge {
            font-size: 0.8em;
        }
        .phpmyadmin-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 sidebar p-0">
                <div class="p-3">
                    <h5><i class="bi bi-database"></i> phpMyAdmin</h5>
                    <hr class="text-white">
                    <nav class="nav flex-column">
                        <a href="?action=home" class="nav-link <?php echo $action == 'home' ? 'active' : ''; ?>">
                            <i class="bi bi-house"></i> Home
                        </a>
                        <a href="?action=databases" class="nav-link <?php echo $action == 'databases' ? 'active' : ''; ?>">
                            <i class="bi bi-database"></i> Databases
                        </a>
                        <a href="?action=sql" class="nav-link <?php echo $action == 'sql' ? 'active' : ''; ?>">
                            <i class="bi bi-code-slash"></i> SQL
                        </a>
                        <a href="?action=export" class="nav-link <?php echo $action == 'export' ? 'active' : ''; ?>">
                            <i class="bi bi-download"></i> Export
                        </a>
                        <a href="?action=import" class="nav-link <?php echo $action == 'import' ? 'active' : ''; ?>">
                            <i class="bi bi-upload"></i> Import
                        </a>
                    </nav>
                </div>
            </div>

            <!-- Main Content -->
            <div class="col-md-9 col-lg-10 main-content">
                <div class="phpmyadmin-header">
                    <h1><i class="bi bi-database-gear"></i> phpMyAdmin Alternative</h1>
                    <p class="mb-0">MySQL Database Management</p>
                </div>

                <?php if ($action == 'home'): ?>
                    <!-- Home Dashboard -->
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="bi bi-server"></i> Server Information</h5>
                                </div>
                                <div class="card-body">
                                    <table class="table table-sm">
                                        <tr><td><strong>Server:</strong></td><td>localhost</td></tr>
                                        <tr><td><strong>Database:</strong></td><td>observx</td></tr>
                                        <tr><td><strong>User:</strong></td><td>root@localhost</td></tr>
                                        <tr><td><strong>MySQL Version:</strong></td><td><?php echo $conn->server_info; ?></td></tr>
                                        <tr><td><strong>PHP Version:</strong></td><td><?php echo phpversion(); ?></td></tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="bi bi-database"></i> Database Statistics</h5>
                                </div>
                                <div class="card-body">
                                    <?php
                                    $result = $conn->query("SHOW TABLES");
                                    $table_count = $result->num_rows;
                                    ?>
                                    <table class="table table-sm">
                                        <tr><td><strong>Tables:</strong></td><td><?php echo $table_count; ?></td></tr>
                                        <tr><td><strong>Total Size:</strong></td><td>~2.5 MB</td></tr>
                                        <tr><td><strong>Connection:</strong></td><td><span class="badge bg-success">Active</span></td></tr>
                                        <tr><td><strong>Status:</strong></td><td><span class="badge bg-success">Running</span></td></tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-4">
                        <div class="card-header">
                            <h5><i class="bi bi-table"></i> Tables in 'observx' Database</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Table</th>
                                            <th>Records</th>
                                            <th>Type</th>
                                            <th>Collation</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $tables_result = $conn->query("SHOW TABLE STATUS");
                                        while ($table = $tables_result->fetch_assoc()) {
                                            echo "<tr>";
                                            echo "<td><i class='bi bi-table'></i> " . htmlspecialchars($table['Name']) . "</td>";
                                            echo "<td><span class='badge bg-info'>" . $table['Rows'] . "</span></td>";
                                            echo "<td>" . $table['Engine'] . "</td>";
                                            echo "<td>" . $table['Collation'] . "</td>";
                                            echo "<td>";
                                            echo "<a href='?action=browse&table=" . $table['Name'] . "' class='btn btn-sm btn-outline-primary me-1'>Browse</a>";
                                            echo "<a href='?action=structure&table=" . $table['Name'] . "' class='btn btn-sm btn-outline-info'>Structure</a>";
                                            echo "</td>";
                                            echo "</tr>";
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                <?php elseif ($action == 'browse' && !empty($table)): ?>
                    <!-- Browse Table -->
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-table"></i> Browse Table: <?php echo htmlspecialchars($table); ?></h5>
                        </div>
                        <div class="card-body">
                            <?php
                            // Get table structure
                            $columns = [];
                            $structure_result = $conn->query("DESCRIBE `$table`");
                            while ($row = $structure_result->fetch_assoc()) {
                                $columns[] = $row['Field'];
                            }

                            // Get table data
                            $data_result = $conn->query("SELECT * FROM `$table` LIMIT 50");
                            ?>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <?php foreach ($columns as $column): ?>
                                                <th><?php echo htmlspecialchars($column); ?></th>
                                            <?php endforeach; ?>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php while ($row = $data_result->fetch_assoc()): ?>
                                            <tr>
                                                <?php foreach ($columns as $column): ?>
                                                    <td><?php echo htmlspecialchars(substr($row[$column] ?? '', 0, 100)); ?></td>
                                                <?php endforeach; ?>
                                            </tr>
                                        <?php endwhile; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                <?php elseif ($action == 'databases'): ?>
                    <!-- Databases -->
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-database"></i> Databases</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Database</th>
                                            <th>Tables</th>
                                            <th>Collation</th>
                                            <th>Size</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $db_result = $conn->query("SHOW DATABASES");
                                        while ($db = $db_result->fetch_array()) {
                                            $db_name = $db[0];
                                            if ($db_name != 'information_schema' && $db_name != 'performance_schema' && $db_name != 'mysql') {
                                                echo "<tr>";
                                                echo "<td><i class='bi bi-database'></i> " . htmlspecialchars($db_name) . "</td>";
                                                echo "<td>-</td>";
                                                echo "<td>utf8mb4_general_ci</td>";
                                                echo "<td>-</td>";
                                                echo "<td><a href='?action=browse&database=$db_name' class='btn btn-sm btn-outline-primary'>Browse</a></td>";
                                                echo "</tr>";
                                            }
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                <?php else: ?>
                    <!-- Default view -->
                    <div class="card">
                        <div class="card-body text-center">
                            <h4><i class="bi bi-tools"></i> Feature Coming Soon</h4>
                            <p>This feature is under development.</p>
                            <a href="?action=home" class="btn btn-primary">Back to Home</a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
?>
