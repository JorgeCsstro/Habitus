<?php
// test-payment-intent.php - Debug tool for payment intent issues
// Place this file in your project root directory

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Habitus Zone - Payment Intent Debug Tool</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 10px; max-width: 1000px; }
    .test { margin: 15px 0; padding: 10px; border-radius: 5px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
    .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
    h2 { color: #333; margin-top: 30px; }
    .log-section { margin: 20px 0; }
    .log-content { max-height: 400px; overflow-y: auto; }
</style>";

echo "<div class='container'>";

// Test 1: Basic file structure
echo "<h2>🔧 Test 1: File Structure</h2>";
$requiredFiles = [
    'php/include/config.php',
    'php/include/db_connect.php', 
    'php/include/auth.php',
    'php/include/functions.php',
    'php/api/subscription/create-payment-intent.php',
    'vendor/autoload.php',
    '.env'
];

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "<div class='test success'>✅ $file exists</div>";
    } else {
        echo "<div class='test error'>❌ $file missing</div>";
    }
}

// Test 2: Load configuration
echo "<h2>🔧 Test 2: Configuration</h2>";
try {
    require_once 'php/include/config.php';
    echo "<div class='test success'>✅ Config loaded successfully</div>";
    
    if (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY)) {
        echo "<div class='test success'>✅ STRIPE_SECRET_KEY defined (" . substr(STRIPE_SECRET_KEY, 0, 12) . "...)</div>";
    } else {
        echo "<div class='test error'>❌ STRIPE_SECRET_KEY not defined or empty</div>";
    }
    
    if (defined('STRIPE_PUBLISHABLE_KEY') && !empty(STRIPE_PUBLISHABLE_KEY)) {
        echo "<div class='test success'>✅ STRIPE_PUBLISHABLE_KEY defined (" . substr(STRIPE_PUBLISHABLE_KEY, 0, 12) . "...)</div>";
    } else {
        echo "<div class='test error'>❌ STRIPE_PUBLISHABLE_KEY not defined or empty</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='test error'>❌ Config error: " . $e->getMessage() . "</div>";
}

// Test 3: Database connection
echo "<h2>🔧 Test 3: Database Connection</h2>";
try {
    require_once 'php/include/db_connect.php';
    echo "<div class='test success'>✅ Database connected successfully</div>";
    
    // Test if users table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "<div class='test success'>✅ Users table exists</div>";
    } else {
        echo "<div class='test error'>❌ Users table missing</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='test error'>❌ Database error: " . $e->getMessage() . "</div>";
}

// Test 4: Authentication
echo "<h2>🔧 Test 4: Authentication</h2>";
try {
    require_once 'php/include/auth.php';
    echo "<div class='test success'>✅ Auth functions loaded</div>";
    
    if (function_exists('isLoggedIn')) {
        echo "<div class='test success'>✅ isLoggedIn function available</div>";
        
        if (isLoggedIn()) {
            echo "<div class='test success'>✅ User is logged in (ID: " . $_SESSION['user_id'] . ")</div>";
        } else {
            echo "<div class='test warning'>⚠️ No user currently logged in</div>";
        }
    } else {
        echo "<div class='test error'>❌ isLoggedIn function not found</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='test error'>❌ Auth error: " . $e->getMessage() . "</div>";
}

// Test 5: Stripe dependencies
echo "<h2>🔧 Test 5: Stripe Dependencies</h2>";
try {
    require_once 'vendor/autoload.php';
    echo "<div class='test success'>✅ Composer autoload loaded</div>";
    
    if (class_exists('\Stripe\Stripe')) {
        echo "<div class='test success'>✅ Stripe class available</div>";
        
        // Test Stripe initialization
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        echo "<div class='test success'>✅ Stripe API key set</div>";
        
        // Test API connection
        $account = \Stripe\Account::retrieve();
        echo "<div class='test success'>✅ Stripe API connection successful (Account: " . $account->id . ")</div>";
        
    } else {
        echo "<div class='test error'>❌ Stripe class not found</div>";
    }
    
} catch (\Stripe\Exception\AuthenticationException $e) {
    echo "<div class='test error'>❌ Stripe authentication failed: " . $e->getMessage() . "</div>";
} catch (Exception $e) {
    echo "<div class='test error'>❌ Stripe error: " . $e->getMessage() . "</div>";
}

// Test 6: Simulate payment intent creation
echo "<h2>🔧 Test 6: Simulate Payment Intent Request</h2>";
if (isLoggedIn() && defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY)) {
    try {
        // Simulate the exact request that's failing
        $testData = json_encode([
            'plan' => 'adfree',
            'enable_google_pay' => true
        ]);
        
        echo "<div class='test info'>📤 Simulating request with data:<br><div class='code'>$testData</div></div>";
        
        // Create a test request to our API
        $url = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/php/api/subscription/create-payment-intent.php';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . $_SERVER['HTTP_COOKIE'] // Pass session cookie
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            echo "<div class='test error'>❌ cURL error: $error</div>";
        } else {
            echo "<div class='test info'>📥 HTTP Response Code: $httpCode</div>";
            
            if ($httpCode === 200) {
                echo "<div class='test success'>✅ Payment intent creation successful!</div>";
                $responseData = json_decode($response, true);
                if ($responseData) {
                    echo "<div class='test info'>Response data:<br><div class='code'>" . json_encode($responseData, JSON_PRETTY_PRINT) . "</div></div>";
                }
            } else {
                echo "<div class='test error'>❌ HTTP $httpCode error</div>";
                echo "<div class='test error'>Response:<br><div class='code'>" . htmlspecialchars($response) . "</div></div>";
            }
        }
        
    } catch (Exception $e) {
        echo "<div class='test error'>❌ Test request failed: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<div class='test warning'>⚠️ Cannot test - missing login or Stripe configuration</div>";
}

