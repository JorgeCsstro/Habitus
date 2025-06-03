<?php
require_once 'vendor/autoload.php';

class SubscriptionManager {
    private $stripe;
    private $pdo;
    
    public function __construct($apiKey, $pdo) {
        $this->stripe = new \Stripe\StripeClient($apiKey);
        $this->pdo = $pdo;
    }
    
    public function upgradeSubscription($subscriptionId, $newPriceId) {
        try {
            $subscription = $this->stripe->subscriptions->retrieve($subscriptionId);
            
            $updatedSubscription = $this->stripe->subscriptions->update($subscriptionId, [
                'items' => [[
                    'id' => $subscription->items->data[0]->id,
                    'price' => $newPriceId,
                ]],
                'proration_behavior' => 'always_invoice',
            ]);
            
            $this->updateLocalSubscription($updatedSubscription);
            return $updatedSubscription;
            
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            throw new Exception('Upgrade failed: ' . $e->getError()->message);
        }
    }
    
    public function cancelSubscription($subscriptionId, $atPeriodEnd = true) {
        try {
            if ($atPeriodEnd) {
                $subscription = $this->stripe->subscriptions->update($subscriptionId, [
                    'cancel_at_period_end' => true,
                ]);
            } else {
                $subscription = $this->stripe->subscriptions->cancel($subscriptionId);
            }
            
            $this->updateLocalSubscription($subscription);
            return $subscription;
            
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            throw new Exception('Cancellation failed: ' . $e->getError()->message);
        }
    }
    
    private function updateLocalSubscription($stripeSubscription) {
        $stmt = $this->pdo->prepare("
            UPDATE user_subscriptions 
            SET 
                status = ?,
                current_period_start = ?,
                current_period_end = ?,
                cancel_at_period_end = ?,
                updated_at = NOW()
            WHERE stripe_subscription_id = ?
        ");
        
        $stmt->execute([
            $stripeSubscription->status,
            date('Y-m-d H:i:s', $stripeSubscription->current_period_start),
            date('Y-m-d H:i:s', $stripeSubscription->current_period_end),
            $stripeSubscription->cancel_at_period_end ? 1 : 0,
            $stripeSubscription->id
        ]);
    }
}
?>