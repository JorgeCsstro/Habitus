<?php
session_start();
require_once '../../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['profile_picture'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$file = $_FILES['profile_picture'];
$userId = $_SESSION['user_id'];

// Validation
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
$maxSize = 50 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type']);
    exit;
}

if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'File too large']);
    exit;
}

try {
    // Get current profile picture for cleanup
    $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentPicture = $stmt->fetchColumn();
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
    $uploadDir = '../../uploads/profiles/';
    $uploadPath = $uploadDir . $filename;
    $dbPath = 'uploads/profiles/' . $filename;
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Update database
        $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        $stmt->execute([$dbPath, $userId]);
        
        // Clean up old profile picture (if not default)
        if ($currentPicture && $currentPicture !== 'images/icons/profile-icon.webp' 
            && file_exists('../../' . $currentPicture)) {
            unlink('../../' . $currentPicture);
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Profile picture updated',
            'profile_picture_url' => $dbPath
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Upload failed']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>