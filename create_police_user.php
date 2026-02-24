<?php
// Create a police user for testing
require_once __DIR__ . '/db.php';

// Check if police user already exists
$existingPolice = find_user_by_email('police@observx.com');

if ($existingPolice) {
    echo "✅ Police user already exists: police@observx.com\n";
    echo "📧 Email: police@observx.com\n";
    echo "🔑 Password: police123\n";
    echo "🛡️ Role: police\n";
} else {
    // Create police user
    $policeUser = add_user('police@observx.com', 'police123', 'police', [
        'full_name' => 'Police Admin',
        'mobile' => '9876543210',
        'address' => 'Police Station, Mumbai'
    ]);
    
    if ($policeUser) {
        echo "✅ Police user created successfully!\n";
        echo "📧 Email: police@observx.com\n";
        echo "🔑 Password: police123\n";
        echo "🛡️ Role: police\n";
        echo "👤 Name: Police Admin\n";
        echo "📱 Mobile: 9876543210\n";
    } else {
        echo "❌ Failed to create police user\n";
    }
}

// Also create a regular user for comparison
$existingUser = find_user_by_email('user@observx.com');

if (!$existingUser) {
    $regularUser = add_user('user@observx.com', 'user123', 'user', [
        'full_name' => 'Test User',
        'mobile' => '9876543211',
        'address' => 'Mumbai, Maharashtra'
    ]);
    
    if ($regularUser) {
        echo "\n✅ Regular user created for testing:\n";
        echo "📧 Email: user@observx.com\n";
        echo "🔑 Password: user123\n";
        echo "👤 Role: user\n";
    }
}

echo "\n🎯 Test Login URLs:\n";
echo "👮 Police Login: http://localhost:8080/police-login.php\n";
echo "👤 User Login: http://localhost:8080/login.php\n";

echo "\n💡 Use these credentials to test login functionality!";
?>
