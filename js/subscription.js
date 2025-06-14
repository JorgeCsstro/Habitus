// File: subscription.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key'); 

class SubscriptionManager {
    constructor() {
        this.stripe = null;
        this.init();
    }
    
    async init() {
        this.stripe = await stripePromise;
    }
    
    async createSubscription(userId, tierName) {
        const priceIds = {
            'ad_free': 'price_your_ad_free_price_id',
            'supporter': 'price_your_supporter_price_id'
        };
        
        try {
            // Create customer and subscription on backend
            const response = await fetch('/api/create-subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    price_id: priceIds[tierName],
                    tier_name: tierName,
                    trial_days: tierName === 'supporter' ? 7 : null // 7-day trial for Supporter
                })
            });
            
            const { success, data, error } = await response.json();
            
            if (!success) {
                throw new Error(error);
            }
            
            // Handle payment confirmation if needed
            if (data.client_secret) {
                return await this.confirmPayment(data.client_secret);
            }
            
            return { success: true, subscription: data.subscription };
            
        } catch (error) {
            console.error('Subscription creation failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async confirmPayment(clientSecret) {
        const { error } = await this.stripe.confirmPayment({
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/subscription-success`
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        return { success: true };
    }
}

// Usage in your Habitus frontend
document.addEventListener('DOMContentLoaded', function() {
    const subscriptionManager = new SubscriptionManager();
    
    // Ad-Free subscription button
    document.getElementById('subscribe-ad-free').addEventListener('click', async function() {
        const userId = getCurrentUserId(); // Your user ID function
        const result = await subscriptionManager.createSubscription(userId, 'ad_free');
        
        if (result.success) {
            showSuccessMessage('Welcome to Ad-Free Habitus!');
            updateUIForPremiumUser();
            awardHCoins(25); // Bonus HCoins for subscribing
        } else {
            showErrorMessage('Subscription failed: ' + result.error);
        }
    });
    
    // Supporter subscription button
    document.getElementById('subscribe-supporter').addEventListener('click', async function() {
        const userId = getCurrentUserId();
        const result = await subscriptionManager.createSubscription(userId, 'supporter');
        
        if (result.success) {
            showSuccessMessage('Welcome to Supporter tier! Enjoy your 7-day trial.');
            updateUIForSupporterUser();
            awardHCoins(100); // Higher bonus for Supporter tier
        } else {
            showErrorMessage('Subscription failed: ' + result.error);
        }
    });
});