<?php
// php/api/user/get_profile_picture.php
session_start();
require_once '../../include/config.php';
require_once '../../include/db_connect.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $profilePicture = $stmt->fetchColumn();
    
    // Use default if no profile picture set
    $imageUrl = $profilePicture ? $profilePicture : '/uploads/profile-icon.webp';
    
    // Get file modification time for cache busting
    $cacheBuster = time(); // Default fallback
    $fullPath = '../../' . $imageUrl;
    
    if (file_exists($fullPath)) {
        $cacheBuster = filemtime($fullPath);
    }
    
    echo json_encode([
        'success' => true, 
        'profile_picture_url' => $imageUrl,
        'cache_buster' => $cacheBuster
    ]);
    
} catch (Exception $e) {
    error_log("Get profile picture error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>