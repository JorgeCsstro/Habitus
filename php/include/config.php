<?php

// config.php - Updated with .env support

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load environment variables
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    // Load .env file if it exists
    if (file_exists(__DIR__ . '/../../.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
        $dotenv->load();
    }
} else {
    // Fallback if composer autoload not found
    echo "Error: Please run 'composer install' to install dependencies.";
    exit;
}

// Site configuration - now using environment variables
define('SITE_NAME', 'Habitus Zone');
define('SITE_URL', $_ENV['SITE_URL'] ?? 'http://localhost/habitus:3000');
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

// Stripe Configuration - from environment variables
define('STRIPE_PUBLISHABLE_KEY', $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? '');
define('STRIPE_SECRET_KEY', $_ENV['STRIPE_SECRET_KEY'] ?? '');
define('STRIPE_WEBHOOK_SECRET', $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '');

// Validate Stripe keys are present
if (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY)) {
    if (DEBUG_MODE) {
        error_log('Warning: Stripe keys not configured in .env file');
    }
}

// Payment settings
define('PAYMENT_CURRENCY', 'eur');
define('PAYMENT_STATEMENT_DESCRIPTOR', 'HABITUS ZONE');

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

// Email configuration (if using SMTP)
/* define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'localhost');
define('SMTP_PORT', $_ENV['SMTP_PORT'] ?? 587);
define('SMTP_USER', $_ENV['SMTP_USER'] ?? '');
define('SMTP_PASS', $_ENV['SMTP_PASS'] ?? ''); */

// Log configuration status in debug mode
if (DEBUG_MODE) {
    error_log("Config loaded - Stripe PK: " . (empty(STRIPE_PUBLISHABLE_KEY) ? 'NOT SET' : 'SET'));
    error_log("Config loaded - Stripe SK: " . (empty(STRIPE_SECRET_KEY) ? 'NOT SET' : 'SET'));
}