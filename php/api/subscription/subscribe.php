<?php
// php/api/subscription/subscribe.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['plan'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$plan = $data['plan'];
$paymentToken = $data['payment_token'] ?? '';

// Validate plan
if (!in_array($plan, ['adfree', 'premium'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid subscription plan']);
    exit;
}

// In a real implementation, you would:
// 1. Process payment with Stripe/PayPal using the payment token
// 2. Create subscription with payment provider
// 3. Store subscription ID for future reference

// For this demo, we'll simulate successful payment
try {
    $conn->beginTransaction();
    
    // Calculate subscription expiry (1 month from now)
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 month'));
    
    // Update user subscription
    $updateQuery = "UPDATE users SET 
                   subscription_type = ?, 
                   subscription_expires = ? 
                   WHERE id = ?";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$plan, $expiryDate, $_SESSION['user_id']]);
    
    // Insert subscription plan if it doesn't exist
    $planPrices = [
        'adfree' => 1.00,
        'premium' => 5.00
    ];
    
    // Check if plan exists in subscription_plans table
    $checkPlanQuery = "SELECT id FROM subscription_plans WHERE name = ?";
    $stmt = $conn->prepare($checkPlanQuery);
    $stmt->execute([$plan]);
    
    if ($stmt->rowCount() === 0) {
        // Insert plan
        $benefits = $plan === 'premium' 
            ? 'No ADs, Exclusive items and new QQLs features'
            : 'No ADs';
            
        $insertPlanQuery = "INSERT INTO subscription_plans 
                           (name, price, duration, benefits) 
                           VALUES (?, ?, 30, ?)";
        $stmt = $conn->prepare($insertPlanQuery);
        $stmt->execute([
            $plan, 
            $planPrices[$plan], 
            $benefits
        ]);
    }
    
    // Record transaction
    $transactionDesc = "Subscription: " . ucfirst($plan) . " Plan";
    $insertTransaction = "INSERT INTO transactions 
                         (user_id, amount, description, transaction_type, reference_type) 
                         VALUES (?, ?, ?, 'spend', 'subscription')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([
        $_SESSION['user_id'], 
        $planPrices[$plan] * 100, // Store in cents
        $transactionDesc
    ]);
    
    // Send welcome notification
    $notificationTitle = "Welcome to " . ucfirst($plan) . "!";
    $notificationMessage = $plan === 'premium' 
        ? "Thank you for going Premium! Exclusive features and items await you."
        : "Thank you for subscribing! Enjoy your ad-free experience.";
        
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$_SESSION['user_id'], $notificationTitle, $notificationMessage]);
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Subscription activated successfully!',
        'expires_date' => date('F j, Y', strtotime($expiryDate))
    ]);
    
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode([
        'success' => false,
        'message' => 'Error processing subscription: ' . $e->getMessage()
    ]);
}