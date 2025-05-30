<?php
// php/api/subscription/stripe-webhook.php
// This file handles Stripe webhooks for subscription events

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../../vendor/autoload.php';

// Set Stripe API key
if (file_exists(__DIR__ . '/../../../.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../../');
    $dotenv->load();
}
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

// Get webhook payload and signature
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

try {
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent(
        $payload, 
        $sig_header, 
        STRIPE_WEBHOOK_SECRET
    );
} catch(\UnexpectedValueException $e) {
    // Invalid payload
    error_log('Stripe webhook error: Invalid payload');
    http_response_code(400);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature
    error_log('Stripe webhook error: Invalid signature');
    http_response_code(400);
    exit();
}

// Log the event type
error_log('Stripe webhook received: ' . $event->type);

// Handle the event
try {
    switch ($event->type) {
        case 'payment_intent.succeeded':
            $paymentIntent = $event->data->object;
            handlePaymentSuccess($paymentIntent);
            break;
            
        case 'payment_intent.payment_failed':
            $paymentIntent = $event->data->object;
            handlePaymentFailure($paymentIntent);
            break;
            
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            $subscription = $event->data->object;
            handleSubscriptionUpdate($subscription);
            break;
            
        case 'customer.subscription.deleted':
            $subscription = $event->data->object;
            handleSubscriptionCancellation($subscription);
            break;
            
        case 'invoice.payment_succeeded':
            $invoice = $event->data->object;
            handleInvoicePaymentSuccess($invoice);
            break;
            
        case 'invoice.payment_failed':
            $invoice = $event->data->object;
            handleInvoicePaymentFailed($invoice);
            break;
            
        default:
            // Unexpected event type
            error_log('Unhandled Stripe event type: ' . $event->type);
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode(['received' => true]);
    
} catch (Exception $e) {
    error_log('Stripe webhook processing error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Webhook processing failed']);
}

/**
 * Handle successful payment
 * @param object $paymentIntent
 */
function handlePaymentSuccess($paymentIntent) {
    global $conn;
    
    // Extract metadata
    $userId = $paymentIntent->metadata->user_id ?? null;
    $plan = $paymentIntent->metadata->plan ?? null;
    
    if (!$userId || !$plan) {
        error_log('Payment intent missing metadata: ' . $paymentIntent->id);
        return;
    }
    
    // Check if payment was already processed
    $checkQuery = "SELECT id FROM transactions WHERE reference_id = ? AND reference_type = 'subscription'";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute([$paymentIntent->id]);
    
    if ($stmt->rowCount() > 0) {
        // Already processed
        return;
    }
    
    // Update user subscription
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 month'));
    $updateQuery = "UPDATE users SET 
                   subscription_type = ?, 
                   subscription_expires = ?,
                   last_payment_intent = ?
                   WHERE id = ?";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$plan, $expiryDate, $paymentIntent->id, $userId]);
    
    // Record transaction
    $amount = $paymentIntent->amount; // Amount in cents
    $transactionDesc = "Subscription: " . ucfirst($plan) . " Plan (Webhook)";
    
    $insertTransaction = "INSERT INTO transactions 
                         (user_id, amount, description, transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'spend', ?, 'subscription')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([$userId, $amount, $transactionDesc, $paymentIntent->id]);
    
    error_log("Payment processed for user $userId: $paymentIntent->id");
}

/**
 * Handle failed payment
 * @param object $paymentIntent
 */
function handlePaymentFailure($paymentIntent) {
    global $conn;
    
    $userId = $paymentIntent->metadata->user_id ?? null;
    if (!$userId) return;
    
    // Send notification to user
    $notificationTitle = "Payment Failed";
    $notificationMessage = "Your subscription payment failed. Please update your payment method to continue your subscription.";
    
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$userId, $notificationTitle, $notificationMessage]);
    
    error_log("Payment failed for user $userId: $paymentIntent->id");
}

/**
 * Handle subscription update
 * @param object $subscription
 */
function handleSubscriptionUpdate($subscription) {
    global $conn;
    
    // Get user by Stripe customer ID
    $customerId = $subscription->customer;
    $getUserQuery = "SELECT id FROM users WHERE stripe_customer_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->execute([$customerId]);
    
    if ($stmt->rowCount() === 0) {
        error_log("No user found for Stripe customer: $customerId");
        return;
    }
    
    $user = $stmt->fetch();
    $userId = $user['id'];
    
    // Update subscription ID
    $updateQuery = "UPDATE users SET stripe_subscription_id = ? WHERE id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$subscription->id, $userId]);
    
    // If subscription is active, update expiry date
    if ($subscription->status === 'active') {
        $expiryDate = date('Y-m-d H:i:s', $subscription->current_period_end);
        $updateExpiryQuery = "UPDATE users SET subscription_expires = ? WHERE id = ?";
        $stmt = $conn->prepare($updateExpiryQuery);
        $stmt->execute([$expiryDate, $userId]);
    }
    
    error_log("Subscription updated for user $userId: $subscription->id");
}