// Test 7: Check logs
echo "<h2>🔧 Test 7: Recent Logs</h2>";
$logFiles = [
    'php/logs/stripe_debug.log' => 'Debug Log',
    'php/logs/stripe_errors.log' => 'Error Log'
];

foreach ($logFiles as $logFile => $logName) {
    echo "<div class='log-section'>";
    echo "<h3>$logName ($logFile)</h3>";
    
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        if (!empty($content)) {
            // Show last 2000 characters
            $truncated = strlen($content) > 2000 ? '...' . substr($content, -2000) : $content;
            echo "<div class='test info'>Recent entries:<br><div class='code log-content'>" . htmlspecialchars($truncated) . "</div></div>";
        } else {
            echo "<div class='test info'>📄 Log file exists but is empty</div>";
        }
    } else {
        echo "<div class='test warning'>⚠️ Log file doesn't exist yet</div>";
    }
    echo "</div>";
}

// Test 8: Environment check
echo "<h2>🔧 Test 8: Environment Information</h2>";
echo "<div class='test info'>PHP Version: " . PHP_VERSION . "</div>";
echo "<div class='test info'>Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "</div>";
echo "<div class='test info'>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</div>";
echo "<div class='test info'>Script URL: " . $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . "</div>";

$requiredExtensions = ['curl', 'json', 'pdo', 'pdo_mysql'];
echo "<div class='test info'>Required Extensions:</div>";
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<div class='test success'>✅ $ext loaded</div>";
    } else {
        echo "<div class='test error'>❌ $ext missing</div>";
    }
}

// Summary and recommendations
echo "<h2>📋 Summary & Recommendations</h2>";

$criticalIssues = [];
if (!file_exists('php/api/subscription/create-payment-intent.php')) {
    $criticalIssues[] = "Missing create-payment-intent.php file";
}
if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
    $criticalIssues[] = "Stripe secret key not configured";
}
if (!class_exists('\Stripe\Stripe')) {
    $criticalIssues[] = "Stripe PHP library not installed";
}

if (empty($criticalIssues)) {
    echo "<div class='test success'>";
    echo "<h3>🎉 Configuration looks good!</h3>";
    echo "If you're still getting 400 errors, try these steps:<br><br>";
    echo "1. Replace your create-payment-intent.php with the fixed version above<br>";
    echo "2. Clear browser cache and cookies<br>";
    echo "3. Check the Error Log section above for specific errors<br>";
    echo "4. Try logging out and back in<br>";
    echo "5. Test with a different browser<br>";
    echo "</div>";
} else {
    echo "<div class='test error'>";
    echo "<h3>❌ Critical Issues Found:</h3>";
    foreach ($criticalIssues as $issue) {
        echo "• $issue<br>";
    }
    echo "<br>Please fix these issues before testing payments.";
    echo "</div>";
}

echo "<br><br>";
echo "<div class='test info'>";
echo "<h3>🔗 Quick Links:</h3>";
echo "<a href='pages/subscription.php'>Test Subscription Page</a> | ";
echo "<a href='pages/login.php'>Login Page</a> | ";
echo "<a href='setup.php'>Setup Script</a>";
echo "</div>";

echo "</div>";
?>