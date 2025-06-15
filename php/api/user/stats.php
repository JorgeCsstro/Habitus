<?php
// php/api/user/stats.php - Translation usage statistics

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

header('Content-Type: application/json');

// Check authentication
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $period = $_GET['period'] ?? 'month';
    
    // Validate period
    $allowedPeriods = ['day', 'week', 'month', 'year'];
    if (!in_array($period, $allowedPeriods)) {
        $period = 'month';
    }
    
    // Get usage statistics
    $sql = "SELECT 
                provider,
                SUM(character_count) as total_characters,
                SUM(api_calls) as total_calls,
                SUM(cost_estimate) as total_cost,
                COUNT(DISTINCT date) as active_days
            FROM translation_usage 
            WHERE user_id = ? 
            AND date >= DATE_SUB(CURDATE(), INTERVAL 1 " . strtoupper($period) . ")
            GROUP BY provider";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    $providerStats = $stmt->fetchAll();
    
    // Get overall totals
    $totalCharacters = 0;
    $totalCalls = 0;
    $totalCost = 0;
    
    foreach ($providerStats as $stat) {
        $totalCharacters += $stat['total_characters'];
        $totalCalls += $stat['total_calls'];
        $totalCost += $stat['total_cost'];
    }
    
    // Get cache statistics
    $cacheSql = "SELECT 
                    COUNT(*) as total_cached,
                    SUM(usage_count) as cache_hits,
                    AVG(character_count) as avg_length
                 FROM translation_cache 
                 WHERE last_used >= DATE_SUB(NOW(), INTERVAL 1 " . strtoupper($period) . ")";
    
    $cacheResult = $conn->query($cacheSql)->fetch();
    
    // Calculate free tier remaining (Azure: 2M characters/month)
    $freeLimit = 2000000;
    $remaining = max(0, $freeLimit - $totalCharacters);
    $usagePercentage = ($totalCharacters / $freeLimit) * 100;
    
    // Get recent translation activity
    $activitySql = "SELECT 
                        date,
                        SUM(character_count) as daily_characters,
                        SUM(api_calls) as daily_calls
                    FROM translation_usage 
                    WHERE user_id = ? 
                    AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    GROUP BY date 
                    ORDER BY date DESC";
    
    $activityStmt = $conn->prepare($activitySql);
    $activityStmt->execute([$userId]);
    $recentActivity = $activityStmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'period' => $period,
        'stats' => [
            'total_characters' => $totalCharacters,
            'total_calls' => $totalCalls,
            'total_cost' => $totalCost,
            'free_tier_remaining' => $remaining,
            'usage_percentage' => round($usagePercentage, 2),
            'providers' => $providerStats,
            'cache' => $cacheResult,
            'recent_activity' => $recentActivity
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Translation stats error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load translation statistics'
    ]);
}
?>