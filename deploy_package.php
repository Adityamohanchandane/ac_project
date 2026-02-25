<?php
/**
 * ObservX Deployment Package Creator
 * Creates a clean deployment package with only necessary files
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>📦 Creating Deployment Package</h1>";
echo "<style>body { font-family: Arial, sans-serif; margin: 20px; } .success { color: green; } .error { color: red; } .file-list { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }</style>";

// Files to include in deployment
$deployment_files = [
    'index.html' => 'Main Application',
    'main.js' => 'JavaScript Application',
    'style.css' => 'Stylesheet',
    'register.php' => 'Registration Handler',
    'login.php' => 'Login Handler',
    'police-login.php' => 'Police Login',
    'check_auth.php' => 'Authentication Check',
    'file_complaint.php' => 'Complaint Submission',
    'get_complaints.php' => 'Get Complaints API',
    'get_complaint.php' => 'Single Complaint API',
    'db.php' => 'Database Functions',
    'db_schema.sql' => 'Database Schema',
    '.htaccess' => 'Apache Configuration',
    'package.json' => 'Node Dependencies',
    'README.md' => 'Documentation',
    'config.php' => 'Configuration File'
];

// Directories to include
$deployment_dirs = [
    'uploads/' => 'File Upload Directory',
    'dist/' => 'Built Assets'
];

echo "<h2>📋 Deployment Package Contents</h2>";

echo "<div class='file-list'>";
echo "<h3>📄 Core Files:</h3>";
foreach ($deployment_files as $file => $description) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "<p class='success'>✅ $file - $description</p>";
    } else {
        echo "<p class='error'>❌ $file - $description (MISSING)</p>";
    }
}

echo "<h3>📁 Directories:</h3>";
foreach ($deployment_dirs as $dir => $description) {
    if (is_dir(__DIR__ . '/' . $dir)) {
        echo "<p class='success'>✅ $dir - $description</p>";
    } else {
        echo "<p class='error'>❌ $dir - $description (MISSING)</p>";
    }
}
echo "</div>";

// Create deployment package
echo "<h2>🚀 Creating Deployment Package</h2>";

$package_name = 'observx_deployment_' . date('Y-m-d_H-i-s');
$package_dir = __DIR__ . '/' . $package_name;

if (!is_dir($package_dir)) {
    mkdir($package_dir, 0755, true);
    echo "<p class='success'>✅ Created package directory: $package_name</p>";
} else {
    echo "<p class='error'>❌ Package directory already exists</p>";
}

// Copy files
foreach ($deployment_files as $file => $description) {
    $source = __DIR__ . '/' . $file;
    $dest = $package_dir . '/' . $file;
    
    if (file_exists($source)) {
        if (copy($source, $dest)) {
            echo "<p class='success'>✅ Copied: $file</p>";
        } else {
            echo "<p class='error'>❌ Failed to copy: $file</p>";
        }
    }
}

// Create uploads directory in package
$uploads_dir = $package_dir . '/uploads';
if (!is_dir($uploads_dir)) {
    mkdir($uploads_dir, 0755, true);
    echo "<p class='success'>✅ Created uploads directory in package</p>";
}

// Create deployment instructions
$instructions = "# ObservX Deployment Package\n\n";
$instructions .= "Created: " . date('Y-m-d H:i:s') . "\n\n";
$instructions .= "## Quick Deployment Steps:\n\n";
$instructions .= "1. Upload all files to your web server\n";
$instructions .= "2. Create MySQL database named 'observx'\n";
$instructions .= "3. Import db_schema.sql into database\n";
$instructions .= "4. Update database credentials in db.php (lines 49-55)\n";
$instructions .= "5. Set uploads/ directory permissions to 755\n";
$instructions .= "6. Visit your domain to test\n\n";
$instructions .= "## Default Login:\n";
$instructions .= "Police: police@observx.gov / Police@123\n\n";
$instructions .= "## Files Included:\n";
foreach ($deployment_files as $file => $desc) {
    $instructions .= "- $file: $desc\n";
}

file_put_contents($package_dir . '/DEPLOYMENT_INSTRUCTIONS.txt', $instructions);
echo "<p class='success'>✅ Created deployment instructions</p>";

// Create zip package
if (class_exists('ZipArchive')) {
    $zip_file = __DIR__ . '/' . $package_name . '.zip';
    $zip = new ZipArchive();
    
    if ($zip->open($zip_file, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($package_dir),
            RecursiveIteratorIterator::LEAVES_ONLY
        );
        
        foreach ($files as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = substr($filePath, strlen($package_dir) + 1);
                $zip->addFile($filePath, $relativePath);
            }
        }
        
        $zip->close();
        echo "<p class='success'>✅ Created deployment package: $package_name.zip</p>";
        echo "<p><strong>Package size:</strong> " . number_format(filesize($zip_file) / 1024 / 1024, 2) . " MB</p>";
    } else {
        echo "<p class='error'>❌ Failed to create zip file</p>";
    }
} else {
    echo "<p class='error'>❌ ZipArchive class not available</p>";
}

echo "<h2>🎯 Next Steps</h2>";
echo "<ol>";
echo "<li>Download the deployment package: <strong>$package_name.zip</strong></li>";
echo "<li>Upload to your hosting server</li>";
echo "<li>Follow DEPLOYMENT_INSTRUCTIONS.txt</li>";
echo "<li>Test the application</li>";
echo "</ol>";

echo "<p><a href='index.html'>← Back to Application</a></p>";
?>
