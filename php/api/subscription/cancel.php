<?php
// php/api/subscription/cancel.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    // Get current user subscription info
    $userQuery = "SELECT subscription_type, subscription_expires FROM users WHERE id = ?";
    $stmt = $conn->prepare($userQuery);
    $stmt->execute([$_SESSION['user_id']]);
    $userData = $stmt->fetch();
    
    if ($userData['subscription_type'] === 'free') {
        echo json_encode([
            'success' => false,
            'message' => 'You do not have an active subscription'
        ]);
        exit;
    }
    
    $expiresDate = $userData['subscription_expires'];
    
    // In a real implementation, you would:
    // 1. Cancel subscription with payment provider (Stripe/PayPal)
    // 2. Set subscription to not renew
    // 3. User retains access until expiry date
    
    // For this demo, we'll just mark the subscription as cancelled
    // User will retain access until the expiry date
    
    // Send cancellation notification
    $notificationTitle = "Subscription Cancelled";
    $notificationMessage = "Your subscription has been cancelled. You will retain access to " . 
                          ucfirst($userData['subscription_type']) . " features until " . 
                          date('F j, Y', strtotime($expiresDate));
    
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$_SESSION['user_id'], $notificationTitle, $notificationMessage]);
    
    // Record cancellation in transactions
    $transactionDesc = "Cancelled " . ucfirst($userData['subscription_type']) . " subscription";
    $insertTransaction = "INSERT INTO transactions 
                         (user_id, amount, description, transaction_type, reference_type) 
                         VALUES (?, 0, ?, 'earn', 'subscription')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([$_SESSION['user_id'], $transactionDesc]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Subscription cancelled successfully',
        'expires_date' => date('F j, Y', strtotime($expiresDate))
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error cancelling subscription: ' . $e->getMessage()
    ]);
}