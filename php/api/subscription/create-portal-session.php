<?php
// php/api/subscription/create-portal-session.php

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

try {
    // Get user data
    $userData = getUserData($_SESSION['user_id']);
    
    if (empty($userData['stripe_customer_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'No active subscription found'
        ]);
        exit;
    }
    
    // Create a portal session
    $session = \Stripe\BillingPortal\Session::create([
        'customer' => $userData['stripe_customer_id'],
        'return_url' => $_ENV['SITE_URL'] . '/pages/subscription.php?portal=success',
    ]);
    
    echo json_encode([
        'success' => true,
        'url' => $session->url
    ]);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log('Stripe API error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Unable to create portal session'
    ]);
} catch (\Exception $e) {
    error_log('General error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred'
    ]);
}
?>