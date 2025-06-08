<?php
// php/api/subscription/create-checkout-session.php - Enhanced with better client_secret handling

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

// Enhanced logging function
function debugLog($message, $data = null) {
    if (DEBUG_MODE) {
        $logMessage = "[DEBUG] " . $message;
        if ($data !== null) {
            $logMessage .= " | Data: " . json_encode($data, JSON_PRETTY_PRINT);
        }
        error_log($logMessage);
    }
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
            debugLog("Stripe loaded from: " . $path);
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
    debugLog("Stripe initialized with API key: " . substr(STRIPE_SECRET_KEY, 0, 12) . "...");

    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    debugLog("Received request data", $data);

    if (!$data) {
        throw new Exception('Invalid JSON data');
    }

    $userId = $_SESSION['user_id'];
    $userData = getUserData($userId);
    
    if (empty($userData)) {
        throw new Exception('User data not found');
    }

    debugLog("User data retrieved", ['user_id' => $userId, 'email' => $userData['email']]);

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

    debugLog("Processing subscription", ['price_id' => $priceId, 'plan_id' => $planId]);

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
    debugLog("Customer created/retrieved", ['customer_id' => $customer->id]);

    // First, let's try to get the price to understand what we're dealing with
    try {
        $price = \Stripe\Price::retrieve($priceId);
        debugLog("Price retrieved", [
            'price_id' => $price->id,
            'amount' => $price->unit_amount,
            'currency' => $price->currency,
            'type' => $price->type
        ]);
    } catch (Exception $e) {
        debugLog("Failed to retrieve price: " . $e->getMessage());
        throw new Exception('Invalid price ID: ' . $priceId);
    }

    // Create subscription with enhanced error handling
    debugLog("Creating subscription...");
    
    try {
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

        debugLog("Subscription created", [
            'subscription_id' => $subscription->id,
            'status' => $subscription->status,
            'has_latest_invoice' => isset($subscription->latest_invoice),
            'invoice_id' => $subscription->latest_invoice->id ?? 'none'
        ]);

    } catch (\Stripe\Exception\StripeException $e) {
        debugLog("Stripe subscription creation failed: " . $e->getMessage());
        throw $e;
    }

    // Enhanced client_secret extraction with fallbacks
    $clientSecret = null;
    
    // Method 1: Try to get from expanded subscription
    if (isset($subscription->latest_invoice) && 
        isset($subscription->latest_invoice->payment_intent) && 
        isset($subscription->latest_invoice->payment_intent->client_secret)) {
        
        $clientSecret = $subscription->latest_invoice->payment_intent->client_secret;
        debugLog("Client secret retrieved from expanded subscription");
        
    } else {
        debugLog("No client secret in expanded subscription, trying fallback methods...");
        
        // Method 2: Retrieve the invoice separately
        if (isset($subscription->latest_invoice)) {
            try {
                $invoice = \Stripe\Invoice::retrieve($subscription->latest_invoice->id, [
                    'expand' => ['payment_intent']
                ]);
                
                if (isset($invoice->payment_intent->client_secret)) {
                    $clientSecret = $invoice->payment_intent->client_secret;
                    debugLog("Client secret retrieved from separate invoice call");
                }
                
            } catch (Exception $e) {
                debugLog("Failed to retrieve invoice separately: " . $e->getMessage());
            }
        }
        
        // Method 3: Create a separate Payment Intent if all else fails
        if (!$clientSecret) {
            debugLog("Creating separate payment intent as fallback...");
            
            try {
                $paymentIntent = \Stripe\PaymentIntent::create([
                    'amount' => $price->unit_amount,
                    'currency' => $price->currency,
                    'customer' => $customer->id,
                    'setup_future_usage' => 'off_session',
                    'metadata' => [
                        'subscription_id' => $subscription->id,
                        'plan_id' => $planId,
                        'user_id' => (string)$userId,
                        'source' => 'fallback_payment_intent'
                    ]
                ]);
                
                $clientSecret = $paymentIntent->client_secret;
                debugLog("Fallback payment intent created", ['payment_intent_id' => $paymentIntent->id]);
                
                // Update user record with payment intent ID
                updateUserPaymentIntent($userId, $paymentIntent->id);
                
            } catch (Exception $e) {
                debugLog("Failed to create fallback payment intent: " . $e->getMessage());
                throw new Exception('Unable to create payment intent for subscription');
            }
        }
    }

    // Final validation
    if (!$clientSecret) {
        debugLog("ERROR: No client secret available after all attempts");
        throw new Exception('Unable to generate client secret for payment');
    }

    // Store subscription in database with pending status
    storePendingSubscription($customer->id, $subscription, $planId, $userId);

    $response = [
        'success' => true,
        'subscription_id' => $subscription->id,
        'client_secret' => $clientSecret,
        'customer_id' => $customer->id
    ];

    debugLog("Successful response", $response);
    
    echo json_encode($response);

} catch (\Stripe\Exception\StripeException $e) {
    $errorMessage = getStripeErrorMessage($e);
    debugLog('Stripe error: ' . $e->getMessage(), ['stripe_code' => $e->getStripeCode()]);
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $errorMessage,
        'error_type' => 'stripe_error',
        'stripe_code' => $e->getStripeCode()
    ]);
    
} catch (Exception $e) {
    debugLog('General error: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_type' => 'general_error'
    ]);
}

// Add the new helper function
function updateUserPaymentIntent($userId, $paymentIntentId) {
    global $conn;
    
    try {
        $stmt = $conn->prepare("UPDATE users SET last_payment_intent = ? WHERE id = ?");
        $stmt->execute([$paymentIntentId, $userId]);
        debugLog("Updated user payment intent", ['user_id' => $userId, 'payment_intent_id' => $paymentIntentId]);
    } catch (Exception $e) {
        debugLog("Failed to update user payment intent: " . $e->getMessage());
    }
}

// Keep your existing functions (handleDemoMode, createOrRetrieveCustomer, etc.)
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
                debugLog("Existing customer retrieved", ['customer_id' => $customer->id]);
                return $customer;
            }
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Customer doesn't exist in Stripe, create new one
            debugLog("Existing customer not found in Stripe, creating new one");
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
    debugLog("New customer created", ['customer_id' => $customer->id]);
    
    // Update user record with Stripe customer ID
    $stmt = $conn->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
    $stmt->execute([$customer->id, $userData['id']]);
    
    return $customer;
}

function storePendingSubscription($customerId, $subscription, $planId, $userId) {
    global $conn;
    
    $subscriptionId = $subscription->id;
    
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
    
    debugLog("Pending subscription stored", ['subscription_id' => $subscriptionId, 'user_id' => $userId]);
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