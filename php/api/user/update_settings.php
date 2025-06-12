<?php
/**
 * User Settings Update API for Habitus Zone - FIXED VERSION
 * Handles theme persistence and other user settings
 */

// php/api/user/update_settings.php

// CRITICAL: Start output buffering to prevent any accidental output
ob_start();

// Turn off error display (errors should be logged, not displayed)
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set error handler to prevent HTML output
set_error_handler(function($severity, $message, $file, $line) {
    error_log("PHP Error: $message in $file on line $line");
    return true; // Don't execute the normal error handler
});

try {
    require_once '../../include/config.php';
    require_once '../../include/db_connect.php';
    require_once '../../include/auth.php';
} catch (Exception $e) {
    // Clean any output and send JSON error
    ob_clean();
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server configuration error',
        'error_type' => 'server'
    ]);
    exit;
}

// Clean any accidental output from includes
ob_clean();

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session and check authentication
session_start();

function validateInput($setting, $value) {
    $allowedSettings = [
        'theme',                    // Theme setting
        'language',                 // Language setting
        'auto_translation',
        'preferred_language', 
        'translation_quality',
        'high_quality_translation',
        'theme_preference',
        'notification_settings',
        'email_notifications',
        'task_reminders'
    ];
    
    if (!in_array($setting, $allowedSettings)) {
        throw new InvalidArgumentException("Invalid setting type: " . htmlspecialchars($setting));
    }
    
    switch ($setting) {
        case 'theme':
            $allowedThemes = ['light', 'dark'];
            $value = trim($value);
            if (!in_array($value, $allowedThemes)) {
                throw new InvalidArgumentException("Invalid theme: " . htmlspecialchars($value));
            }
            return $value;
            
        case 'language':
        case 'preferred_language':
            $allowedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
            $value = trim($value);
            if (!in_array($value, $allowedLanguages)) {
                throw new InvalidArgumentException("Invalid language code: " . htmlspecialchars($value));
            }
            return $value;
            
        case 'auto_translation':
        case 'high_quality_translation':
        case 'email_notifications':
        case 'task_reminders':
            // Accept boolean, string boolean, or integer
            if (is_bool($value)) {
                return $value ? 1 : 0;
            } else if (is_string($value)) {
                $lowerValue = strtolower(trim($value));
                if (in_array($lowerValue, ['true', '1', 'yes', 'on'])) {
                    return 1;
                } else if (in_array($lowerValue, ['false', '0', 'no', 'off'])) {
                    return 0;
                }
            } else if (is_numeric($value)) {
                return intval($value) ? 1 : 0;
            }
            throw new InvalidArgumentException("{$setting} must be a boolean value");
            
        case 'translation_quality':
            $allowedQualities = ['standard', 'high', 'premium'];
            if (!in_array($value, $allowedQualities)) {
                throw new InvalidArgumentException("Invalid translation quality");
            }
            return $value;
            
        case 'theme_preference':
            $allowedThemes = ['light', 'dark', 'auto'];
            if (!in_array($value, $allowedThemes)) {
                throw new InvalidArgumentException("Invalid theme preference");
            }
            return $value;
            
        default:
            return $value;
    }
}

