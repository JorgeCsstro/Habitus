<?php
// php/api/subscription/create-payment-intent.php - COMPLETE ENHANCED VERSION for Google Pay

// Enable comprehensive error logging
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/stripe_errors.log');

// Start output buffering to catch any unwanted output
ob_start();

// Create logs directory if it doesn't exist
$logsDir = __DIR__ . '/../../logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

// Enhanced logging for Google Pay debugging
$logFile = __DIR__ . '/../../logs/stripe_debug.log';
$requestData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'input' => file_get_contents('php://input'),
    'headers' => getallheaders(),
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
    'referer' => $_SERVER['HTTP_REFERER'] ?? 'Unknown'
];
file_put_contents($logFile, "=== GOOGLE PAY REQUEST START ===" . PHP_EOL, FILE_APPEND);
file_put_contents($logFile, json_encode($requestData, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);

try {
    // Clean any previous output
    if (ob_get_length()) {
        ob_clean();
    }
    
    // Set comprehensive headers
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    
    // Load required files
    require_once '../../include/config.php';
    require_once '../../include/db_connect.php';
    require_once '../../include/auth.php';
    require_once '../../include/functions.php';
    
    // Check if Composer autoload exists
    $autoloadPath = __DIR__ . '/../../../vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        throw new Exception('Composer dependencies not installed. Run: composer install');
    }
    
    require_once $autoloadPath;
    
    // Validate Stripe configuration
    if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
        throw new Exception('STRIPE_SECRET_KEY not configured in environment');
    }
    
    if (!defined('STRIPE_PUBLISHABLE_KEY') || empty(STRIPE_PUBLISHABLE_KEY)) {
        throw new Exception('STRIPE_PUBLISHABLE_KEY not configured in environment');
    }
    
    // Initialize Stripe with error handling
    try {
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        \Stripe\Stripe::setApiVersion('2023-10-16'); // Use latest API version
        file_put_contents($logFile, "STRIPE: API initialized successfully" . PHP_EOL, FILE_APPEND);
    } catch (Exception $e) {
        throw new Exception('Stripe initialization failed: ' . $e->getMessage());
    }
    
    // Check authentication
    if (!function_exists('isLoggedIn') || !isLoggedIn()) {
        throw new Exception('User authentication required');
    }
    
    // Get and validate input data
    $rawInput = file_get_contents('php://input');
    if (empty($rawInput)) {
        throw new Exception('No input data received');
    }
    
    $inputData = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    
    file_put_contents($logFile, "INPUT: " . json_encode($inputData, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);
    
    // Validate required parameters
    if (!isset($inputData['plan'])) {
        throw new Exception('Plan parameter is required');
    }
    
    $plan = $inputData['plan'];
    $enableGooglePay = $inputData['enable_google_pay'] ?? true;
    
    // Validate plan selection
    $validPlans = ['adfree', 'premium'];
    if (!in_array($plan, $validPlans)) {
        throw new Exception('Invalid plan selected: ' . $plan);
    }
    
    // Plan pricing in cents (EUR)
    $planPrices = [
        'adfree' => 100,   // €1.00
        'premium' => 500   // €5.00
    ];
    
    // Get user data
    if (!function_exists('getUserData')) {
        throw new Exception('getUserData function not available');
    }
    
    $userData = getUserData($_SESSION['user_id']);
    if (!$userData) {
        throw new Exception('User data not found for ID: ' . $_SESSION['user_id']);
    }
    
    file_put_contents($logFile, "USER: {$userData['username']} (ID: {$_SESSION['user_id']}, Email: {$userData['email']})" . PHP_EOL, FILE_APPEND);
    
    // Create or retrieve Stripe customer
    $customerId = null;
    
    if (!empty($userData['stripe_customer_id'])) {
        try {
            $customer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
            $customerId = $customer->id;
            file_put_contents($logFile, "CUSTOMER: Retrieved existing customer {$customerId}" . PHP_EOL, FILE_APPEND);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            file_put_contents($logFile, "CUSTOMER: Existing customer invalid, will create new: " . $e->getMessage() . PHP_EOL, FILE_APPEND);
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
                'google_pay_enabled' => $enableGooglePay ? 'true' : 'false',
                'created_from' => 'habitus_zone_subscription'
            ]
        ];
        
        $customer = \Stripe\Customer::create($customerData);
        $customerId = $customer->id;
        file_put_contents($logFile, "CUSTOMER: Created new customer {$customerId}" . PHP_EOL, FILE_APPEND);
        
        // Save customer ID to database
        $updateStmt = $conn->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
        $updateStmt->execute([$customerId, $_SESSION['user_id']]);
        file_put_contents($logFile, "DATABASE: Updated user with stripe_customer_id" . PHP_EOL, FILE_APPEND);
    }
    
    // Prepare payment intent data
    file_put_contents($logFile, "PAYMENT_INTENT: Creating for plan {$plan}, amount {$planPrices[$plan]} cents" . PHP_EOL, FILE_APPEND);
    
    $paymentIntentData = [
        'amount' => $planPrices[$plan],
        'currency' => 'eur',
        'customer' => $customerId,
        'metadata' => [
            'user_id' => $_SESSION['user_id'],
            'plan' => $plan,
            'username' => $userData['username'],
            'email' => $userData['email'],
            'domain' => $_SERVER['HTTP_HOST'] ?? 'habitus.zone',
            'google_pay_requested' => $enableGooglePay ? 'yes' : 'no',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'created_at' => date('Y-m-d H:i:s')
        ],
        'description' => "Habitus Zone {$plan} subscription - {$userData['username']}",
        'receipt_email' => $userData['email'],
        'statement_descriptor' => 'HABITUS ZONE',
        'statement_descriptor_suffix' => strtoupper(substr($plan, 0, 6))
    ];
    
    // ENHANCED: Configure payment methods for Google Pay optimization
    if ($enableGooglePay) {
        // Explicitly enable Google Pay and other payment methods
        $paymentIntentData['payment_method_types'] = ['card', 'google_pay'];
        
        // Enhanced automatic payment methods configuration
        $paymentIntentData['automatic_payment_methods'] = [
            'enabled' => true,
            'allow_redirects' => 'never'
        ];
        
        file_put_contents($logFile, "GOOGLE_PAY: Explicitly enabled in payment intent" . PHP_EOL, FILE_APPEND);
    } else {
        $paymentIntentData['automatic_payment_methods'] = [
            'enabled' => true,
            'allow_redirects' => 'never'
        ];
    }
    
    // ENHANCED: Improved shipping configuration for Google Pay merchant validation
    $paymentIntentData['shipping'] = [
        'name' => $userData['username'],
        'address' => [
            'country' => 'ES', // Spain for EUR currency
            'line1' => 'Digital Service Delivery', // Since it's a digital product
            'city' => 'Valencia',
            'state' => 'Valencia',
            'postal_code' => '46000'
        ]
    ];
    
    // ENHANCED: Additional configuration for better Google Pay support
    $paymentIntentData['setup_future_usage'] = 'off_session'; // For recurring payments
    $paymentIntentData['capture_method'] = 'automatic';
    $paymentIntentData['confirmation_method'] = 'automatic';
    
    // Create the payment intent
    file_put_contents($logFile, "PAYMENT_INTENT: Creating with data: " . json_encode($paymentIntentData, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);
    
    $paymentIntent = \Stripe\PaymentIntent::create($paymentIntentData);
    
    // Log the created payment intent details
    file_put_contents($logFile, "PAYMENT_INTENT: Created successfully with ID: {$paymentIntent->id}" . PHP_EOL, FILE_APPEND);
    file_put_contents($logFile, "PAYMENT_METHODS: Available types: " . json_encode($paymentIntent->payment_method_types) . PHP_EOL, FILE_APPEND);
    file_put_contents($logFile, "AUTO_METHODS: Configuration: " . json_encode($paymentIntent->automatic_payment_methods) . PHP_EOL, FILE_APPEND);
    
    // Check if Google Pay is actually available
    $googlePayAvailable = in_array('google_pay', $paymentIntent->payment_method_types ?? []);
    file_put_contents($logFile, "GOOGLE_PAY: Available in payment intent: " . ($googlePayAvailable ? 'YES' : 'NO') . PHP_EOL, FILE_APPEND);
    
    // If Google Pay was requested but not available, log why
    if ($enableGooglePay && !$googlePayAvailable) {
        file_put_contents($logFile, "GOOGLE_PAY: WARNING - Requested but not available. Check Stripe account settings." . PHP_EOL, FILE_APPEND);
    }
    
    // Prepare comprehensive response
    $response = [
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'paymentIntentId' => $paymentIntent->id,
        'customerId' => $customerId,
        'google_pay_available' => $googlePayAvailable,
        'payment_method_types' => $paymentIntent->payment_method_types,
        'amount' => $paymentIntent->amount,
        'currency' => $paymentIntent->currency,
        'status' => $paymentIntent->status,
        'debug' => [
            'plan' => $plan,
            'amount_cents' => $planPrices[$plan],
            'amount_display' => '€' . number_format($planPrices[$plan] / 100, 2),
            'user_id' => $_SESSION['user_id'],
            'google_pay_requested' => $enableGooglePay,
            'automatic_payment_methods' => $paymentIntent->automatic_payment_methods,
            'timestamp' => date('Y-m-d H:i:s'),
            'environment' => [
                'https' => ($_SERVER['HTTPS'] ?? 'off') === 'on',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]
        ]
    ];
    
    file_put_contents($logFile, "RESPONSE: " . json_encode($response, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);
    file_put_contents($logFile, "=== GOOGLE PAY REQUEST SUCCESS ===" . PHP_EOL . PHP_EOL, FILE_APPEND);
    
    // Clean output buffer and send response
    ob_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (\Stripe\Exception\AuthenticationException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Stripe authentication failed. Please check API key configuration.',
        'error_type' => 'stripe_auth_error',
        'debug' => [
            'stripe_error' => $e->getMessage(),
            'api_key_prefix' => substr(STRIPE_SECRET_KEY, 0, 12) . '...'
        ]
    ];
    file_put_contents($logFile, "ERROR: Authentication failed - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
    
} catch (\Stripe\Exception\InvalidRequestException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Invalid request to Stripe: ' . $e->getMessage(),
        'error_type' => 'stripe_invalid_request',
        'debug' => [
            'stripe_code' => $e->getStripeCode(),
            'param' => $e->getStripeParam(),
            'request_id' => $e->getRequestId()
        ]
    ];
    file_put_contents($logFile, "ERROR: Invalid request - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(400);
    echo json_encode($error);
    
} catch (\Stripe\Exception\RateLimitException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Too many requests to Stripe. Please try again later.',
        'error_type' => 'stripe_rate_limit',
        'debug' => [
            'retry_after' => $e->getHttpHeaders()['Retry-After'] ?? 60
        ]
    ];
    file_put_contents($logFile, "ERROR: Rate limited - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(429);
    echo json_encode($error);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Stripe API error: ' . $e->getMessage(),
        'error_type' => 'stripe_api_error',
        'debug' => [
            'stripe_code' => $e->getStripeCode(),
            'decline_code' => $e->getDeclineCode(),
            'param' => $e->getStripeParam(),
            'request_id' => $e->getRequestId(),
            'http_status' => $e->getHttpStatus()
        ]
    ];
    file_put_contents($logFile, "ERROR: Stripe API error - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
    
} catch (PDOException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Database error occurred.',
        'error_type' => 'database_error',
        'debug' => [
            'pdo_code' => $e->getCode(),
            'pdo_message' => $e->getMessage()
        ]
    ];
    file_put_contents($logFile, "ERROR: Database error - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
    
} catch (Exception $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => $e->getMessage(),
        'error_type' => 'general_error',
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => DEBUG_MODE ? $e->getTraceAsString() : 'Enable debug mode for trace'
        ]
    ];
    file_put_contents($logFile, "ERROR: General error - " . json_encode($error) . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
}

// End output buffering
ob_end_flush();
exit;
?>