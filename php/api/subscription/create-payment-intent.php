<?php
// php/api/subscription/create-payment-intent.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../../vendor/autoload.php'; // Stripe PHP library

// Set Stripe API key
if (file_exists(__DIR__ . '/../../../.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../../');
    $dotenv->load();
}
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

// Enable CORS if needed
header('Content-Type: application/json');

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['plan'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid plan']);
    exit;
}

$plan = $data['plan'];

// Validate plan and get prices (in cents)
$planPrices = [
    'adfree' => 100,   // €1.00
    'premium' => 500   // €5.00
];

if (!isset($planPrices[$plan])) {
    echo json_encode(['success' => false, 'message' => 'Invalid subscription plan']);
    exit;
}

try {
    // Get user data
    $userData = getUserData($_SESSION['user_id']);
    
    // Create or retrieve Stripe customer
    $stripeCustomer = null;
    
    // Check if user already has a Stripe customer ID
    if (!empty($userData['stripe_customer_id'])) {
        try {
            // Retrieve existing customer
            $stripeCustomer = \Stripe\Customer::retrieve($userData['stripe_customer_id']);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Customer doesn't exist, create new one
            $stripeCustomer = null;
        }
    }
    
    // Create new customer if needed
    if (!$stripeCustomer) {
        $stripeCustomer = \Stripe\Customer::create([
            'email' => $userData['email'],
            'name' => $userData['username'],
            'metadata' => [
                'user_id' => $_SESSION['user_id'],
                'username' => $userData['username']
            ]
        ]);
        
        // Save Stripe customer ID to database
        $updateQuery = "UPDATE users SET stripe_customer_id = ? WHERE id = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$stripeCustomer->id, $_SESSION['user_id']]);
    }
    
    // Create payment intent with automatic payment methods
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $planPrices[$plan],
        'currency' => 'eur',
        'customer' => $stripeCustomer->id,
        'automatic_payment_methods' => [
            'enabled' => true,
            'allow_redirects' => 'if_required'
        ],
        'metadata' => [
            'user_id' => $_SESSION['user_id'],
            'plan' => $plan,
            'username' => $userData['username']
        ],
        'description' => 'Habitus Zone ' . ucfirst($plan) . ' Subscription - ' . $userData['username'],
        'receipt_email' => $userData['email']
    ]);
    
    // Log the payment intent creation
    error_log("Payment intent created: " . $paymentIntent->id . " for user: " . $_SESSION['user_id']);
    
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'paymentIntentId' => $paymentIntent->id
    ]);
    
} catch (\Stripe\Exception\CardException $e) {
    // Card was declined
    echo json_encode([
        'success' => false,
        'message' => 'Card declined: ' . $e->getError()->message
    ]);
} catch (\Stripe\Exception\RateLimitException $e) {
    // Too many requests made to the API too quickly
    echo json_encode([
        'success' => false,
        'message' => 'Too many requests. Please try again in a moment.'
    ]);
} catch (\Stripe\Exception\InvalidRequestException $e) {
    // Invalid parameters were supplied to Stripe's API
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request: ' . $e->getMessage()
    ]);
} catch (\Stripe\Exception\AuthenticationException $e) {
    // Authentication with Stripe's API failed
    error_log("Stripe authentication failed: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Authentication failed. Please contact support.'
    ]);
} catch (\Stripe\Exception\ApiConnectionException $e) {
    // Network communication with Stripe failed
    echo json_encode([
        'success' => false,
        'message' => 'Network error. Please check your connection and try again.'
    ]);
} catch (\Stripe\Exception\ApiErrorException $e) {
    // Generic Stripe API error
    error_log("Stripe API error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Payment service error. Please try again later.'
    ]);
} catch (Exception $e) {
    // Other errors
    error_log("Payment intent creation error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again.'
    ]);
}
?>