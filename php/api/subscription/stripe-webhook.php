<?php
// php/api/subscription/stripe-webhook.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../../vendor/autoload.php';

// Set raw response for Stripe
http_response_code(200);

// Initialize Stripe
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);
\Stripe\Stripe::setApiVersion($_ENV['STRIPE_API_VERSION']);

// Get the webhook payload and signature
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpoint_secret = $_ENV['STRIPE_WEBHOOK_SECRET'];

$event = null;

try {
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );
} catch(\UnexpectedValueException $e) {
    // Invalid payload
    error_log('Webhook error: Invalid payload');
    http_response_code(400);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature
    error_log('Webhook error: Invalid signature');
    http_response_code(400);
    exit();
}

// Log the event type
error_log('Stripe webhook received: ' . $event->type);

// Handle the event
try {
    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            handleCheckoutSessionCompleted($session);
            break;
            
        case 'customer.subscription.created':
            $subscription = $event->data->object;
            handleSubscriptionCreated($subscription);
            break;
            
        case 'customer.subscription.updated':
            $subscription = $event->data->object;
            handleSubscriptionUpdated($subscription);
            break;
            
        case 'customer.subscription.deleted':
            $subscription = $event->data->object;
            handleSubscriptionDeleted($subscription);
            break;
            
        case 'invoice.payment_succeeded':
            $invoice = $event->data->object;
            handleInvoicePaymentSucceeded($invoice);
            break;
            
        case 'invoice.payment_failed':
            $invoice = $event->data->object;
            handleInvoicePaymentFailed($invoice);
            break;
            
        default:
            error_log('Unhandled event type: ' . $event->type);
    }
} catch (Exception $e) {
    error_log('Webhook processing error: ' . $e->getMessage());
    http_response_code(500);
    exit();
}

// Return 200 OK
http_response_code(200);

/**
 * Handle completed checkout session
 */
function handleCheckoutSessionCompleted($session) {
    global $conn;
    
    // Get subscription details
    $subscriptionId = $session->subscription;
    $customerId = $session->customer;
    
    // Retrieve the subscription
    $subscription = \Stripe\Subscription::retrieve($subscriptionId);
    
    // Get user ID from metadata
    $userId = $subscription->metadata->user_id ?? null;
    $planType = $subscription->metadata->plan_type ?? 'adfree';
    
    if (!$userId) {
        // Try to get user ID from customer
        $customer = \Stripe\Customer::retrieve($customerId);
        $userId = $customer->metadata->user_id ?? null;
    }
    
    if (!$userId) {
        error_log('No user ID found in webhook data');
        return;
    }
    
    // Update user subscription in database
    $expiresAt = date('Y-m-d H:i:s', $subscription->current_period_end);
    
    $updateQuery = "UPDATE users SET 
                    subscription_type = ?,
                    subscription_expires = ?,
                    stripe_subscription_id = ?
                    WHERE id = ?";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$planType, $expiresAt, $subscriptionId, $userId]);
    
    // Log the subscription
    logSubscriptionEvent($userId, 'created', $planType, $session->amount_total / 100);
    
    // Send confirmation notification
    sendSubscriptionNotification($userId, 'subscription_created', $planType);
}

/**
 * Handle subscription created
 */
function handleSubscriptionCreated($subscription) {
    // Already handled in checkout.session.completed
    error_log('Subscription created: ' . $subscription->id);
}

/**
 * Handle subscription updated
 */
function handleSubscriptionUpdated($subscription) {
    global $conn;
    
    $userId = $subscription->metadata->user_id ?? null;
    if (!$userId) return;
    
    $status = $subscription->status;
    $planType = $subscription->metadata->plan_type ?? 'adfree';
    
    if ($status === 'active') {
        $expiresAt = date('Y-m-d H:i:s', $subscription->current_period_end);
        
        $updateQuery = "UPDATE users SET 
                        subscription_type = ?,
                        subscription_expires = ?
                        WHERE id = ?";
        
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$planType, $expiresAt, $userId]);
    }
}

/**
 * Handle subscription deleted (cancelled)
 */
function handleSubscriptionDeleted($subscription) {
    global $conn;
    
    $userId = $subscription->metadata->user_id ?? null;
    if (!$userId) return;
    
    // Don't immediately remove access - they have until expiry
    logSubscriptionEvent($userId, 'cancelled', 'free', 0);
    
    // Send cancellation notification
    sendSubscriptionNotification($userId, 'subscription_cancelled');
}

/**
 * Handle successful invoice payment
 */
function handleInvoicePaymentSucceeded($invoice) {
    global $conn;
    
    // Get subscription
    $subscriptionId = $invoice->subscription;
    if (!$subscriptionId) return;
    
    $subscription = \Stripe\Subscription::retrieve($subscriptionId);
    $userId = $subscription->metadata->user_id ?? null;
    
    if (!$userId) return;
    
    // Update subscription expiry
    $expiresAt = date('Y-m-d H:i:s', $subscription->current_period_end);
    
    $updateQuery = "UPDATE users SET subscription_expires = ? WHERE id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$expiresAt, $userId]);
    
    // Log payment
    $amount = $invoice->amount_paid / 100;
    logSubscriptionEvent($userId, 'payment_success', null, $amount);
}

/**
 * Handle failed invoice payment
 */
function handleInvoicePaymentFailed($invoice) {
    global $conn;
    
    $customerId = $invoice->customer;
    
    // Get user by customer ID
    $query = "SELECT id FROM users WHERE stripe_customer_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute([$customerId]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();
        $userId = $user['id'];
        
        // Send payment failed notification
        sendSubscriptionNotification($userId, 'payment_failed');
        
        // Log the failure
        logSubscriptionEvent($userId, 'payment_failed', null, 0);
    }
}

/**
 * Log subscription events
 */
function logSubscriptionEvent($userId, $event, $planType = null, $amount = 0) {
    global $conn;
    
    try {
        $insertQuery = "INSERT INTO subscription_history 
                       (user_id, event_type, plan_type, amount, created_at) 
                       VALUES (?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($insertQuery);
        $stmt->execute([$userId, $event, $planType, $amount]);
    } catch (Exception $e) {
        error_log('Failed to log subscription event: ' . $e->getMessage());
    }
}

/**
 * Send subscription notifications
 */
function sendSubscriptionNotification($userId, $type, $planType = null) {
    global $conn;
    
    $messages = [
        'subscription_created' => 'Welcome to ' . ucfirst($planType) . '! Your subscription is now active.',
        'subscription_cancelled' => 'Your subscription has been cancelled. You will retain access until the end of your billing period.',
        'payment_failed' => 'We were unable to process your payment. Please update your payment method.'
    ];
    
    $message = $messages[$type] ?? 'Subscription status updated.';
    
    try {
        $insertQuery = "INSERT INTO notifications 
                       (user_id, type, title, message, created_at) 
                       VALUES (?, 'update', 'Subscription Update', ?, NOW())";
        
        $stmt = $conn->prepare($insertQuery);
        $stmt->execute([$userId, $message]);
    } catch (Exception $e) {
        error_log('Failed to send notification: ' . $e->getMessage());
    }
}
?>