<?php
require_once 'vendor/autoload.php';

\Stripe\Stripe::setApiKey('sk_test_your_secret_key');
$stripe = new \Stripe\StripeClient('sk_test_your_secret_key');

// Price IDs from your Stripe Dashboard
const AD_FREE_PRICE_ID = 'price_your_ad_free_price_id';
const SUPPORTER_PRICE_ID = 'price_your_supporter_price_id';

function createSubscription($customerId, $priceId, $options = []) {
    global $stripe;
    
    try {
        $subscriptionData = [
            'customer' => $customerId,
            'items' => [['price' => $priceId]],
            'payment_behavior' => 'default_incomplete',
            'payment_settings' => [
                'save_default_payment_method' => 'on_subscription'
            ],
            'expand' => ['latest_invoice.payment_intent'],
        ];
        
        // Add trial period if specified
        if (isset($options['trial_period_days'])) {
            $subscriptionData['trial_period_days'] = $options['trial_period_days'];
        }
        
        // Add metadata for internal tracking
        if (isset($options['user_id'])) {
            $subscriptionData['metadata'] = [
                'habitus_user_id' => $options['user_id'],
                'subscription_tier' => $options['tier_name'] ?? 'unknown'
            ];
        }
        
        $subscription = $stripe->subscriptions->create($subscriptionData);
        
        return [
            'subscription' => $subscription,
            'client_secret' => $subscription->latest_invoice->payment_intent->client_secret ?? null
        ];
        
    } catch (\Stripe\Exception\InvalidRequestException $e) {
        throw new Exception('Subscription creation failed: ' . $e->getError()->message);
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $result = createSubscription(
            $input['customer_id'],
            $input['price_id'],
            [
                'trial_period_days' => $input['trial_days'] ?? null,
                'user_id' => $input['user_id'],
                'tier_name' => $input['tier_name']
            ]
        );
        
        echo json_encode(['success' => true, 'data' => $result]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>