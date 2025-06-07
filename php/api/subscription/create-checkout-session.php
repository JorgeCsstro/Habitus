<?php
// php/api/subscription/create-checkout-session.php - Complete Stripe Elements implementation

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting for debugging
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}

try {
    // Check if user is logged in
    if (!isLoggedIn()) {
        throw new Exception('User not logged in');
    }

    // Load Stripe
    $stripeLoaded = false;
    $possiblePaths = [
        '../../../vendor/autoload.php',
        '../../vendor/autoload.php',
        '../vendor/autoload.php',
        'vendor/autoload.php',
        __DIR__ . '/../../../vendor/autoload.php',
        __DIR__ . '/../../../../vendor/autoload.php'
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $stripeLoaded = true;
            break;
        }
    }
    
    if (!$stripeLoaded) {
        throw new Exception('Stripe SDK not found. Please run: composer install');
    }

    // Check if Stripe is configured
    if (empty(STRIPE_SECRET_KEY)) {
        throw new Exception('Stripe secret key not configured');
    }

    // Initialize Stripe
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON data');
    }

    $userId = $_SESSION['user_id'];
    $userData = getUserData($userId);
    
    if (empty($userData)) {
        throw new Exception('User data not found');
    }

    // Handle debug/demo mode (maintain existing functionality)
    if (isset($data['plan']) && (STRIPE_DEMO_MODE || isset($data['debug_mode']))) {
        return handleDemoMode($data, $userData, $userId);
    }

    // Handle real Stripe payment
    if (!isset($data['price_id']) || !isset($data['plan_id'])) {
        throw new Exception('Missing required parameters: price_id and plan_id');
    }

    $priceId = sanitizeString($data['price_id']);
    $planId = sanitizeString($data['plan_id']);
    $customerData = $data['customer_data'] ?? [];

    // Validate price ID format
    if (!preg_match('/^price_[a-zA-Z0-9]+$/', $priceId)) {
        throw new Exception('Invalid price ID format');
    }

    // Validate plan ID
    if (!in_array($planId, ['adfree', 'premium'])) {
        throw new Exception('Invalid plan type');
    }

    // Create or retrieve Stripe customer
    $customer = createOrRetrieveCustomer($userData, $customerData);

    // Create subscription with Payment Intent
    $subscription = \Stripe\Subscription::create([
        'customer' => $customer->id,
        'items' => [[
            'price' => $priceId,
        ]],
        'payment_behavior' => 'default_incomplete',
        'payment_settings' => [
            'save_default_payment_method' => 'on_subscription',
            'payment_method_types' => ['card']
        ],
        'expand' => ['latest_invoice.payment_intent'],
        'metadata' => [
            'plan_id' => $planId,
            'user_id' => (string)$userId,
            'source' => 'payment_modal'
        ]
    ]);

    // Store subscription in database with pending status
    storePendingSubscription($customer->id, $subscription, $planId, $userId);

    echo json_encode([
        'success' => true,
        'subscription_id' => $subscription->id,
        'client_secret' => $subscription->latest_invoice->payment_intent->client_secret,
        'customer_id' => $customer->id
    ]);

} catch (\Stripe\Exception\StripeException $e) {
    error_log('Stripe error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => [
            'type' => $e->getStripeCode() ?: 'stripe_error',
            'message' => getStripeErrorMessage($e)
        ]
    ]);
} catch (Exception $e) {
    error_log('General error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => [
            'type' => 'general_error',
            'message' => $e->getMessage()
        ]
    ]);
}

function handleDemoMode($data, $userData, $userId) {
    global $conn;
    
    $plan = $data['plan'];
    
    // Validate plan
    if (!in_array($plan, ['adfree', 'premium'])) {
        throw new Exception('Invalid plan type');
    }

    // Demo prices
    $planPrices = [
        'adfree' => 1.00,
        'premium' => 5.00
    ];
    
    // Calculate expiry date (1 month from now)
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 month'));
    
    // Update user subscription in database
    $conn->beginTransaction();
    
    try {
        $updateQuery = "UPDATE users SET 
                       subscription_type = ?, 
                       subscription_expires = ?
                       WHERE id = ?";
        
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$plan, $expiryDate, $userId]);
        
        // Record the transaction
        $transactionDesc = "Demo Subscription: " . ucfirst($plan) . " Plan";
        $insertTransaction = "INSERT INTO transactions 
                             (user_id, amount, description, transaction_type, reference_type) 
                             VALUES (?, ?, ?, 'spend', 'subscription')";
        $stmt = $conn->prepare($insertTransaction);
        $stmt->execute([
            $userId, 
            $planPrices[$plan] * 100, // Convert to cents
            $transactionDesc
        ]);
        
        $conn->commit();
        
        // Return success with redirect to success page
        echo json_encode([
            'success' => true,
            'checkout_url' => SITE_URL . '/pages/subscription.php?success=true&demo=true',
            'demo_mode' => true
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
    exit;
}

function createOrRetrieveCustomer($userData, $customerData) {
    global $conn;
    
    $email = $userData['email'];
    $name = $userData['username'];
    
    // Check if customer exists in Stripe
    if (!empty($userData['stripe_customer_id'])) {
        try {
            // Return existing Stripe customer
            $customer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
            if (!$customer->deleted) {
                return $customer;
            }
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Customer doesn't exist in Stripe, create new one
        }
    }
    
    // Create new Stripe customer
    $customerParams = [
        'email' => $email,
        'name' => $name,
        'metadata' => [
            'user_id' => (string)$userData['id'],
            'source' => 'subscription_modal'
        ]
    ];
    
    $customer = \Stripe\Customer::create($customerParams);
    
    // Update user record with Stripe customer ID
    $stmt = $conn->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
    $stmt->execute([$customer->id, $userData['id']]);
    
    return $customer;
}

function storePendingSubscription($customerId, $subscription, $planId, $userId) {
    global $conn;
    
    $priceId = $subscription->items->data[0]->price->id;
    $subscriptionId = $subscription->id;
    $expiryDate = date('Y-m-d H:i:s', $subscription->current_period_end);
    
    // Update user record with subscription info
    $stmt = $conn->prepare("
        UPDATE users SET 
        stripe_subscription_id = ?,
        subscription_type = 'free',
        subscription_expires = NULL
        WHERE id = ?
    ");
    $stmt->execute([$subscriptionId, $userId]);
    
    // Log subscription attempt
    $stmt = $conn->prepare("
        INSERT INTO subscription_history 
        (user_id, event_type, plan_type, amount, created_at) 
        VALUES (?, 'payment_attempt', ?, 0, NOW())
    ");
    $stmt->execute([$userId, $planId]);
}

function getStripeErrorMessage($error) {
    switch ($error->getStripeCode()) {
        case 'card_declined':
            return 'Your card was declined. Please try a different payment method.';
        case 'expired_card':
            return 'Your card has expired. Please use a different card.';
        case 'insufficient_funds':
            return 'Insufficient funds. Please try a different payment method.';
        case 'incorrect_cvc':
            return 'Your card security code is incorrect.';
        case 'processing_error':
            return 'An error occurred while processing your payment. Please try again.';
        case 'rate_limit_error':
            return 'Too many requests. Please wait a moment and try again.';
        default:
            return 'Payment processing failed. Please try again.';
    }
}

function sanitizeString($string) {
    return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
}
?>