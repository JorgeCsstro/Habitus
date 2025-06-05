<?php
// php/api/subscription/create-checkout-session.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../../vendor/autoload.php';

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Initialize Stripe
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);
\Stripe\Stripe::setApiVersion($_ENV['STRIPE_API_VERSION']);

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['plan'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid plan selection']);
    exit;
}

$plan = $data['plan'];
$userId = $_SESSION['user_id'];

// Map plan to price ID
$priceMapping = [
    'adfree' => $_ENV['STRIPE_PRICE_ADFREE_MONTHLY'],
    'premium' => $_ENV['STRIPE_PRICE_SUPPORTER_MONTHLY']
];

if (!isset($priceMapping[$plan])) {
    echo json_encode(['success' => false, 'message' => 'Invalid plan type']);
    exit;
}

try {
    // Get user data
    $userData = getUserData($userId);
    
    // Create or retrieve Stripe customer
    $stripeCustomer = null;
    
    if (!empty($userData['stripe_customer_id'])) {
        // Retrieve existing customer
        try {
            $stripeCustomer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
        } catch (\Exception $e) {
            // Customer doesn't exist, create new one
            $stripeCustomer = null;
        }
    }
    
    if (!$stripeCustomer) {
        // Create new Stripe customer
        $stripeCustomer = \Stripe\Customer::create([
            'email' => $userData['email'],
            'name' => $userData['username'],
            'metadata' => [
                'user_id' => $userId,
                'username' => $userData['username']
            ]
        ]);
        
        // Save Stripe customer ID to database
        $updateQuery = "UPDATE users SET stripe_customer_id = ? WHERE id = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$stripeCustomer->id, $userId]);
    }
    
    // Create Stripe Checkout Session
    $checkoutSession = \Stripe\Checkout\Session::create([
        'customer' => $stripeCustomer->id,
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => $priceMapping[$plan],
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => $_ENV['SITE_URL'] . '/pages/subscription.php?session_id={CHECKOUT_SESSION_ID}&success=true',
        'cancel_url' => $_ENV['SITE_URL'] . '/pages/subscription.php?canceled=true',
        'subscription_data' => [
            'metadata' => [
                'user_id' => $userId,
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
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log('Stripe API error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Payment system error: ' . $e->getMessage()
    ]);
} catch (\Exception $e) {
    error_log('General error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>