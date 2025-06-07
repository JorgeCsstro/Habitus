<?php
// php/api/subscription/verify-subscription.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get payment intent ID
$paymentIntentId = $_GET['payment_intent'] ?? '';

if (empty($paymentIntentId)) {
    echo json_encode(['success' => false, 'message' => 'Payment intent ID required']);
    exit;
}

try {
    // Get user's current subscription status
    $userData = getUserData($_SESSION['user_id']);
    
    // Check if subscription is active
    $isActive = false;
    if ($userData['subscription_expires']) {
        $expiryDate = new DateTime($userData['subscription_expires']);
        $now = new DateTime();
        $isActive = $expiryDate > $now;
    }
    
    echo json_encode([
        'success' => true,
        'status' => $isActive ? 'active' : 'inactive',
        'subscription_type' => $userData['subscription_type'],
        'expires_at' => $userData['subscription_expires']
    ]);
    
} catch (Exception $e) {
    error_log('Verify subscription error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Unable to verify subscription status'
    ]);
}
?>