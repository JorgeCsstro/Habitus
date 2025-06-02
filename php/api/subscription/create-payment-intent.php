<?php
// php/api/subscription/create-payment-intent.php - DEBUG VERSION

// Enable error logging
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/stripe_errors.log');

// Start output buffering to catch any unwanted output
ob_start();

// Log the request
$logFile = __DIR__ . '/../../logs/stripe_debug.log';
$requestData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'input' => file_get_contents('php://input'),
    'headers' => getallheaders(),
    'session' => $_SESSION ?? null
];
file_put_contents($logFile, "REQUEST: " . json_encode($requestData) . "\n", FILE_APPEND);

try {
    // Clean any previous output
    if (ob_get_length()) {
        ob_clean();
    }
    
    // Set headers
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    
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
    
    // Validate Stripe keys
    if (!defined('STRIPE_SECRET_KEY') || empty(STRIPE_SECRET_KEY)) {
        throw new Exception('STRIPE_SECRET_KEY not configured in .env file');
    }
    
    if (!defined('STRIPE_PUBLISHABLE_KEY') || empty(STRIPE_PUBLISHABLE_KEY)) {
        throw new Exception('STRIPE_PUBLISHABLE_KEY not configured in .env file');
    }
    
    // Initialize Stripe
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
    // Check authentication
    if (!function_exists('isLoggedIn') || !isLoggedIn()) {
        throw new Exception('User not logged in');
    }
    
    // Get and validate input
    $rawInput = file_get_contents('php://input');
    if (empty($rawInput)) {
        throw new Exception('No input data received');
    }
    
    $inputData = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    
    if (!isset($inputData['plan'])) {
        throw new Exception('Plan parameter missing');
    }
    
    $plan = $inputData['plan'];
    
    // Validate plan
    $validPlans = ['adfree', 'premium'];
    if (!in_array($plan, $validPlans)) {
        throw new Exception('Invalid plan: ' . $plan);
    }
    
    // Plan prices in cents (EUR)
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
        throw new Exception('User data not found');
    }
    
    // Log user data (without sensitive info)
    file_put_contents($logFile, "USER: {$userData['username']} (ID: {$_SESSION['user_id']})\n", FILE_APPEND);
    
    // Create or retrieve Stripe customer
    $customerId = null;
    
    if (!empty($userData['stripe_customer_id'])) {
        try {
            $customer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
            $customerId = $customer->id;
            file_put_contents($logFile, "CUSTOMER: Retrieved existing {$customerId}\n", FILE_APPEND);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            file_put_contents($logFile, "CUSTOMER: Existing customer invalid, will create new\n", FILE_APPEND);
            $customerId = null;
        }
    }
    
    // Create new customer if needed
    if (!$customerId) {
        $customer = \Stripe\Customer::create([
            'email' => $userData['email'],
            'name' => $userData['username'],
            'metadata' => [
                'user_id' => $_SESSION['user_id'],
                'username' => $userData['username']
            ]
        ]);
        
        $customerId = $customer->id;
        file_put_contents($logFile, "CUSTOMER: Created new {$customerId}\n", FILE_APPEND);
        
        // Save to database
        $updateStmt = $conn->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
        $updateStmt->execute([$customerId, $_SESSION['user_id']]);
    }
    
    // Create payment intent
    file_put_contents($logFile, "PAYMENT_INTENT: Creating for plan {$plan} amount {$planPrices[$plan]}\n", FILE_APPEND);
    
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $planPrices[$plan],
        'currency' => 'eur',
        'customer' => $customerId,

        // CRITICAL: Proper automatic payment methods for Google Pay
        'automatic_payment_methods' => [
            'enabled' => true,
            'allow_redirects' => 'never'
        ],

        // ADDED: Shipping information (helps with Google Pay)
        'shipping' => [
            'name' => $userData['username'],
            'address' => [
                'country' => 'ES', // Spain for EUR currency
            ]
        ],

        'metadata' => [
            'user_id' => $_SESSION['user_id'],
            'plan' => $plan,
            'username' => $userData['username'],
            'email' => $userData['email'],
            'domain' => $_SERVER['HTTP_HOST'] ?? 'habitus.zone'
        ],
        'description' => "Habitus Zone {$plan} subscription - {$userData['username']}",
        'receipt_email' => $userData['email'],

        // ADDED: Statement descriptor for user's card statement
        'statement_descriptor' => 'HABITUS ZONE',
        'statement_descriptor_suffix' => strtoupper($plan)
    ]); 
    
    // ENHANCED: Log payment methods enabled
    file_put_contents($logFile, "PAYMENT_METHODS: " . json_encode($paymentIntent->automatic_payment_methods) . "\n", FILE_APPEND);
    
    // Prepare response
    $response = [
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'paymentIntentId' => $paymentIntent->id,
        'customerId' => $customerId,
        'debug' => [
            'plan' => $plan,
            'amount' => $planPrices[$plan],
            'user_id' => $_SESSION['user_id']
        ]
    ];
    
    // Log response
    file_put_contents($logFile, "RESPONSE: " . json_encode($response) . "\n", FILE_APPEND);
    
    // Clean output buffer and send response
    ob_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (\Stripe\Exception\AuthenticationException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Stripe authentication failed. Check your API keys.',
        'error_type' => 'auth_error',
        'debug' => $e->getMessage()
    ];
    file_put_contents($logFile, "ERROR: " . json_encode($error) . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    ob_clean();
    $error = [
        'success' => false,
        'message' => 'Stripe API error: ' . $e->getMessage(),
        'error_type' => 'stripe_api_error',
        'debug' => $e->getStripeCode()
    ];
    file_put_contents($logFile, "ERROR: " . json_encode($error) . "\n", FILE_APPEND);
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
            'trace' => $e->getTraceAsString()
        ]
    ];
    file_put_contents($logFile, "ERROR: " . json_encode($error) . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode($error);
}

// End output buffering
ob_end_flush();
exit;
?>