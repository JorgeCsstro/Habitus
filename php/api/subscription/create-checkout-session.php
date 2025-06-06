<?php
// php/api/subscription/create-checkout-session.php - FIXED VERSION

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Set JSON header
header('Content-Type: application/json');

// Enable error reporting for debugging (remove in production)
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}

try {
    // Check if user is logged in
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }

    // Load Stripe - try different paths
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

    if (!$data || !isset($data['plan'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid plan selection']);
        exit;
    }

    $plan = $data['plan'];
    $userId = $_SESSION['user_id'];

    // Validate plan
    if (!in_array($plan, ['adfree', 'premium'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid plan type']);
        exit;
    }

    // For demo purposes, we'll create test prices
    // In production, replace these with your actual Stripe Price IDs
    $priceMapping = [
        'adfree' => 'price_test_adfree',   // Replace with actual price ID
        'premium' => 'price_test_premium'  // Replace with actual price ID
    ];

    // Get user data
    $userData = getUserData($userId);
    if (empty($userData)) {
        throw new Exception('User data not found');
    }

    // Create or retrieve Stripe customer
    $stripeCustomer = null;
    
    if (!empty($userData['stripe_customer_id'])) {
        // Try to retrieve existing customer
        try {
            $stripeCustomer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
            if ($stripeCustomer->deleted) {
                $stripeCustomer = null;
            }
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Customer doesn't exist
            $stripeCustomer = null;
        }
    }
    
    if (!$stripeCustomer) {
        // Create new Stripe customer
        $stripeCustomer = \Stripe\Customer::create([
            'email' => $userData['email'],
            'name' => $userData['username'],
            'metadata' => [
                'user_id' => (string)$userId,
                'username' => $userData['username']
            ]
        ]);
        
        // Save Stripe customer ID to database
        $updateQuery = "UPDATE users SET stripe_customer_id = ? WHERE id = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$stripeCustomer->id, $userId]);
    }

    // For demo purposes, we'll simulate the checkout session creation
    // since we don't have actual Stripe Price IDs configured
    
    // TEMPORARY DEMO VERSION - Replace this with actual Stripe checkout when configured
    if (true) { // Set to false when you have real Stripe prices
        // Demo mode - just update the user's subscription directly
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
                           subscription_expires = ?,
                           stripe_customer_id = ?
                           WHERE id = ?";
            
            $stmt = $conn->prepare($updateQuery);
            $stmt->execute([$plan, $expiryDate, $stripeCustomer->id, $userId]);
            
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
    
    // PRODUCTION VERSION (uncomment when you have actual Stripe configuration)
    /*
    // Create Stripe Checkout Session
    $checkoutSession = \Stripe\Checkout\Session::create([
        'customer' => $stripeCustomer->id,
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => $priceMapping[$plan],
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => SITE_URL . '/pages/subscription.php?session_id={CHECKOUT_SESSION_ID}&success=true',
        'cancel_url' => SITE_URL . '/pages/subscription.php?canceled=true',
        'subscription_data' => [
            'metadata' => [
                'user_id' => (string)$userId,
                'plan_type' => $plan
            ]
        ],
        'allow_promotion_codes' => true,
        'billing_address_collection' => 'auto',
        'automatic_tax' => [
            'enabled' => false
        ],
        'customer_update' => [
            'address' => 'auto'
        ],
        'locale' => 'auto'
    ]);
    
    echo json_encode([
        'success' => true,
        'checkout_url' => $checkoutSession->url,
        'session_id' => $checkoutSession->id
    ]);
    */
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log('Stripe API error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Payment system error. Please try again later.'
    ]);
} catch (\Exception $e) {
    error_log('Subscription error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>