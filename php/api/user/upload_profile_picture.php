<?php
session_start();
require_once '../../include/config.php';
require_once '../../include/db_connect.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

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

// Enhanced validation
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'File upload error']);
    exit;
}

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Please use JPEG, PNG, or WebP']);
    exit;
}

if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'File too large. Maximum size is 5MB']);
    exit;
}

// Validate actual image
$imageInfo = getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    echo json_encode(['success' => false, 'message' => 'Invalid image file']);
    exit;
}

try {
    // Get current profile picture for cleanup
    $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentPicture = $stmt->fetchColumn();
    
    // Generate unique filename
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
    $uploadDir = '../../uploads/profiles/';
    $uploadPath = $uploadDir . $filename;
    $dbPath = 'uploads/profiles/' . $filename;
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Could not create upload directory']);
            exit;
        }
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Update database
        $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        if ($stmt->execute([$dbPath, $userId])) {
            // Clean up old profile picture (if not default)
            if ($currentPicture && 
                $currentPicture !== 'images/icons/profile-icon.webp' && 
                file_exists('../../' . $currentPicture)) {
                unlink('../../' . $currentPicture);
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Profile picture updated successfully',
                'profile_picture_url' => $dbPath
            ]);
        } else {
            // Database update failed, remove uploaded file
            unlink($uploadPath);
            echo json_encode(['success' => false, 'message' => 'Database update failed']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'File upload failed']);
    }
    
} catch (Exception $e) {
    error_log("Profile picture upload error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error occurred']);
}
?>