function updateUserSetting($userId, $setting, $value) {
    global $conn;
    
    try {
        // Validate input
        $validatedValue = validateInput($setting, $value);
        
        // Enhanced logging for theme requests
        if ($setting === 'theme') {
            error_log("🎨 Theme update request - User: {$userId}, Setting: {$setting}, Value: {$value}");
        }
        
        // FIXED: For theme and language, update the users table directly using PDO
        if ($setting === 'theme' || $setting === 'language') {
            $updateStmt = $conn->prepare("UPDATE users SET {$setting} = ? WHERE id = ?");
            $success = $updateStmt->execute([$validatedValue, $userId]);
            
            if ($success) {
                if ($setting === 'theme') {
                    error_log("✅ Theme updated successfully in database: User {$userId} -> {$validatedValue}");
                } else {
                    error_log("User {$userId} updated {$setting} to '{$validatedValue}' in users table");
                }
                
                // Update session to reflect the change immediately
                if ($setting === 'theme') {
                    $_SESSION['user_theme'] = $validatedValue;
                }
            } else {
                throw new Exception("Database update failed");
            }
        } else {
            // For other settings, use user_settings table
            $checkStmt = $conn->prepare("SELECT id FROM user_settings WHERE user_id = ? AND setting_name = ?");
            $checkStmt->execute([$userId, $setting]);
            $result = $checkStmt->fetch();
            
            if ($result) {
                // Update existing setting
                $updateStmt = $conn->prepare("UPDATE user_settings SET setting_value = ?, updated_at = NOW() WHERE user_id = ? AND setting_name = ?");
                $success = $updateStmt->execute([$validatedValue, $userId, $setting]);
            } else {
                // Insert new setting
                $insertStmt = $conn->prepare("INSERT INTO user_settings (user_id, setting_name, setting_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
                $success = $insertStmt->execute([$userId, $setting, $validatedValue]);
            }
        }
        
        if ($success) {
            // Enhanced return for theme changes
            if ($setting === 'theme') {
                return [
                    'success' => true,
                    'message' => 'Theme updated successfully',
                    'setting' => $setting,
                    'value' => $validatedValue,
                    'theme' => $validatedValue
                ];
            } else {
                // Log the setting change for other settings
                error_log("User {$userId} updated setting '{$setting}' to '{$validatedValue}'");
                
                return [
                    'success' => true,
                    'message' => 'Setting updated successfully',
                    'setting' => $setting,
                    'value' => $validatedValue
                ];
            }
        } else {
            throw new Exception("Failed to update database");
        }
        
    } catch (InvalidArgumentException $e) {
        if ($setting === 'theme') {
            error_log("❌ Theme validation error: " . $e->getMessage());
        }
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'error_type' => 'validation'
        ];
    } catch (Exception $e) {
        if ($setting === 'theme') {
            error_log("❌ Theme update error: " . $e->getMessage());
        } else {
            error_log("Database error in updateUserSetting: " . $e->getMessage());
        }
        return [
            'success' => false,
            'error' => 'Internal server error',
            'error_type' => 'database'
        ];
    }
}

// Main request handling
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    // Check if user is authenticated
    if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
        // Clean any output
        if (ob_get_level()) {
            ob_clean();
        }
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'User not authenticated',
            'error_type' => 'auth'
        ]);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get request data with error handling
    $input = file_get_contents('php://input');
    if ($input === false) {
        throw new Exception('Failed to read request input');
    }
    
    $data = json_decode($input, true);
    
    // Check for JSON decode errors
    if (json_last_error() !== JSON_ERROR_NONE && !empty($input)) {
        throw new InvalidArgumentException('Invalid JSON in request: ' . json_last_error_msg());
    }
    
    // Handle both JSON and form-encoded data
    if ($data === null && !empty($input)) {
        throw new InvalidArgumentException('Invalid request data format');
    } else if ($data === null) {
        $setting = $_POST['setting'] ?? '';
        $value = $_POST['value'] ?? '';
    } else {
        $setting = $data['setting'] ?? '';
        $value = $data['value'] ?? '';
    }
    
    if (empty($setting)) {
        throw new InvalidArgumentException('Setting name is required');
    }
    
    // Enhanced logging for theme requests
    if ($setting === 'theme') {
        error_log("🎨 Theme update request - User: {$userId}, Setting: {$setting}, Value: " . var_export($value, true));
    } else {
        error_log("Settings update request: User {$userId}, Setting: {$setting}, Value: " . var_export($value, true));
    }
    
    $result = updateUserSetting($userId, $setting, $value);
    
    // Clean any accidental output
    if (ob_get_level()) {
        ob_clean();
    }
    
    header('Content-Type: application/json');
    if ($result['success']) {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);
    
} catch (InvalidArgumentException $e) {
    if (ob_get_level()) {
        ob_clean();
    }
    error_log("❌ Validation error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_type' => 'validation'
    ]);
} catch (Exception $e) {
    if (ob_get_level()) {
        ob_clean();
    }
    error_log("❌ Server error in update_settings.php: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'error_type' => 'server'
    ]);
}

// End output buffering and send the response
if (ob_get_level()) {
    ob_end_flush();
}
?>