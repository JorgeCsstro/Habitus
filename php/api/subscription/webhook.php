<?php
require_once 'vendor/autoload.php';

\Stripe\Stripe::setApiKey('sk_test_your_secret_key');
$endpoint_secret = 'whsec_your_webhook_secret';

$payload = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];

try {
    $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    error_log('Webhook signature verification failed: ' . $e->getMessage());
    exit();
}

// Prevent duplicate processing
$event_id = $event['id'];
if (isEventProcessed($event_id)) {
    http_response_code(200);
    exit();
}

markEventAsProcessing($event_id);

try {
    switch ($event['type']) {
        case 'invoice.payment_succeeded':
            handlePaymentSucceeded($event['data']['object']);
            break;
            
        case 'invoice.payment_failed':
            handlePaymentFailed($event['data']['object']);
            break;
            
        case 'customer.subscription.updated':
            handleSubscriptionUpdated($event['data']['object']);
            break;
            
        case 'customer.subscription.deleted':
            handleSubscriptionCanceled($event['data']['object']);
            break;
            
        default:
            error_log('Unhandled webhook event: ' . $event['type']);
    }
    
    markEventAsCompleted($event_id);
    
} catch (Exception $e) {
    markEventAsFailed($event_id, $e->getMessage());
    http_response_code(500);
    exit();
}

http_response_code(200);

function handlePaymentSucceeded($invoice) {
    if (!$invoice['subscription']) return;
    
    $subscription_id = $invoice['subscription'];
    $customer_id = $invoice['customer'];
    
    // Update user's subscription status and HCoins
    $pdo = getDatabaseConnection();
    
    // Activate subscription
    $stmt = $pdo->prepare("
        UPDATE user_subscriptions 
        SET status = 'active', last_payment_date = NOW()
        WHERE stripe_subscription_id = ?
    ");
    $stmt->execute([$subscription_id]);
    
    // Award bonus HCoins for successful payment
    if ($invoice['billing_reason'] === 'subscription_cycle') {
        awardBonusHCoins($customer_id, 50); // 50 HCoins for renewal
    }
    
    // Remove ads and enable premium features
    enablePremiumFeatures($customer_id);
}

function handlePaymentFailed($invoice) {
    $subscription_id = $invoice['subscription'];
    $attempt_count = $invoice['attempt_count'];
    
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("
        UPDATE user_subscriptions 
        SET status = 'past_due', payment_failed_count = ?
        WHERE stripe_subscription_id = ?
    ");
    $stmt->execute([$attempt_count, $subscription_id]);
    
    // Send payment failure notification
    if ($attempt_count === 1) {
        sendPaymentFailureEmail($invoice['customer'], 'first_attempt');
    } elseif ($attempt_count >= 3) {
        // Suspend premium features but keep basic account
        suspendPremiumFeatures($invoice['customer']);
        sendPaymentFailureEmail($invoice['customer'], 'final_attempt');
    }
}
?>