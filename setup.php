<?php
// setup.php - Run this script to set up required directories and check configuration

echo "<h1>Habitus Zone - Setup Script</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 10px; max-width: 800px; }
    .success { color: #28a745; }
    .error { color: #dc3545; }
    .warning { color: #ffc107; }
    .info { color: #17a2b8; }
    pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
</style>";

echo "<div class='container'>";

echo "<h2>🔧 Setting up Habitus Zone...</h2>";

// Create required directories
$directories = [
    'php/logs',
    'uploads',
    'uploads/profiles',
    'vendor'
];

echo "<h3>📁 Creating Required Directories</h3>";
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "<span class='success'>✅ Created: $dir</span><br>";
        } else {
            echo "<span class='error'>❌ Failed to create: $dir</span><br>";
        }
    } else {
        echo "<span class='info'>ℹ️ Already exists: $dir</span><br>";
    }
    
    // Check if writable
    if (is_writable($dir)) {
        echo "<span class='success'>✅ Writable: $dir</span><br>";
    } else {
        echo "<span class='error'>❌ Not writable: $dir (fix with: chmod 755 $dir)</span><br>";
    }
}

echo "<h3>🔍 Checking Configuration Files</h3>";

// Check .env file
if (file_exists('.env')) {
    echo "<span class='success'>✅ .env file exists</span><br>";
    
    $envContent = file_get_contents('.env');
    $requiredKeys = ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
    
    foreach ($requiredKeys as $key) {
        if (strpos($envContent, $key) !== false) {
            echo "<span class='success'>✅ $key found in .env</span><br>";
        } else {
            echo "<span class='error'>❌ $key missing in .env</span><br>";
        }
    }
} else {
    echo "<span class='error'>❌ .env file missing</span><br>";
    echo "<span class='info'>ℹ️ Copy .env.example to .env and configure it</span><br>";
}

// Check composer
if (file_exists('composer.json')) {
    echo "<span class='success'>✅ composer.json exists</span><br>";
    
    if (file_exists('vendor/autoload.php')) {
        echo "<span class='success'>✅ Composer dependencies installed</span><br>";
    } else {
        echo "<span class='error'>❌ Composer dependencies not installed</span><br>";
        echo "<span class='info'>ℹ️ Run: composer install</span><br>";
    }
} else {
    echo "<span class='error'>❌ composer.json missing</span><br>";
}

// Check logs
echo "<h3>📋 Recent Stripe Logs</h3>";
$logFiles = ['php/logs/stripe_debug.log', 'php/logs/stripe_errors.log'];

foreach ($logFiles as $logFile) {
    if (file_exists($logFile)) {
        echo "<h4>$logFile</h4>";
        $content = file_get_contents($logFile);
        if (!empty($content)) {
            $lines = explode("\n", $content);
            $recentLines = array_slice($lines, -10); // Last 10 lines
            echo "<pre>" . htmlspecialchars(implode("\n", $recentLines)) . "</pre>";
        } else {
            echo "<span class='info'>ℹ️ Log file is empty</span><br>";
        }
    } else {
        echo "<span class='info'>ℹ️ $logFile doesn't exist yet</span><br>";
    }
}

// Test file permissions
echo "<h3>🔐 Testing File Permissions</h3>";
$testFile = 'php/logs/test_write.txt';
if (file_put_contents($testFile, 'test') !== false) {
    echo "<span class='success'>✅ Can write to php/logs/</span><br>";
    unlink($testFile);
} else {
    echo "<span class='error'>❌ Cannot write to php/logs/</span><br>";
    echo "<span class='info'>ℹ️ Fix with: chmod 755 php/logs</span><br>";
}

// Show system info
echo "<h3>💻 System Information</h3>";
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "<br>";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "<br>";
echo "Current Directory: " . getcwd() . "<br>";

// Extension check
$requiredExtensions = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring'];
echo "<h4>Required PHP Extensions</h4>";
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<span class='success'>✅ $ext</span><br>";
    } else {
        echo "<span class='error'>❌ $ext (install php-$ext)</span><br>";
    }
}

echo "<h3>🎯 Quick Actions</h3>";
echo "<a href='debug-stripe.php' style='margin-right: 10px; padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;'>🔧 Test Stripe Config</a>";
echo "<a href='pages/subscription.php' style='margin-right: 10px; padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;'>💳 Test Subscription</a>";
echo "<a href='index.php' style='padding: 10px 15px; background: #6f42c1; color: white; text-decoration: none; border-radius: 5px;'>🏠 Go to Site</a>";

echo "</div>";
?>