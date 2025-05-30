<?php

// config.php

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Site configuration
define('SITE_NAME', 'Habitus Zone');
define('SITE_URL', 'http://localhost/habitus_zone'); // Change to your domain
define('ADMIN_EMAIL', 'admin@habituszone.com');

// Default timezone
date_default_timezone_set('UTC');

// Error reporting - during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// For production, you should disable error display
// ini_set('display_errors', 0);
// ini_set('display_startup_errors', 0);
// error_reporting(0);

// Paths
define('ROOT_PATH', dirname(dirname(dirname(__FILE__))));
define('IMAGES_PATH', ROOT_PATH . '/images');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');

// HCoin settings
define('HCOIN_DAILY_MULTIPLIER', 1.0);
define('HCOIN_GOAL_MULTIPLIER', 1.5);
define('HCOIN_CHALLENGE_MULTIPLIER', 2.0);

// Stripe Configuration
// Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
// Use test keys for development, live keys for production

// Test Mode Keys (for development)
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_51QT9qdDyXYZExampleKey123456789');
define('STRIPE_SECRET_KEY', 'sk_test_51QT9qdDyXYZExampleSecretKey123456789');

// Live Mode Keys (for production) - uncomment and fill in when ready
// define('STRIPE_PUBLISHABLE_KEY', 'pk_live_YourLivePublishableKey');
// define('STRIPE_SECRET_KEY', 'sk_live_YourLiveSecretKey');

// Webhook Secret - Get this from Stripe Dashboard > Webhooks
define('STRIPE_WEBHOOK_SECRET', 'whsec_YourWebhookSigningSecret');

// Stripe Price IDs
// Create these in Stripe Dashboard > Products
// Or via API: https://stripe.com/docs/api/prices/create
define('STRIPE_PRICE_ADFREE_MONTHLY', 'price_YourAdFreePriceId');
define('STRIPE_PRICE_PREMIUM_MONTHLY', 'price_YourPremiumPriceId');

// Optional: Annual subscription price IDs
define('STRIPE_PRICE_ADFREE_YEARLY', 'price_YourAdFreeYearlyPriceId');
define('STRIPE_PRICE_PREMIUM_YEARLY', 'price_YourPremiumYearlyPriceId');

// Payment settings
define('PAYMENT_CURRENCY', 'eur'); // Currency code
define('PAYMENT_STATEMENT_DESCRIPTOR', 'HABITUS ZONE'); // What appears on card statements

// Enable/disable payment methods
define('ENABLE_APPLE_PAY', true);
define('ENABLE_GOOGLE_PAY', true);
define('ENABLE_CARD_PAYMENTS', true);

// Subscription settings
define('TRIAL_DAYS', 0); // Number of trial days (0 = no trial)
define('CANCEL_AT_PERIOD_END', true); // Keep access until subscription expires

// Email settings for payment receipts
define('SEND_PAYMENT_RECEIPTS', true);
define('PAYMENT_SUPPORT_EMAIL', 'support@habituszone.com');

// Webhook configuration
define('WEBHOOK_ENDPOINT_URL', SITE_URL . '/php/api/subscription/stripe-webhook.php');

// Tax settings (optional)
define('ENABLE_TAX_COLLECTION', false); // Enable Stripe Tax
define('DEFAULT_TAX_RATE', 0); // Default tax rate percentage

// Security settings
define('REQUIRE_3D_SECURE', 'automatic'); // 'automatic', 'required', or 'optional'
