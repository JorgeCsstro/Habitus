<?php
// test_stripe.php - Create this in your project root directory
// This file will help you test if Stripe is configured correctly

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Habitus Zone - Stripe Configuration Test</h1>";
echo "<style>body { font-family: Arial, sans-serif; margin: 40px; }</style>";

// Test 1: Check if config file exists and loads
echo "<h2>✅ Test 1: Configuration</h2>";
if (file_exists('php/include/config.php')) {
    echo "✅ Config file found<br>";
    require_once 'php/include/config.php';
    echo "✅ Config file loaded successfully<br>";
} else {
    echo "❌ Config file not found at php/include/config.php<br>";
    exit;
}

// Test 2: Check environment variables
echo "<h2>✅ Test 2: Environment Variables</h2>";
echo "Debug Mode: " . (defined('DEBUG_MODE') ? (DEBUG_MODE ? 'ON' : 'OFF') : 'NOT SET') . "<br>";
echo "Site URL: " . (defined('SITE_URL') ? SITE_URL : 'NOT SET') . "<br>";
echo "Stripe Publishable Key: " . (defined('STRIPE_PUBLISHABLE_KEY') && !empty(STRIPE_PUBLISHABLE_KEY) ? 'SET (' . substr(STRIPE_PUBLISHABLE_KEY, 0, 12) . '...)' : 'NOT SET') . "<br>";
echo "Stripe Secret Key: " . (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY) ? 'SET (' . substr(STRIPE_SECRET_KEY, 0, 12) . '...)' : 'NOT SET') . "<br>";

// Test 3: Check .env file
echo "<h2>✅ Test 3: .env File</h2>";
if (file_exists('.env')) {
    echo "✅ .env file found<br>";
    $envContent = file_get_contents('.env');
    if (strpos($envContent, 'STRIPE_PUBLISHABLE_KEY') !== false) {
        echo "✅ .env contains Stripe keys<br>";
    } else {
        echo "❌ .env file doesn't contain Stripe keys<br>";
    }
} else {
    echo "❌ .env file not found<br>";
    echo "<strong>Action needed:</strong> Create a .env file in your project root<br>";
}

// Test 4: Check Composer dependencies
echo "<h2>✅ Test 4: Composer Dependencies</h2>";
if (file_exists('vendor/autoload.php')) {
    echo "✅ Composer autoload found<br>";
    require_once 'vendor/autoload.php';
    
    if (class_exists('\Stripe\Stripe')) {
        echo "✅ Stripe PHP library loaded<br>";
    } else {
        echo "❌ Stripe PHP library not found<br>";
    }
} else {
    echo "❌ Composer autoload not found<br>";
    echo "<strong>Action needed:</strong> Run 'composer install' in your project root<br>";
}

// Test 5: Test Stripe API connection
echo "<h2>✅ Test 5: Stripe API Connection</h2>";
if (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY) && class_exists('\Stripe\Stripe')) {
    try {
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        $account = \Stripe\Account::retrieve();
        echo "✅ Stripe API connection successful<br>";
        echo "Account ID: " . $account->id . "<br>";
        echo "Account Country: " . $account->country . "<br>";
        echo "Account Type: " . $account->type . "<br>";
        
        // Test creating a basic product (safe test)
        try {
            $testCustomer = \Stripe\Customer::create([
                'email' => 'test@example.com',
                'name' => 'Test Customer',
                'metadata' => ['test' => 'true']
            ]);
            echo "✅ Can create Stripe objects (Customer created: " . $testCustomer->id . ")<br>";
            
            // Clean up - delete the test customer
            $testCustomer->delete();
            echo "✅ Test customer cleaned up<br>";
            
        } catch (Exception $e) {
            echo "⚠️ Can connect but cannot create objects: " . $e->getMessage() . "<br>";
        }
        
    } catch (\Stripe\Exception\AuthenticationException $e) {
        echo "❌ Stripe authentication failed: " . $e->getMessage() . "<br>";
        echo "<strong>Check your secret key in .env file</strong><br>";
    } catch (Exception $e) {
        echo "❌ Stripe API error: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ Cannot test - missing secret key or Stripe library<br>";
}

// Test 6: Check database connection
echo "<h2>✅ Test 6: Database Connection</h2>";
if (file_exists('php/include/db_connect.php')) {
    try {
        require_once 'php/include/db_connect.php';
        echo "✅ Database connection successful<br>";
        
        // Test if required tables exist
        $requiredTables = ['users', 'subscription_plans', 'transactions'];
        foreach ($requiredTables as $table) {
            $stmt = $conn->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            if ($stmt->rowCount() > 0) {
                echo "✅ Table '$table' exists<br>";
            } else {
                echo "❌ Table '$table' missing<br>";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ Database connection file not found<br>";
}

// Test 7: Check required directories
echo "<h2>✅ Test 7: Required Directories</h2>";
$requiredDirs = ['php/logs', 'vendor', 'images'];
foreach ($requiredDirs as $dir) {
    if (is_dir($dir)) {
        echo "✅ Directory '$dir' exists<br>";
        if (is_writable($dir)) {
            echo "✅ Directory '$dir' is writable<br>";
        } else {
            echo "⚠️ Directory '$dir' is not writable<br>";
        }
    } else {
        echo "❌ Directory '$dir' missing<br>";
        if ($dir === 'php/logs') {
            echo "<strong>Action needed:</strong> Create directory: mkdir -p php/logs && chmod 755 php/logs<br>";
        }
    }
}

// Show summary
echo "<h2>🎯 Summary</h2>";
$allGood = defined('STRIPE_PUBLISHABLE_KEY') && 
           !empty(STRIPE_PUBLISHABLE_KEY) && 
           defined('STRIPE_SECRET_KEY') && 
           !empty(STRIPE_SECRET_KEY) && 
           file_exists('vendor/autoload.php') && 
           class_exists('\Stripe\Stripe');

if ($allGood) {
    echo "<div style='background: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;'>";
    echo "<strong>🎉 Configuration looks good!</strong><br>";
    echo "Your Stripe integration should work. If you're still having issues, check the browser console for JavaScript errors.";
    echo "</div>";
} else {
    echo "<div style='background: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px;'>";
    echo "<strong>❌ Configuration issues found</strong><br>";
    echo "Please fix the issues marked with ❌ above before testing the payment form.";
    echo "</div>";
}

echo "<br><a href='pages/subscription.php'>← Back to Subscription Page</a>";
?>