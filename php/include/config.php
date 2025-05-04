<?php
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