<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>phpMyAdmin - Database Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: #f1f3f4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .phpmyadmin-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .phpmyadmin-logo {
            font-size: 24px;
            font-weight: bold;
            color: white;
            text-decoration: none;
        }
        .sidebar {
            background: white;
            min-height: calc(100vh - 70px);
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
            padding: 20px 0;
        }
        .sidebar-item {
            padding: 12px 20px;
            color: #333;
            text-decoration: none;
            display: block;
            border-left: 3px solid transparent;
            transition: all 0.3s;
        }
        .sidebar-item:hover {
            background: #f8f9fa;
            border-left-color: #667eea;
            color: #667eea;
        }
        .sidebar-item.active {
            background: #e3f2fd;
            border-left-color: #2196f3;
            color: #2196f3;
        }
        .main-content {
            padding: 30px;
            background: white;
            min-height: calc(100vh - 70px);
            margin-left: 250px;
        }
        .database-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        .database-card:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        .table-list {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .table-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid #28a745;
        }
        .table-item:hover {
            background: #f1f3f4;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .btn-phpmyadmin {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s;
        }
        .btn-phpmyadmin:hover {
            background: #0056b3;
            color: white;
        }
        .breadcrumb-phpmyadmin {
            background: transparent;
            padding: 0;
            margin-bottom: 20px;
        }
        .breadcrumb-phpmyadmin .breadcrumb-item {
            color: #666;
        }
        .breadcrumb-phpmyadmin .breadcrumb-item.active {
            color: #333;
        }
        .version-info {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="phpmyadmin-header">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <a href="#" class="phpmyadmin-logo">
                        <i class="bi bi-database"></i> phpMyAdmin
                    </a>
                </div>
                <div class="col-md-6 text-end">
                    <span class="me-3">Server: localhost:8080</span>
                    <span>User: root@localhost</span>
                </div>
            </div>
        </div>
    </header>

    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 sidebar">
                <a href="#" class="sidebar-item active">
                    <i class="bi bi-house"></i> Home
                </a>
                <a href="#" class="sidebar-item">
                    <i class="bi bi-database"></i> Databases
                </a>
                <a href="#" class="sidebar-item">
                    <i class="bi bi-table"></i> Tables
                </a>
                <a href="#" class="sidebar-item">
                    <i class="bi bi-search"></i> SQL
                </a>
                <a href="#" class="sidebar-item">
                    <i class="bi bi-gear"></i> Settings
                </a>
                <a href="#" class="sidebar-item">
                    <i class="bi bi-question-circle"></i> Help
                </a>
            </div>

            <!-- Main Content -->
            <div class="col-md-9 main-content">
                <!-- Breadcrumb -->
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb breadcrumb-phpmyadmin">
                        <li class="breadcrumb-item"><a href="#">Home</a></li>
                        <li class="breadcrumb-item active">Database Overview</li>
                    </ol>
                </nav>

                <!-- Database Overview -->
                <div class="database-card">
                    <h3><i class="bi bi-database"></i> Database: exam</h3>
                    <p class="text-muted">MySQL database management system</p>
                    
                    <!-- Stats Grid -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">7</div>
                            <div class="stat-label">Tables</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">8</div>
                            <div class="stat-label">Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">1</div>
                            <div class="stat-label">Complaints</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">2.5MB</div>
                            <div class="stat-label">Size</div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-buttons">
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-plus-circle"></i> New Table
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-search"></i> Query
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-download"></i> Export
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-upload"></i> Import
                        </a>
                    </div>
                </div>

                <!-- Tables List -->
                <div class="table-list">
                    <h4><i class="bi bi-table"></i> Tables in database 'exam'</h4>
                    
                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-table"></i> users</strong>
                            <span class="text-muted ms-2">User authentication table</span>
                        </div>
                        <div>
                            <span class="badge bg-success">8 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-file-text"></i> complaints</strong>
                            <span class="text-muted ms-2">Complaint records</span>
                        </div>
                        <div>
                            <span class="badge bg-warning">1 row</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-shield-check"></i> police_users</strong>
                            <span class="text-muted ms-2">Police user accounts</span>
                        </div>
                        <div>
                            <span class="badge bg-info">0 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-file-earmark"></i> evidence_files</strong>
                            <span class="text-muted ms-2">Evidence file records</span>
                        </div>
                        <div>
                            <span class="badge bg-info">0 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-clock-history"></i> complaint_updates</strong>
                            <span class="text-muted ms-2">Complaint update history</span>
                        </div>
                        <div>
                            <span class="badge bg-info">0 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-person"></i> sonu</strong>
                            <span class="text-muted ms-2">Additional user table</span>
                        </div>
                        <div>
                            <span class="badge bg-info">0 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>

                    <div class="table-item">
                        <div>
                            <strong><i class="bi bi-clock"></i> user_sessions</strong>
                            <span class="text-muted ms-2">User session management</span>
                        </div>
                        <div>
                            <span class="badge bg-info">0 rows</span>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-2">
                                <i class="bi bi-eye"></i> Browse
                            </a>
                            <a href="#" class="btn-phpmyadmin btn-sm ms-1">
                                <i class="bi bi-pencil"></i> Edit
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="database-card">
                    <h4><i class="bi bi-lightning"></i> Quick Actions</h4>
                    <div class="action-buttons">
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-plus-circle"></i> Create Table
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-search"></i> Run SQL Query
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-download"></i> Export Database
                        </a>
                        <a href="#" class="btn-phpmyadmin">
                            <i class="bi bi-trash"></i> Empty Database
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Version Info -->
    <div class="version-info">
        phpMyAdmin 5.2.1 - MySQL 8.0.30
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Add interactivity
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Table browse functionality
        document.querySelectorAll('.table-item .btn-phpmyadmin').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const tableName = this.closest('.table-item').querySelector('strong').textContent;
                console.log('Browse table:', tableName);
                // Add table browsing functionality here
            });
        });
    </script>
</body>
</html>
