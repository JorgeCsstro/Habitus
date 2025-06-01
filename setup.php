<?php
// setup.php - Create necessary directories and files for Habitus Zone

echo "<!DOCTYPE html>";
echo "<html><head><title>Habitus Zone Setup</title>";
echo "<style>body{font-family:Arial;padding:20px;} .ok{color:green;} .error{color:red;} .warning{color:orange;}</style>";
echo "</head><body>";

echo "<h1>🔧 Habitus Zone Setup</h1>";

// Directories to create
$directories = [
    'php/logs',
    'vendor',
    'uploads',
    'uploads/avatars',
    'uploads/items'
];

echo "<h2>Creating Directories</h2>";
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "<p class='ok'>✅ Created: $dir</p>";
        } else {
            echo "<p class='error'>❌ Failed to create: $dir</p>";
        }
    } else {
        echo "<p class='ok'>✅ Exists: $dir</p>";
    }
}

// Create .htaccess files for security
$htaccessFiles = [
    'php/logs/.htaccess' => "Deny from all\n",
    'uploads/.htaccess' => "Options -Indexes\n",
    'vendor/.htaccess' => "Deny from all\n"
];

echo "<h2>Creating Security Files</h2>";
foreach ($htaccessFiles as $file => $content) {
    if (!file_exists($file)) {
        if (file_put_contents($file, $content)) {
            echo "<p class='ok'>✅ Created: $file</p>";
        } else {
            echo "<p class='error'>❌ Failed to create: $file</p>";
        }
    } else {
        echo "<p class='ok'>✅ Exists: $file</p>";
    }
}

// Create .env.example if it doesn't exist
echo "<h2>Environment Configuration</h2>";
$envExample = '.env.example';
if (!file_exists($envExample)) {
    $envContent = '# Habitus Zone Environment Configuration
# Copy this file to .env and fill in your actual values

# Site Configuration
SITE_URL=https://habitus.zone
ADMIN_EMAIL=jorgecastrot2005@gmail.com
DEBUG_MODE=true

# Database Configuration
DB_HOST=localhost
DB_USER=u343618305_habit
DB_PASS=habit090402DJct.
DB_NAME=u343618305_habitus_zone

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_51RUWHJP82CUp8m3N275XjggSuOHD8BQfDUdtpID4zNNy6GeMIzb6xJvz7PMmOyU4QLd63utdrcxKVUuETrsMGU7i00V7mL8I4F
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_HrGC3Bqb1XlRRu9kiO4oRCeEZoJdZCGG
';
    
    if (file_put_contents($envExample, $envContent)) {
        echo "<p class='ok'>✅ Created: $envExample</p>";
    }
}

if (!file_exists('.env')) {
    echo "<p class='warning'>⚠️ .env file not found. Copy .env.example to .env and configure it.</p>";
} else {
    echo "<p class='ok'>✅ .env file exists</p>";
}

// Check composer
echo "<h2>Dependencies</h2>";
if (!file_exists('composer.json')) {
    $composerJson = '{
    "require": {
        "stripe/stripe-php": "^17.3",
        "vlucas/phpdotenv": "^5.6"
    }
}';
    file_put_contents('composer.json', $composerJson);
    echo "<p class='ok'>✅ Created composer.json</p>";
}

if (!file_exists('vendor/autoload.php')) {
    echo "<p class='warning'>⚠️ Composer dependencies not installed. Run: composer install</p>";
    echo "<pre style='background:#f0f0f0;padding:10px;'>composer install</pre>";
} else {
    echo "<p class='ok'>✅ Composer dependencies installed</p>";
}

// Create a simple index.html for directories that need it
$indexContent = '<!DOCTYPE html><html><head><title>Access Denied</title></head><body><h1>Access Denied</h1></body></html>';
$protectedDirs = ['php/logs', 'uploads'];

echo "<h2>Directory Protection</h2>";
foreach ($protectedDirs as $dir) {
    $indexFile = $dir . '/index.html';
    if (!file_exists($indexFile)) {
        file_put_contents($indexFile, $indexContent);
        echo "<p class='ok'>✅ Protected: $dir</p>";
    }
}

// Test database connection
echo "<h2>Database Test</h2>";
if (file_exists('.env')) {
    try {
        require_once 'vendor/autoload.php';
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
        
        $dbHost = $_ENV['DB_HOST'] ?? 'localhost';
        $dbUser = $_ENV['DB_USER'] ?? '';
        $dbPass = $_ENV['DB_PASS'] ?? '';
        $dbName = $_ENV['DB_NAME'] ?? '';
        
        if ($dbUser && $dbPass && $dbName) {
            $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
            echo "<p class='ok'>✅ Database connection successful</p>";
        } else {
            echo "<p class='warning'>⚠️ Database credentials not configured in .env</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Database connection failed: " . $e->getMessage() . "</p>";
    }
}

echo "<h2>Next Steps</h2>";
echo "<ol>";
echo "<li>Configure your .env file with database and Stripe credentials</li>";
echo "<li>Run 'composer install' to install dependencies</li>";
echo "<li>Import the database schema from php/database/setup.sql</li>";
echo "<li>Test your configuration with test-stripe.php</li>";
echo "<li>Test the payment endpoint with test-payment-endpoint.php</li>";
echo "</ol>";

echo "<p><em>Delete this file and test files in production!</em></p>";

echo "</body></html>";
?>