<?php
// config.php - Updated with enhanced Stripe support

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load environment variables (optional - for production)
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    // Load .env file if it exists
    if (file_exists(__DIR__ . '/../../.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
        $dotenv->load();
    }
}

// Site configuration
define('SITE_NAME', 'Habitus Zone');
define('SITE_URL', $_ENV['SITE_URL'] ?? 'https://habitus.zone');
define('ADMIN_EMAIL', $_ENV['ADMIN_EMAIL'] ?? 'jorgecastrot2005@gmail.com');

// Debug mode
define('DEBUG_MODE', filter_var($_ENV['DEBUG_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN));

// Default timezone
date_default_timezone_set('UTC');

// Error reporting based on debug mode
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Paths
define('ROOT_PATH', dirname(dirname(dirname(__FILE__))));
define('IMAGES_PATH', ROOT_PATH . '/images');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');

// HCoin settings
define('HCOIN_DAILY_MULTIPLIER', 1.0);
define('HCOIN_GOAL_MULTIPLIER', 1.5);
define('HCOIN_CHALLENGE_MULTIPLIER', 2.0);

// Stripe Configuration - Use your actual live keys from .env
define('STRIPE_PUBLISHABLE_KEY', $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? 'pk_live_51RUWHJP82CUp8m3N275XjggSuOHD8BQfDUdtpID4zNNy6GeMIzb6xJvz7PMmOyU4QLd63utdrcxKVUuETrsMGU7i00V7mL8I4F');
define('STRIPE_SECRET_KEY', $_ENV['STRIPE_SECRET_KEY'] ?? 'sk_live_');
define('STRIPE_WEBHOOK_SECRET', $_ENV['STRIPE_WEBHOOK_SECRET'] ?? 'whsec_o7HOHbtpOSx4lhw2o9KWMcN3ARmreJks');

// Stripe Price IDs from your .env file
define('STRIPE_PRICE_ADFREE_MONTHLY', $_ENV['STRIPE_PRICE_ADFREE_MONTHLY'] ?? 'price_1RVz3AP82CUp8m3N7XY0qGFt');
define('STRIPE_PRICE_SUPPORTER_MONTHLY', $_ENV['STRIPE_PRICE_SUPPORTER_MONTHLY'] ?? 'price_1RVz3tP82CUp8m3NUjURWxQn');

// Payment settings
define('PAYMENT_CURRENCY', $_ENV['PAYMENT_CURRENCY'] ?? 'eur');
define('PAYMENT_STATEMENT_DESCRIPTOR', $_ENV['PAYMENT_STATEMENT_DESCRIPTOR'] ?? 'HABITUS ZONE');

// Enable/disable payment methods
define('ENABLE_APPLE_PAY', true);
define('ENABLE_GOOGLE_PAY', true);
define('ENABLE_CARD_PAYMENTS', true);

// Subscription settings
define('TRIAL_DAYS', 0);
define('CANCEL_AT_PERIOD_END', true);

// Email settings
define('SEND_PAYMENT_RECEIPTS', true);
define('PAYMENT_SUPPORT_EMAIL', 'jorgecastrot2005@gmail.com');

// Webhook configuration
define('WEBHOOK_ENDPOINT_URL', SITE_URL . '/php/api/subscription/stripe-webhook.php');

// Tax settings
define('ENABLE_TAX_COLLECTION', false);
define('DEFAULT_TAX_RATE', 0);

// Security settings
define('REQUIRE_3D_SECURE', 'automatic');

// Demo mode flag - set to false for production with real Stripe
define('STRIPE_DEMO_MODE', false);

// Demo prices (used when STRIPE_DEMO_MODE is true)
define('DEMO_PRICE_ADFREE', 0.99);
define('DEMO_PRICE_PREMIUM', 4.99);

// Log configuration status in debug mode
if (DEBUG_MODE) {
    error_log("Config loaded - Stripe Demo Mode: " . (STRIPE_DEMO_MODE ? 'ENABLED' : 'DISABLED'));
    if (STRIPE_DEMO_MODE) {
        error_log("Demo prices - AdFree: €" . DEMO_PRICE_ADFREE . ", Premium: €" . DEMO_PRICE_PREMIUM);
    } else {
        error_log("Config loaded - Using live Stripe keys");
        error_log("AdFree Price ID: " . STRIPE_PRICE_ADFREE_MONTHLY);
        error_log("Premium Price ID: " . STRIPE_PRICE_SUPPORTER_MONTHLY);
    }
}
?>