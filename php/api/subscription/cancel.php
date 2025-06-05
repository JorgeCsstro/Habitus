<?php
// php/api/subscription/cancel.php

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
    
    if (empty($userData['stripe_subscription_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'No active subscription found'
        ]);
        exit;
    }
    
    // Retrieve the subscription
    $subscription = \Stripe\Subscription::retrieve($userData['stripe_subscription_id']);
    
    // Cancel at period end (user keeps access until expiry)
    $subscription->cancel_at_period_end = true;
    $subscription->save();
    
    // Get the expiry date
    $expiresDate = date('F j, Y', $subscription->current_period_end);
    
    // Log the cancellation
    $insertQuery = "INSERT INTO subscription_history 
                   (user_id, event_type, plan_type, amount, created_at) 
                   VALUES (?, 'cancelled', ?, 0, NOW())";
    $stmt = $conn->prepare($insertQuery);
    $stmt->execute([$_SESSION['user_id'], $userData['subscription_type']]);
    
    // Send notification
    $notificationMessage = "Your subscription has been cancelled. You will retain access until $expiresDate.";
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message, created_at) 
                          VALUES (?, 'update', 'Subscription Cancelled', ?, NOW())";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$_SESSION['user_id'], $notificationMessage]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Subscription cancelled successfully',
        'expires_date' => $expiresDate
    ]);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log('Stripe API error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Unable to cancel subscription. Please try again.'
    ]);
} catch (\Exception $e) {
    error_log('General error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again.'
    ]);
}
?>