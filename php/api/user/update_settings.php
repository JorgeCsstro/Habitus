<?php
/**
 * User Settings Update API for Habitus Zone
 * Handles translation preferences and other user settings
 */

require_once '../config/database.php';
require_once '../includes/auth.php';

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
        'auto_translation',
        'preferred_language', 
        'translation_quality',
        'theme_preference',
        'notification_settings'
    ];
    
    if (!in_array($setting, $allowedSettings)) {
        throw new InvalidArgumentException("Invalid setting type: " . htmlspecialchars($setting));
    }
    
    switch ($setting) {
        case 'auto_translation':
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
            throw new InvalidArgumentException("auto_translation must be a boolean value");
            
        case 'preferred_language':
            $allowedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
            $value = trim($value);
            if (!in_array($value, $allowedLanguages)) {
                throw new InvalidArgumentException("Invalid language code: " . htmlspecialchars($value));
            }
            return $value;
            
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
        
        // Check if setting exists for user
        $checkStmt = $conn->prepare("SELECT id FROM user_settings WHERE user_id = ? AND setting_name = ?");
        $checkStmt->bind_param("is", $userId, $setting);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            // Update existing setting
            $updateStmt = $conn->prepare("UPDATE user_settings SET setting_value = ?, updated_at = NOW() WHERE user_id = ? AND setting_name = ?");
            $updateStmt->bind_param("sis", $validatedValue, $userId, $setting);
            $success = $updateStmt->execute();
        } else {
            // Insert new setting
            $insertStmt = $conn->prepare("INSERT INTO user_settings (user_id, setting_name, setting_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
            $insertStmt->bind_param("iss", $userId, $setting, $validatedValue);
            $success = $insertStmt->execute();
        }
        
        if ($success) {
            // Log the setting change
            error_log("User {$userId} updated setting '{$setting}' to '{$validatedValue}'");
            
            return [
                'success' => true,
                'message' => 'Setting updated successfully',
                'setting' => $setting,
                'value' => $validatedValue
            ];
        } else {
            throw new Exception("Failed to update database: " . $conn->error);
        }
        
    } catch (InvalidArgumentException $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'error_type' => 'validation'
        ];
    } catch (Exception $e) {
        error_log("Database error in updateUserSetting: " . $e->getMessage());
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
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'User not authenticated',
            'error_type' => 'auth'
        ]);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Handle both JSON and form-encoded data
    if ($data === null) {
        $setting = $_POST['setting'] ?? '';
        $value = $_POST['value'] ?? '';
    } else {
        $setting = $data['setting'] ?? '';
        $value = $data['value'] ?? '';
    }
    
    if (empty($setting)) {
        throw new InvalidArgumentException('Setting name is required');
    }
    
    $result = updateUserSetting($userId, $setting, $value);
    
    if ($result['success']) {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_type' => 'validation'
    ]);
} catch (Exception $e) {
    error_log("Error in update_settings.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'error_type' => 'server'
    ]);
}
?>