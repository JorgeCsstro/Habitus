<?php
// php/api/subscription/stripe-webhook.php - Complete webhook handler

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../../vendor/autoload.php';

// Set raw response for Stripe
http_response_code(200);

// Initialize Stripe
\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

// Get the webhook payload and signature
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpoint_secret = STRIPE_WEBHOOK_SECRET;

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
 * Handle invoice payment succeeded - This is the key event for subscription activation
 */
function handleInvoicePaymentSucceeded($invoice) {
    global $conn;
    
    // Only process subscription invoices
    if (!$invoice->subscription) {
        return;
    }
    
    try {
        // Get subscription details
        $subscription = \Stripe\Subscription::retrieve($invoice->subscription);
        
        // Get user ID from subscription metadata
        $userId = $subscription->metadata->user_id ?? null;
        $planType = $subscription->metadata->plan_id ?? 'adfree';
        
        if (!$userId) {
            // Try to get user ID from customer
            $customer = \Stripe\Customer::retrieve($subscription->customer);
            $userId = $customer->metadata->user_id ?? null;
            
            if (!$userId) {
                // Try to get from database by customer ID
                $stmt = $conn->prepare("SELECT id FROM users WHERE stripe_customer_id = ?");
                $stmt->execute([$subscription->customer]);
                $user = $stmt->fetch();
                $userId = $user['id'] ?? null;
            }
        }
        
        if (!$userId) {
            error_log('No user ID found for subscription: ' . $subscription->id);
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
        $stmt->execute([$planType, $expiresAt, $subscription->id, $userId]);
        
        // Log the successful payment
        logSubscriptionEvent($userId, 'payment_success', $planType, $invoice->amount_paid / 100);
        
        // Send confirmation notification
        sendSubscriptionNotification($userId, 'subscription_activated', $planType);
        
        error_log("Subscription activated for user $userId: $planType until $expiresAt");
        
    } catch (Exception $e) {
        error_log('Failed to handle invoice payment succeeded: ' . $e->getMessage());
    }
}

/**
 * Handle subscription created
 */
function handleSubscriptionCreated($subscription) {
    error_log('Subscription created: ' . $subscription->id);
    // The actual activation happens in invoice.payment_succeeded
}

/**
 * Handle subscription updated
 */
function handleSubscriptionUpdated($subscription) {
    global $conn;
    
    $userId = $subscription->metadata->user_id ?? null;
    if (!$userId) {
        // Try to get from database
        $stmt = $conn->prepare("SELECT id FROM users WHERE stripe_subscription_id = ?");
        $stmt->execute([$subscription->id]);
        $user = $stmt->fetch();
        $userId = $user['id'] ?? null;
    }
    
    if (!$userId) return;
    
    $planType = $subscription->metadata->plan_id ?? 'adfree';
    $status = $subscription->status;
    
    if ($status === 'active') {
        $expiresAt = date('Y-m-d H:i:s', $subscription->current_period_end);
        
        $updateQuery = "UPDATE users SET 
                        subscription_type = ?,
                        subscription_expires = ?
                        WHERE id = ?";
        
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$planType, $expiresAt, $userId]);
    } elseif ($status === 'canceled') {
        // Don't immediately cancel - let them use until expiry
        logSubscriptionEvent($userId, 'cancelled', $planType, 0);
    }
}

/**
 * Handle subscription deleted (cancelled)
 */
function handleSubscriptionDeleted($subscription) {
    global $conn;
    
    $userId = $subscription->metadata->user_id ?? null;
    if (!$userId) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE stripe_subscription_id = ?");
        $stmt->execute([$subscription->id]);
        $user = $stmt->fetch();
        $userId = $user['id'] ?? null;
    }
    
    if (!$userId) return;
    
    // Update to free plan
    $updateQuery = "UPDATE users SET 
                    subscription_type = 'free',
                    subscription_expires = NULL
                    WHERE id = ?";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([$userId]);
    
    logSubscriptionEvent($userId, 'cancelled', 'free', 0);
    sendSubscriptionNotification($userId, 'subscription_cancelled');
}

/**
 * Handle failed invoice payment
 */
function handleInvoicePaymentFailed($invoice) {
    global $conn;
    
    if (!$invoice->subscription) return;
    
    $subscription = \Stripe\Subscription::retrieve($invoice->subscription);
    $userId = $subscription->metadata->user_id ?? null;
    
    if (!$userId) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE stripe_subscription_id = ?");
        $stmt->execute([$subscription->id]);
        $user = $stmt->fetch();
        $userId = $user['id'] ?? null;
    }
    
    if ($userId) {
        sendSubscriptionNotification($userId, 'payment_failed');
        logSubscriptionEvent($userId, 'payment_failed', null, 0);
    }
}

/**
 * Handle completed checkout session
 */
function handleCheckoutSessionCompleted($session) {
    // This is handled by invoice.payment_succeeded for subscriptions
    error_log('Checkout session completed: ' . $session->id);
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
        'subscription_activated' => 'Welcome to ' . ucfirst($planType) . '! Your subscription is now active.',
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