<?php
// debug-stripe.php - Create this file in your project root to test Stripe configuration

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Habitus Zone - Stripe Configuration Debug</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 10px; max-width: 800px; }
    .test { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
    .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; }
    h2 { color: #333; }
</style>";

echo "<div class='container'>";

// Test 1: Check config file
echo "<h2>🔧 Test 1: Configuration Files</h2>";
if (file_exists('php/include/config.php')) {
    echo "<div class='test success'>✅ Config file found</div>";
    require_once 'php/include/config.php';
    echo "<div class='test success'>✅ Config file loaded successfully</div>";
} else {
    echo "<div class='test error'>❌ Config file not found at php/include/config.php</div>";
    exit;
}

// Test 2: Check .env file
echo "<h2>🔧 Test 2: Environment Configuration</h2>";
if (file_exists('.env')) {
    echo "<div class='test success'>✅ .env file found</div>";
    $envContent = file_get_contents('.env');
    if (strpos($envContent, 'STRIPE_PUBLISHABLE_KEY') !== false) {
        echo "<div class='test success'>✅ .env contains Stripe publishable key</div>";
    } else {
        echo "<div class='test error'>❌ .env missing STRIPE_PUBLISHABLE_KEY</div>";
    }
    if (strpos($envContent, 'STRIPE_SECRET_KEY') !== false) {
        echo "<div class='test success'>✅ .env contains Stripe secret key</div>";
    } else {
        echo "<div class='test error'>❌ .env missing STRIPE_SECRET_KEY</div>";
    }
} else {
    echo "<div class='test error'>❌ .env file not found</div>";
    echo "<div class='test info'>📝 Create a .env file with your Stripe keys:<br>";
    echo "<div class='code'>STRIPE_PUBLISHABLE_KEY=pk_test_...<br>STRIPE_SECRET_KEY=sk_test_...</div></div>";
}

// Test 3: Check environment variables
echo "<h2>🔧 Test 3: Environment Variables</h2>";
$pubKey = defined('STRIPE_PUBLISHABLE_KEY') ? STRIPE_PUBLISHABLE_KEY : '';
$secKey = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';

if (!empty($pubKey)) {
    echo "<div class='test success'>✅ STRIPE_PUBLISHABLE_KEY loaded (" . substr($pubKey, 0, 12) . "...)</div>";
} else {
    echo "<div class='test error'>❌ STRIPE_PUBLISHABLE_KEY not loaded</div>";
}

if (!empty($secKey)) {
    echo "<div class='test success'>✅ STRIPE_SECRET_KEY loaded (" . substr($secKey, 0, 12) . "...)</div>";
} else {
    echo "<div class='test error'>❌ STRIPE_SECRET_KEY not loaded</div>";
}

// Test 4: Check Composer dependencies
echo "<h2>🔧 Test 4: Composer Dependencies</h2>";
if (file_exists('vendor/autoload.php')) {
    echo "<div class='test success'>✅ Composer autoload found</div>";
    require_once 'vendor/autoload.php';
    
    if (class_exists('\Stripe\Stripe')) {
        echo "<div class='test success'>✅ Stripe PHP library loaded</div>";
    } else {
        echo "<div class='test error'>❌ Stripe PHP library not found</div>";
    }
} else {
    echo "<div class='test error'>❌ Composer dependencies not installed</div>";
    echo "<div class='test info'>📝 Run: <div class='code'>composer install</div></div>";
}

// Test 5: Test Stripe API connection
echo "<h2>🔧 Test 5: Stripe API Connection</h2>";
if (!empty($secKey) && class_exists('\Stripe\Stripe')) {
    try {
        \Stripe\Stripe::setApiKey($secKey);
        $account = \Stripe\Account::retrieve();
        echo "<div class='test success'>✅ Stripe API connection successful</div>";
        echo "<div class='test info'>Account ID: " . $account->id . "<br>";
        echo "Country: " . $account->country . "<br>";
        echo "Currency: " . $account->default_currency . "</div>";
        
        // Test creating a customer (safe test)
        try {
            $testCustomer = \Stripe\Customer::create([
                'email' => 'test@example.com',
                'name' => 'Test Customer',
                'metadata' => ['test' => 'debug']
            ]);
            echo "<div class='test success'>✅ Can create Stripe objects (Customer ID: " . $testCustomer->id . ")</div>";
            
            // Clean up
            $testCustomer->delete();
            echo "<div class='test success'>✅ Test customer cleaned up</div>";
            
        } catch (Exception $e) {
            echo "<div class='test warning'>⚠️ Can connect but cannot create objects: " . $e->getMessage() . "</div>";
        }
        
    } catch (\Stripe\Exception\AuthenticationException $e) {
        echo "<div class='test error'>❌ Stripe authentication failed: " . $e->getMessage() . "</div>";
    } catch (Exception $e) {
        echo "<div class='test error'>❌ Stripe API error: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<div class='test error'>❌ Cannot test - missing secret key or Stripe library</div>";
}

// Test 6: Test payment intent creation
echo "<h2>🔧 Test 6: Payment Intent Creation Test</h2>";
if (!empty($secKey) && class_exists('\Stripe\Stripe')) {
    try {
        \Stripe\Stripe::setApiKey($secKey);
        
        $paymentIntent = \Stripe\PaymentIntent::create([
            'amount' => 100, // €1.00
            'currency' => 'eur',
            'automatic_payment_methods' => [
                'enabled' => true,
                'allow_redirects' => 'never'
            ],
            'metadata' => [
                'test' => 'debug',
                'source' => 'debug-script'
            ]
        ]);
        
        echo "<div class='test success'>✅ Payment Intent created successfully</div>";
        echo "<div class='test info'>Payment Intent ID: " . $paymentIntent->id . "<br>";
        echo "Client Secret: " . substr($paymentIntent->client_secret, 0, 20) . "...</div>";
        
    } catch (Exception $e) {
        echo "<div class='test error'>❌ Payment Intent creation failed: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<div class='test error'>❌ Cannot test payment intent - missing requirements</div>";
}

// Test 7: Check database connection
echo "<h2>🔧 Test 7: Database Connection</h2>";
if (file_exists('php/include/db_connect.php')) {
    try {
        require_once 'php/include/db_connect.php';
        echo "<div class='test success'>✅ Database connection successful</div>";
        
        // Test subscription_plans table
        $stmt = $conn->query("SELECT * FROM subscription_plans LIMIT 1");
        if ($stmt->rowCount() > 0) {
            echo "<div class='test success'>✅ subscription_plans table exists and has data</div>";
        } else {
            echo "<div class='test warning'>⚠️ subscription_plans table exists but is empty</div>";
        }
        
    } catch (Exception $e) {
        echo "<div class='test error'>❌ Database connection failed: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<div class='test error'>❌ Database connection file not found</div>";
}

// Test 8: Session test
echo "<h2>🔧 Test 8: Session Test</h2>";
if (session_status() === PHP_SESSION_ACTIVE) {
    echo "<div class='test success'>✅ PHP session is active</div>";
} else {
    echo "<div class='test warning'>⚠️ PHP session not started</div>";
}

// Summary
echo "<h2>📊 Summary</h2>";
$canWork = !empty($pubKey) && !empty($secKey) && 
          file_exists('vendor/autoload.php') && 
          class_exists('\Stripe\Stripe');

if ($canWork) {
    echo "<div class='test success'>";
    echo "<h3>🎉 Configuration looks good!</h3>";
    echo "Your Stripe integration should work. If you're still having issues:<br><br>";
    echo "1. Clear your browser cache<br>";
    echo "2. Check browser console for JavaScript errors<br>";
    echo "3. Try a different browser<br>";
    echo "4. Check server error logs<br>";
    echo "</div>";
} else {
    echo "<div class='test error'>";
    echo "<h3>❌ Configuration issues found</h3>";
    echo "Please fix the issues marked with ❌ above before testing payments.";
    echo "</div>";
}

echo "<br><br>";
echo "<div class='test info'>";
echo "<h3>📝 Next Steps:</h3>";
echo "1. <a href='pages/subscription.php'>Test Subscription Page</a><br>";
echo "2. <a href='test-stripe.php'>Run Original Test</a><br>";
echo "3. Check browser console on subscription page<br>";
echo "</div>";

echo "</div>";
?>