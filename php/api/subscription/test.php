<?php
// php/api/subscription/test.php - Simple test endpoint

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

header('Content-Type: application/json');

try {
    $testData = [
        'status' => 'success',
        'timestamp' => date('Y-m-d H:i:s'),
        'site_url' => SITE_URL,
        'debug_mode' => DEBUG_MODE,
        'stripe_demo_mode' => defined('STRIPE_DEMO_MODE') ? STRIPE_DEMO_MODE : 'not defined',
        'user_logged_in' => isLoggedIn(),
        'session_id' => session_id(),
        'database_connected' => isset($conn) ? 'yes' : 'no'
    ];
    
    if (isLoggedIn()) {
        $testData['user_id'] = $_SESSION['user_id'] ?? 'not set';
        $testData['username'] = $_SESSION['username'] ?? 'not set';
    }
    
    // Test database connection
    if (isset($conn)) {
        try {
            $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
            $result = $stmt->fetch();
            $testData['database_users_count'] = $result['count'];
        } catch (Exception $e) {
            $testData['database_error'] = $e->getMessage();
        }
    }
    
    echo json_encode($testData, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>