<?php
// php/api/user/upload_profile_picture.php

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
    echo json_encode(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
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
    
    // FIXED: Use document root to ensure we get the correct absolute path
    $documentRoot = $_SERVER['DOCUMENT_ROOT'];
    $uploadsDir = $documentRoot . '/uploads/profiles/';
    
    // Alternative: Use the same approach that works in debug
    // Comment out the above and uncomment below if document root doesn't work
    // $uploadsDir = dirname(dirname(dirname(__FILE__))) . '/uploads/profiles/';
    
    // Generate unique filename - keep original extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
    $uploadPath = $uploadsDir . $filename;
    
    // Web path for database and frontend
    $webPath = 'uploads/profiles/' . $filename;
    
    // ENHANCED DEBUG: Log everything
    error_log("=== Profile Upload Debug ===");
    error_log("Document Root: " . $documentRoot);
    error_log("Current File: " . __FILE__);
    error_log("dirname(__FILE__): " . dirname(__FILE__));
    error_log("dirname x2: " . dirname(dirname(__FILE__)));
    error_log("dirname x3: " . dirname(dirname(dirname(__FILE__))));
    error_log("Uploads Dir: " . $uploadsDir);
    error_log("Upload Path: " . $uploadPath);
    error_log("Web Path: " . $webPath);
    error_log("File tmp_name: " . $file['tmp_name']);
    error_log("File size: " . $file['size']);
    error_log("File type: " . $file['type']);
    error_log("Directory exists: " . (file_exists($uploadsDir) ? 'YES' : 'NO'));
    error_log("Directory writable: " . (is_writable($uploadsDir) ? 'YES' : 'NO'));
    error_log("Temp file exists: " . (file_exists($file['tmp_name']) ? 'YES' : 'NO'));
    
    // Ensure directory exists
    if (!file_exists($uploadsDir)) {
        if (!mkdir($uploadsDir, 0777, true)) {
            error_log("ERROR: Could not create directory: " . $uploadsDir);
            echo json_encode(['success' => false, 'message' => 'Could not create upload directory: ' . $uploadsDir]);
            exit;
        }
        error_log("Created directory: " . $uploadsDir);
    }
    
    // Verify directory is writable
    if (!is_writable($uploadsDir)) {
        error_log("ERROR: Directory not writable: " . $uploadsDir);
        echo json_encode(['success' => false, 'message' => 'Upload directory is not writable: ' . $uploadsDir]);
        exit;
    }
    
    // Verify temp file exists
    if (!file_exists($file['tmp_name'])) {
        error_log("ERROR: Temp file does not exist: " . $file['tmp_name']);
        echo json_encode(['success' => false, 'message' => 'Temp file not found: ' . $file['tmp_name']]);
        exit;
    }
    
    error_log("About to call move_uploaded_file...");
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        error_log("move_uploaded_file SUCCESS");
        
        // Set file permissions
        chmod($uploadPath, 0644);
        error_log("Set permissions to 0644");
        
        // CRITICAL: Verify the file actually exists after upload
        if (!file_exists($uploadPath)) {
            error_log("CRITICAL ERROR: File does not exist after move_uploaded_file: " . $uploadPath);
            echo json_encode(['success' => false, 'message' => 'File upload failed - file not found after move']);
            exit;
        }
        
        // Get file info for verification
        $fileSize = filesize($uploadPath);
        $fileModTime = filemtime($uploadPath);
        
        error_log("Upload verification:");
        error_log("File size: " . $fileSize);
        error_log("File mod time: " . $fileModTime);
        error_log("File readable: " . (is_readable($uploadPath) ? 'YES' : 'NO'));
        
        // Update database
        $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        if ($stmt->execute([$webPath, $userId])) {
            error_log("Database updated successfully");
            
            // Clean up old profile picture
            if ($currentPicture && 
                $currentPicture !== 'uploads/profile-icon.webp' && 
                strpos($currentPicture, 'uploads/profiles/') === 0) {
                $oldFilePath = $documentRoot . '/' . $currentPicture;
                if (file_exists($oldFilePath)) {
                    unlink($oldFilePath);
                    error_log("Cleaned up old file: " . $oldFilePath);
                }
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Profile picture updated successfully',
                'profile_picture_url' => $webPath,
                'cache_buster' => $fileModTime,
                'debug_info' => [
                    'filename' => $filename,
                    'upload_path' => $uploadPath,
                    'web_path' => $webPath,
                    'file_size' => $fileSize,
                    'file_exists' => file_exists($uploadPath),
                    'file_readable' => is_readable($uploadPath),
                    'document_root' => $documentRoot,
                    'uploads_dir' => $uploadsDir
                ]
            ]);
        } else {
            error_log("ERROR: Database update failed");
            // Database update failed, remove uploaded file
            unlink($uploadPath);
            echo json_encode(['success' => false, 'message' => 'Database update failed']);
        }
    } else {
        error_log("ERROR: move_uploaded_file FAILED from " . $file['tmp_name'] . " to " . $uploadPath);
        
        // Get more details about why it failed
        $error_details = [
            'source_exists' => file_exists($file['tmp_name']),
            'source_readable' => is_readable($file['tmp_name']),
            'dest_dir_exists' => file_exists($uploadsDir),
            'dest_dir_writable' => is_writable($uploadsDir),
            'dest_parent_writable' => is_writable(dirname($uploadsDir))
        ];
        
        error_log("Move failed details: " . json_encode($error_details));
        
        echo json_encode([
            'success' => false, 
            'message' => 'File upload failed - move_uploaded_file returned false',
            'debug_info' => $error_details
        ]);
    }
    
} catch (Exception $e) {
    error_log("EXCEPTION in profile upload: " . $e->getMessage());
    error_log("Exception trace: " . $e->getTraceAsString());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>