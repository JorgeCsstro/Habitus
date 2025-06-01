<?php
// test-payment-endpoint.php - Direct test of the payment intent endpoint
// Place this in your root directory and visit it to test

session_start();

// For testing, create a fake session (remove this in production)
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1; // Assuming user ID 1 exists
    $_SESSION['username'] = 'test_user';
}

echo "<!DOCTYPE html>";
echo "<html><head><title>Payment Endpoint Test</title>";
echo "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;} .test{background:white;padding:20px;margin:10px 0;border-radius:8px;border-left:4px solid #4CAF50;} .error{border-left-color:#f44336;} pre{background:#f9f9f9;padding:10px;border-radius:4px;overflow-x:auto;}</style>";
echo "</head><body>";

echo "<h1>🧪 Payment Endpoint Test</h1>";

// Test 1: Direct file inclusion test
echo "<div class='test'>";
echo "<h2>1. File Inclusion Test</h2>";

try {
    $files = [
        'php/include/config.php',
        'php/include/db_connect.php',
        'php/include/auth.php',
        'php/include/functions.php',
        'vendor/autoload.php'
    ];
    
    foreach ($files as $file) {
        if (file_exists($file)) {
            echo "<p>✅ $file - EXISTS</p>";
        } else {
            echo "<p style='color:red'>❌ $file - MISSING</p>";
        }
    }
    
    // Try to include them
    require_once 'php/include/config.php';
    echo "<p>✅ Config loaded</p>";
    
    require_once 'php/include/db_connect.php';
    echo "<p>✅ Database connected</p>";
    
    require_once 'php/include/auth.php';
    echo "<p>✅ Auth functions loaded</p>";
    
    require_once 'php/include/functions.php';
    echo "<p>✅ Functions loaded</p>";
    
    if (file_exists('vendor/autoload.php')) {
        require_once 'vendor/autoload.php';
        echo "<p>✅ Composer autoload loaded</p>";
        
        if (class_exists('\Stripe\Stripe')) {
            echo "<p>✅ Stripe class available</p>";
        } else {
            echo "<p style='color:red'>❌ Stripe class not found</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "</div>";

// Test 2: Configuration test
echo "<div class='test'>";
echo "<h2>2. Configuration Test</h2>";

echo "<p><strong>STRIPE_SECRET_KEY:</strong> " . (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY) ? "SET (" . substr(STRIPE_SECRET_KEY, 0, 10) . "...)" : "NOT SET") . "</p>";
echo "<p><strong>STRIPE_PUBLISHABLE_KEY:</strong> " . (defined('STRIPE_PUBLISHABLE_KEY') && !empty(STRIPE_PUBLISHABLE_KEY) ? "SET (" . substr(STRIPE_PUBLISHABLE_KEY, 0, 10) . "...)" : "NOT SET") . "</p>";
echo "<p><strong>DEBUG_MODE:</strong> " . (defined('DEBUG_MODE') ? (DEBUG_MODE ? 'TRUE' : 'FALSE') : 'NOT SET') . "</p>";

echo "</div>";

// Test 3: Direct API call simulation
echo "<div class='test'>";
echo "<h2>3. API Call Simulation</h2>";

if (defined('STRIPE_SECRET_KEY') && !empty(STRIPE_SECRET_KEY) && class_exists('\Stripe\Stripe')) {
    try {
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        
        // Simulate the payment intent creation
        $testData = [
            'amount' => 100, // €1.00
            'currency' => 'eur',
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => [
                'user_id' => $_SESSION['user_id'],
                'plan' => 'adfree',
                'test' => 'true'
            ],
            'description' => 'Habitus Zone Test Payment'
        ];
        
        echo "<h3>Creating test payment intent...</h3>";
        $paymentIntent = \Stripe\PaymentIntent::create($testData);
        
        echo "<p>✅ Payment Intent Created Successfully!</p>";
        echo "<p><strong>ID:</strong> {$paymentIntent->id}</p>";
        echo "<p><strong>Client Secret:</strong> " . substr($paymentIntent->client_secret, 0, 20) . "...</p>";
        echo "<p><strong>Status:</strong> {$paymentIntent->status}</p>";
        
        // Show what the API would return
        $apiResponse = [
            'success' => true,
            'clientSecret' => $paymentIntent->client_secret,
            'paymentIntentId' => $paymentIntent->id
        ];
        
        echo "<h3>API Response Preview:</h3>";
        echo "<pre>" . json_encode($apiResponse, JSON_PRETTY_PRINT) . "</pre>";
        
    } catch (Exception $e) {
        echo "<p style='color:red'>❌ Stripe Error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color:orange'>⚠️ Cannot test Stripe API - missing configuration or library</p>";
}

echo "</div>";

// Test 4: Actual endpoint call
echo "<div class='test'>";
echo "<h2>4. Actual Endpoint Test</h2>";

echo "<button onclick='testEndpoint()' style='background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;'>Test Endpoint</button>";
echo "<div id='endpoint-result' style='margin-top:10px;'></div>";

echo "<script>
async function testEndpoint() {
    const resultDiv = document.getElementById('endpoint-result');
    resultDiv.innerHTML = '<p>Testing...</p>';
    
    try {
        const response = await fetch('php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: 'adfree' })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        resultDiv.innerHTML = `
            <h4>Response Details:</h4>
            <p><strong>Status:</strong> \${response.status} \${response.statusText}</p>
            <p><strong>OK:</strong> \${response.ok}</p>
            <p><strong>Content-Type:</strong> \${response.headers.get('content-type')}</p>
            <h4>Response Body:</h4>
            <pre style='max-height:300px;overflow:auto;'>\${responseText}</pre>
        `;
        
        // Try to parse as JSON
        try {
            const data = JSON.parse(responseText);
            resultDiv.innerHTML += '<h4>Parsed JSON:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
        } catch (e) {
            resultDiv.innerHTML += '<p style=\"color:red\">❌ Response is not valid JSON</p>';
        }
        
    } catch (error) {
        console.error('Fetch error:', error);
        resultDiv.innerHTML = '<p style=\"color:red\">❌ Fetch Error: ' + error.message + '</p>';
    }
}
</script>";

echo "</div>";

// Test 5: Create logs directory
echo "<div class='test'>";
echo "<h2>5. Logs Directory</h2>";

$logsDir = 'php/logs';
if (!file_exists($logsDir)) {
    if (mkdir($logsDir, 0755, true)) {
        echo "<p>✅ Created logs directory</p>";
    } else {
        echo "<p style='color:red'>❌ Failed to create logs directory</p>";
    }
} else {
    echo "<p>✅ Logs directory exists</p>";
}

// Create .htaccess to protect logs
$htaccessPath = $logsDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "Deny from all\n");
    echo "<p>✅ Created .htaccess protection for logs</p>";
}

echo "</div>";

echo "<h2>📝 Instructions</h2>";
echo "<ol>";
echo "<li>Click the 'Test Endpoint' button above</li>";
echo "<li>Check the console output in your browser's developer tools</li>";
echo "<li>Look at the response details to see what's actually being returned</li>";
echo "<li>Check the log files in php/logs/ for detailed debugging information</li>";
echo "<li>If you see HTML instead of JSON, there's a PHP error occurring</li>";
echo "</ol>";

echo "<p><em>Remember to delete this file in production!</em></p>";

echo "</body></html>";
?>