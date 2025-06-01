<?php
// db_connect.php - Updated with .env support

// Make sure config is loaded first (which loads .env)
if (!defined('SITE_NAME')) {
    require_once __DIR__ . '/config.php';
}

// Database connection details from environment variables
$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbUser = $_ENV['DB_USER'] ?? 'u343618305_habit';
$dbPass = $_ENV['DB_PASS'] ?? 'habit090402DJct.';
$dbName = $_ENV['DB_NAME'] ?? 'u343618305_habitus_zone';

// Create connection using PDO
try {
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set fetch mode to associative array
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Log successful connection in debug mode
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("Database connected successfully to: $dbHost/$dbName");
    }
    
} catch(PDOException $e) {
    // Log error details in debug mode
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("Database connection failed: " . $e->getMessage());
        die("Connection failed: " . $e->getMessage());
    } else {
        // In production, show generic error
        die("Database connection failed. Please try again later.");
    }
}