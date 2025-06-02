<?php
// php/api/subscription/create-payment-intent.php - FIXED VERSION with Better Debugging

// Enable comprehensive error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Set content type first
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Create logs directory if it doesn't exist
$logsDir = __DIR__ . '/../../logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

$logFile = $logsDir . '/stripe_debug.log';
$errorLogFile = $logsDir . '/stripe_errors.log';

// Log function
function logDebug($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message";
    if ($data) {
        $logEntry .= "\n" . json_encode($data, JSON_PRETTY_PRINT);
    }
    $logEntry .= "\n---\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Error response function
function sendError($message, $code = 400, $details = null) {
    global $errorLogFile;
    
    $error = [
        'success' => false,
        'message' => $message,
        'error_code' => $code,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($details) {
        $error['details'] = $details;
    }
    
    // Log error
    file_put_contents($errorLogFile, json_encode($error, JSON_PRETTY_PRINT) . "\n", FILE_APPEND | LOCK_EX);
    
    http_response_code($code);
    echo json_encode($error, JSON_PRETTY_PRINT);
    exit;
}

try {
    logDebug("=== PAYMENT INTENT REQUEST START ===");
    logDebug("Request Method: " . $_SERVER['REQUEST_METHOD']);
    logDebug("Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Only POST method allowed', 405);
    }
    
    // Get raw input
    $rawInput = file_get_contents('php://input');
    logDebug("Raw Input Length: " . strlen($rawInput));
    logDebug("Raw Input Content: " . $rawInput);
    
    if (empty($rawInput)) {
        sendError('No input data received - request body is empty', 400);
    }
    
    // Parse JSON
    $inputData = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON format: ' . json_last_error_msg(), 400, [
            'json_error_code' => json_last_error(),
            'raw_input' => substr($rawInput, 0, 200)
        ]);
    }
    
    logDebug("Parsed Input Data:", $inputData);
    
    // Validate required parameters
    if (!isset($inputData['plan'])) {
        sendError('Missing required parameter: plan', 400, [
            'received_keys' => array_keys($inputData)
        ]);
    }
    
    $plan = $inputData['plan'];
    $enableGooglePay = $inputData['enable_google_pay'] ?? true;
    
    logDebug("Plan: $plan, Google Pay: " . ($enableGooglePay ? 'enabled' : 'disabled'));
    
    // Validate plan
    $validPlans = ['adfree', 'premium'];
    if (!in_array($plan, $validPlans)) {
        sendError('Invalid plan selected', 400, [
            'received_plan' => $plan,
            'valid_plans' => $validPlans
        ]);
    }
    
    // Load configuration
    $configPath = __DIR__ . '/../../include/config.php';
    if (!file_exists($configPath)) {
        sendError('Configuration file not found', 500, [
            'config_path' => $configPath
        ]);
    }
    
    require_once $configPath;
    logDebug("Config loaded successfully");
    
    // Check database connection
    $dbPath = __DIR__ . '/../../include/db_connect.php';
    if (!file_exists($dbPath)) {
        sendError('Database connection file not found', 500);
    }
    
    require_once $dbPath;
    logDebug("Database connection loaded");
    
    // Check authentication
    $authPath = __DIR__ . '/../../include/auth.php';
    if (!file_exists($authPath)) {
        sendError('Authentication file not found', 500);
    }
    
    require_once $authPath;
    
    if (!function_exists('isLoggedIn')) {
        sendError('Authentication function not available', 500);
    }
    
    if (!isLoggedIn()) {
        sendError('User authentication required - please log in', 401);
    }
    
    logDebug("User authenticated - ID: " . $_SESSION['user_id']);
    
    // Check Stripe configuration
    if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
        sendError('Stripe secret key not configured', 500);
    }
    
    if (!defined('STRIPE_PUBLISHABLE_KEY') || empty(STRIPE_PUBLISHABLE_KEY)) {
        sendError('Stripe publishable key not configured', 500);
    }
    
    logDebug("Stripe keys configured - SK: " . substr(STRIPE_SECRET_KEY, 0, 12) . "...");
    
    // Load Composer dependencies
    $autoloadPath = __DIR__ . '/../../../vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        sendError('Composer dependencies not installed', 500, [
            'autoload_path' => $autoloadPath,
            'solution' => 'Run: composer install'
        ]);
    }
    
    require_once $autoloadPath;
    logDebug("Composer autoload included");
    
    // Initialize Stripe
    if (!class_exists('\Stripe\Stripe')) {
        sendError('Stripe class not available after autoload', 500);
    }
    
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    \Stripe\Stripe::setApiVersion('2023-10-16');
    logDebug("Stripe initialized successfully");
    
    // Get user data
    $functionsPath = __DIR__ . '/../../include/functions.php';
    if (!file_exists($functionsPath)) {
        sendError('Functions file not found', 500);
    }
    
    require_once $functionsPath;
    
    if (!function_exists('getUserData')) {
        sendError('getUserData function not available', 500);
    }
    
    $userData = getUserData($_SESSION['user_id']);
    if (!$userData) {
        sendError('User data not found', 404, [
            'user_id' => $_SESSION['user_id']
        ]);
    }
    
    logDebug("User data retrieved:", [
        'id' => $userData['id'],
        'username' => $userData['username'],
        'email' => $userData['email']
    ]);
    
    // Plan pricing (in cents)
    $planPrices = [
        'adfree' => 100,   // €1.00
        'premium' => 500   // €5.00
    ];
    
    $amount = $planPrices[$plan];
    logDebug("Amount for plan '$plan': $amount cents");
    
    // Create or get Stripe customer
    $customerId = null;
    
    if (!empty($userData['stripe_customer_id'])) {
        try {
            $customer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
            $customerId = $customer->id;
            logDebug("Retrieved existing customer: $customerId");
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            logDebug("Existing customer invalid, will create new: " . $e->getMessage());
            $customerId = null;
        }
    }
    
    // Create new customer if needed
    if (!$customerId) {
        $customerData = [
            'email' => $userData['email'],
            'name' => $userData['username'],
            'metadata' => [
                'user_id' => $_SESSION['user_id'],
                'username' => $userData['username'],
                'source' => 'habitus_zone'
            ]
        ];
        
        logDebug("Creating new customer with data:", $customerData);
        
        $customer = \Stripe\Customer::create($customerData);
        $customerId = $customer->id;
        
        logDebug("Created new customer: $customerId");
        
        // Save customer ID to database
        try {
            $updateStmt = $conn->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
            $updateStmt->execute([$customerId, $_SESSION['user_id']]);
            logDebug("Updated user with stripe_customer_id");
        } catch (PDOException $e) {
            logDebug("Database update error: " . $e->getMessage());
            // Continue anyway - customer was created successfully
        }
    }
    
    // Create payment intent
    $paymentIntentData = [
        'amount' => $amount,
        'currency' => 'eur',
        'customer' => $customerId,
        'automatic_payment_methods' => [
            'enabled' => true,
            'allow_redirects' => 'never'
        ],
        'metadata' => [
            'user_id' => $_SESSION['user_id'],
            'plan' => $plan,
            'username' => $userData['username'],
            'email' => $userData['email']
        ],
        'description' => "Habitus Zone $plan subscription",
        'receipt_email' => $userData['email']
    ];
    
    if ($enableGooglePay) {
        $paymentIntentData['payment_method_types'] = ['card', 'google_pay'];
    }
    
    logDebug("Creating payment intent with data:", $paymentIntentData);
    
    $paymentIntent = \Stripe\PaymentIntent::create($paymentIntentData);
    
    logDebug("Payment intent created successfully:", [
        'id' => $paymentIntent->id,
        'amount' => $paymentIntent->amount,
        'currency' => $paymentIntent->currency,
        'status' => $paymentIntent->status,
        'payment_method_types' => $paymentIntent->payment_method_types
    ]);
    
    // Prepare response
    $response = [
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'paymentIntentId' => $paymentIntent->id,
        'customerId' => $customerId,
        'amount' => $paymentIntent->amount,
        'currency' => $paymentIntent->currency,
        'payment_method_types' => $paymentIntent->payment_method_types,
        'google_pay_available' => in_array('google_pay', $paymentIntent->payment_method_types ?? []),
        'debug' => [
            'plan' => $plan,
            'amount_eur' => number_format($amount / 100, 2),
            'user_id' => $_SESSION['user_id'],
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];
    
    logDebug("Sending success response:", $response);
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (\Stripe\Exception\AuthenticationException $e) {
    sendError('Stripe authentication failed', 500, [
        'stripe_error' => $e->getMessage(),
        'api_key_prefix' => substr(STRIPE_SECRET_KEY ?? '', 0, 12) . '...'
    ]);
    
} catch (\Stripe\Exception\InvalidRequestException $e) {
    sendError('Invalid Stripe request', 400, [
        'stripe_error' => $e->getMessage(),
        'stripe_code' => $e->getStripeCode(),
        'param' => $e->getStripeParam()
    ]);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    sendError('Stripe API error', 500, [
        'stripe_error' => $e->getMessage(),
        'stripe_code' => $e->getStripeCode(),
        'http_status' => $e->getHttpStatus()
    ]);
    
} catch (PDOException $e) {
    sendError('Database connection error', 500, [
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
    
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500, [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>