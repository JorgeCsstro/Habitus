<?php
// test-stripe.php - Simple test to verify Stripe configuration
// Place this in your root directory and visit it in your browser

require_once 'php/include/config.php';

// Set content type
header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>";
echo "<html><head><title>Stripe Configuration Test</title>";
echo "<style>body{font-family:Arial;padding:20px;} .ok{color:green;} .error{color:red;} .warning{color:orange;}</style>";
echo "</head><body>";

echo "<h1>🧪 Habitus Zone - Stripe Configuration Test</h1>";

// Test 1: Check if .env file exists
echo "<h2>1. Environment File Check</h2>";
if (file_exists('.env')) {
    echo "<p class='ok'>✅ .env file found</p>";
} else {
    echo "<p class='error'>❌ .env file not found. Please create one from .env.example</p>";
}

// Test 2: Check Stripe keys
echo "<h2>2. Stripe Configuration</h2>";

if (defined('STRIPE_PUBLISHABLE_KEY') && !empty(STRIPE_PUBLISHABLE_KEY)) {
    $pk = STRIPE_PUBLISHABLE_KEY;
    if (strpos($pk, 'pk_test_') === 0) {
        echo "<p class='ok'>✅ Stripe Publishable Key (TEST): " . substr($pk, 0, 20) . "...</p>";
    } elseif (strpos($pk, 'pk_live_') === 0) {
        echo "<p class='warning'>⚠️ Stripe Publishable Key (LIVE): " . substr($pk, 0, 20) . "...</p>";
    } else {
        echo "<p class='error'>❌ Invalid Stripe Publishable Key format</p>";
    }
} else {
    echo "<p class='error'>❌ Stripe Publishable Key not set</p>";
}

if (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY)) {
    $sk = STRIPE_SECRET_KEY;
    if (strpos($sk, 'sk_test_') === 0) {
        echo "<p class='ok'>✅ Stripe Secret Key (TEST): " . substr($sk, 0, 20) . "...</p>";
    } elseif (strpos($sk, 'sk_live_') === 0) {
        echo "<p class='warning'>⚠️ Stripe Secret Key (LIVE): " . substr($sk, 0, 20) . "...</p>";
    } else {
        echo "<p class='error'>❌ Invalid Stripe Secret Key format</p>";
    }
} else {
    echo "<p class='error'>❌ Stripe Secret Key not set</p>";
}

// Test 3: Check Composer autoload
echo "<h2>3. Dependencies Check</h2>";
if (file_exists('vendor/autoload.php')) {
    echo "<p class='ok'>✅ Composer autoload found</p>";
    
    // Try to load Stripe
    try {
        require_once 'vendor/autoload.php';
        
        if (class_exists('\Stripe\Stripe')) {
            echo "<p class='ok'>✅ Stripe PHP library loaded</p>";
            
            // Test Stripe API connection (if keys are available)
            if (!empty(STRIPE_SECRET_KEY)) {
                try {
                    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
                    $account = \Stripe\Account::retrieve();
                    echo "<p class='ok'>✅ Stripe API connection successful</p>";
                    echo "<p>Account ID: " . $account->id . "</p>";
                } catch (Exception $e) {
                    echo "<p class='error'>❌ Stripe API connection failed: " . $e->getMessage() . "</p>";
                }
            }
        } else {
            echo "<p class='error'>❌ Stripe PHP library not found</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error loading dependencies: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p class='error'>❌ Composer autoload not found. Run: composer install</p>";
}

// Test 4: Database connection
echo "<h2>4. Database Connection</h2>";
try {
    require_once 'php/include/db_connect.php';
    echo "<p class='ok'>✅ Database connection successful</p>";
} catch (Exception $e) {
    echo "<p class='error'>❌ Database connection failed: " . $e->getMessage() . "</p>";
}

// Test 5: Check required tables
echo "<h2>5. Database Tables Check</h2>";
if (isset($conn)) {
    $requiredTables = ['users', 'subscription_plans', 'transactions', 'shop_items'];
    foreach ($requiredTables as $table) {
        try {
            $stmt = $conn->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "<p class='ok'>✅ Table '$table' exists</p>";
            } else {
                echo "<p class='error'>❌ Table '$table' missing</p>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error checking table '$table': " . $e->getMessage() . "</p>";
        }
    }
}

echo "<h2>6. Next Steps</h2>";
echo "<ol>";
echo "<li>If any tests failed, fix the issues above</li>";
echo "<li>Make sure your .env file has correct Stripe keys</li>";
echo "<li>Run 'composer install' if dependencies are missing</li>";
echo "<li>Import the database schema if tables are missing</li>";
echo "<li>Test the subscription page once everything is green ✅</li>";
echo "</ol>";

echo "<p><strong>Debug Mode:</strong> " . (DEBUG_MODE ? 'ON' : 'OFF') . "</p>";
echo "<p><em>Delete this file in production!</em></p>";

echo "</body></html>";
?>