<?php
// php/api/subscription/activate-subscription.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';
require_once '../../../vendor/autoload.php';

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

if (!$data || !isset($data['plan']) || !isset($data['payment_intent_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request data']);
    exit;
}

$plan = $data['plan'];
$paymentIntentId = $data['payment_intent_id'];

// Validate plan
if (!in_array($plan, ['adfree', 'premium'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid subscription plan']);
    exit;
}

try {
    // Verify payment intent
    $paymentIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);
    
    // Verify payment was successful
    if ($paymentIntent->status !== 'succeeded') {
        throw new Exception('Payment not completed');
    }
    
    // Verify payment intent belongs to this user
    if ($paymentIntent->metadata->user_id != $_SESSION['user_id']) {
        throw new Exception('Payment verification failed');
    }
    
    // Begin database transaction
    $conn->beginTransaction();
    
    // Calculate subscription expiry (1 month from now)
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 month'));
    
    // Update user subscription
    $updateQuery = "UPDATE users SET 
                   subscription_type = ?, 
                   subscription_expires = ?,
                   last_payment_intent = ?
                   WHERE id = ?";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$plan, $expiryDate, $paymentIntentId, $_SESSION['user_id']]);
    
    // Get plan price for transaction record
    $planPrices = [
        'adfree' => 1.00,
        'premium' => 5.00
    ];
    
    // Record transaction
    $transactionDesc = "Subscription: " . ucfirst($plan) . " Plan (1 month)";
    $insertTransaction = "INSERT INTO transactions 
                         (user_id, amount, description, transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'spend', ?, 'subscription')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([
        $_SESSION['user_id'], 
        $planPrices[$plan] * 100, // Convert to cents for consistency
        $transactionDesc,
        $paymentIntentId
    ]);
    
    // Record subscription history
    $insertHistory = "INSERT INTO subscription_history 
                     (user_id, plan_name, action, price, payment_intent_id) 
                     VALUES (?, ?, 'subscribe', ?, ?)";
    $stmt = $conn->prepare($insertHistory);
    $stmt->execute([
        $_SESSION['user_id'],
        $plan,
        $planPrices[$plan],
        $paymentIntentId
    ]);
    
    // Send welcome notification
    $notificationTitle = "Welcome to " . ucfirst($plan) . "!";
    $notificationMessage = $plan === 'premium' 
        ? "Thank you for going Premium! Enjoy exclusive features, items, and an ad-free experience."
        : "Thank you for subscribing! Enjoy your ad-free experience.";
        
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$_SESSION['user_id'], $notificationTitle, $notificationMessage]);
    
    // If user upgraded from ad-free to premium, send special notification
    $userData = getUserData($_SESSION['user_id']);
    if ($userData['subscription_type'] === 'adfree' && $plan === 'premium') {
        $upgradeNotification = "INSERT INTO notifications 
                               (user_id, type, title, message) 
                               VALUES (?, 'update', 'Premium Upgrade Complete!', 
                               'You now have access to exclusive premium items and features!')";
        $stmt = $conn->prepare($upgradeNotification);
        $stmt->execute([$_SESSION['user_id']]);
    }
    
    // Commit transaction
    $conn->commit();
    
    // Send confirmation email (optional)
    sendSubscriptionConfirmationEmail($_SESSION['user_id'], $plan, $expiryDate);
    
    echo json_encode([
        'success' => true,
        'message' => 'Subscription activated successfully!',
        'plan' => $plan,
        'expires_date' => date('F j, Y', strtotime($expiryDate))
    ]);
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    // Rollback database transaction
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    error_log("Stripe error during activation: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Payment verification failed. Please contact support.'
    ]);
} catch (Exception $e) {
    // Rollback database transaction
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    error_log("Subscription activation error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to activate subscription. Please contact support.'
    ]);
}

/**
 * Send subscription confirmation email
 * @param int $userId
 * @param string $plan
 * @param string $expiryDate
 */
function sendSubscriptionConfirmationEmail($userId, $plan, $expiryDate) {
    global $conn;
    
    try {
        // Get user data
        $userData = getUserData($userId);
        
        $subject = "Habitus Zone - Subscription Confirmation";
        $planName = ucfirst($plan) . " Plan";
        $price = $plan === 'premium' ? '€5.00' : '€1.00';
        
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #8d5b4c; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f5f0; }
                .footer { text-align: center; padding: 10px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Subscription Confirmed!</h1>
                </div>
                <div class='content'>
                    <p>Hi {$userData['username']},</p>
                    <p>Thank you for subscribing to Habitus Zone!</p>
                    <h3>Subscription Details:</h3>
                    <ul>
                        <li><strong>Plan:</strong> {$planName}</li>
                        <li><strong>Price:</strong> {$price}/month</li>
                        <li><strong>Valid Until:</strong> " . date('F j, Y', strtotime($expiryDate)) . "</li>
                    </ul>
                    <p>Your subscription will automatically renew unless cancelled.</p>
                    <p>You can manage your subscription anytime from your account settings.</p>
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " Habitus Zone. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Set headers for HTML email
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: " . ADMIN_EMAIL . "\r\n";
        
        // Send email
        mail($userData['email'], $subject, $message, $headers);
        
    } catch (Exception $e) {
        // Log error but don't fail the activation
        error_log("Failed to send subscription email: " . $e->getMessage());
    }
}
?>