/**
 * Handle subscription cancellation
 * @param object $subscription
 */
function handleSubscriptionCancellation($subscription) {
    global $conn;
    
    // Get user by Stripe customer ID
    $customerId = $subscription->customer;
    $getUserQuery = "SELECT id, username FROM users WHERE stripe_customer_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->execute([$customerId]);
    
    if ($stmt->rowCount() === 0) {
        return;
    }
    
    $user = $stmt->fetch();
    $userId = $user['id'];
    
    // Send cancellation notification
    $notificationTitle = "Subscription Cancelled";
    $notificationMessage = "Your subscription has been cancelled. You will retain access until " . 
                          date('F j, Y', $subscription->current_period_end);
    
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$userId, $notificationTitle, $notificationMessage]);
    
    // Record in subscription history
    $insertHistory = "INSERT INTO subscription_history 
                     (user_id, plan_name, action, price) 
                     VALUES (?, 'cancelled', 'cancel', 0)";
    $stmt = $conn->prepare($insertHistory);
    $stmt->execute([$userId]);
    
    error_log("Subscription cancelled for user $userId: $subscription->id");
}

/**
 * Handle successful invoice payment (for recurring subscriptions)
 * @param object $invoice
 */
function handleInvoicePaymentSuccess($invoice) {
    global $conn;
    
    // Skip if this is the first payment (already handled by payment_intent.succeeded)
    if ($invoice->billing_reason === 'subscription_create') {
        return;
    }
    
    // Get user by customer ID
    $customerId = $invoice->customer;
    $getUserQuery = "SELECT id, subscription_type FROM users WHERE stripe_customer_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->execute([$customerId]);
    
    if ($stmt->rowCount() === 0) {
        return;
    }
    
    $user = $stmt->fetch();
    $userId = $user['id'];
    $plan = $user['subscription_type'];
    
    // Extend subscription by 1 month
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 month'));
    $updateQuery = "UPDATE users SET subscription_expires = ? WHERE id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$expiryDate, $userId]);
    
    // Record transaction
    $amount = $invoice->amount_paid; // Amount in cents
    $transactionDesc = "Subscription Renewal: " . ucfirst($plan) . " Plan";
    
    $insertTransaction = "INSERT INTO transactions 
                         (user_id, amount, description, transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'spend', ?, 'subscription')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([$userId, $amount, $transactionDesc, $invoice->payment_intent]);
    
    // Send renewal notification
    $notificationTitle = "Subscription Renewed";
    $notificationMessage = "Your " . ucfirst($plan) . " subscription has been renewed for another month.";
    
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$userId, $notificationTitle, $notificationMessage]);
    
    error_log("Subscription renewed for user $userId: Invoice $invoice->id");
}

/**
 * Handle failed invoice payment
 * @param object $invoice
 */
function handleInvoicePaymentFailed($invoice) {
    global $conn;
    
    // Get user by customer ID
    $customerId = $invoice->customer;
    $getUserQuery = "SELECT id, email, username FROM users WHERE stripe_customer_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->execute([$customerId]);
    
    if ($stmt->rowCount() === 0) {
        return;
    }
    
    $user = $stmt->fetch();
    $userId = $user['id'];
    
    // Send payment failed notification
    $notificationTitle = "Subscription Payment Failed";
    $notificationMessage = "We couldn't process your subscription payment. Please update your payment method to avoid service interruption.";
    
    $insertNotification = "INSERT INTO notifications 
                          (user_id, type, title, message) 
                          VALUES (?, 'update', ?, ?)";
    $stmt = $conn->prepare($insertNotification);
    $stmt->execute([$userId, $notificationTitle, $notificationMessage]);
    
    // Send email notification
    $subject = "Habitus Zone - Payment Failed";
    $message = "Hi {$user['username']},\n\n";
    $message .= "We were unable to process your subscription payment.\n\n";
    $message .= "Please update your payment method at: " . SITE_URL . "/pages/subscription.php\n\n";
    $message .= "If you have any questions, please contact support.\n\n";
    $message .= "Best regards,\nHabitus Zone Team";
    
    $headers = "From: " . ADMIN_EMAIL . "\r\n";
    mail($user['email'], $subject, $message, $headers);
    
    error_log("Invoice payment failed for user $userId: Invoice $invoice->id");
}
?>