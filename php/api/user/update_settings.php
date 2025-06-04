<?php
// php/api/user/update_settings.php - API endpoint for updating user settings

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['setting']) || !isset($data['value'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$setting = $data['setting'];
$value = $data['value'];
$userId = $_SESSION['user_id'];

// Validate setting type and value
$allowedSettings = [
    'theme' => ['light', 'dark'],
    'language' => ['en', 'es'],
    'notifications' => [true, false, 'true', 'false', 1, 0],
    'timezone' => null, // Allow any timezone
    'email_notifications' => [true, false, 'true', 'false', 1, 0],
    'task_reminders' => [true, false, 'true', 'false', 1, 0],
    'auto_theme' => [true, false, 'true', 'false', 1, 0]
];

// Check if setting is allowed
if (!array_key_exists($setting, $allowedSettings)) {
    echo json_encode(['success' => false, 'message' => 'Invalid setting type']);
    exit;
}

// Validate value if restrictions exist
if ($allowedSettings[$setting] !== null && !in_array($value, $allowedSettings[$setting], true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid value for setting']);
    exit;
}

// Prepare update query based on setting type
try {
    $conn->beginTransaction();
    
    switch ($setting) {
        case 'theme':
            $query = "UPDATE users SET theme = ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$value, $userId]);
            
            // Log theme change
            logSecurityEvent("Theme changed to: $value", $userId);
            break;
            
        case 'language':
            $query = "UPDATE users SET language = ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$value, $userId]);
            
            // Log language change
            logSecurityEvent("Language changed to: $value", $userId);
            break;
            
        case 'email_notifications':
        case 'task_reminders':
        case 'auto_theme':
            // Convert boolean values
            $boolValue = in_array($value, [true, 'true', 1], true) ? 1 : 0;
            
            // Check if user_preferences table exists, if not create it
            $checkTable = "SHOW TABLES LIKE 'user_preferences'";
            $result = $conn->query($checkTable);
            
            if ($result->rowCount() === 0) {
                // Create user_preferences table
                $createTable = "CREATE TABLE user_preferences (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    preference_key VARCHAR(50) NOT NULL,
                    preference_value TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_preference (user_id, preference_key)
                )";
                $conn->exec($createTable);
            }
            
            // Insert or update preference
            $query = "INSERT INTO user_preferences (user_id, preference_key, preference_value) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE preference_value = VALUES(preference_value), updated_at = CURRENT_TIMESTAMP";
            $stmt = $conn->prepare($query);
            $stmt->execute([$userId, $setting, $boolValue]);
            break;
            
        case 'timezone':
            // Validate timezone
            if (!in_array($value, timezone_identifiers_list())) {
                throw new Exception('Invalid timezone');
            }
            
            $query = "UPDATE users SET timezone = ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$value, $userId]);
            break;
            
        default:
            throw new Exception('Unhandled setting type');
    }
    
    $conn->commit();
    
    // Prepare success response with additional data
    $response = [
        'success' => true,
        'message' => 'Setting updated successfully',
        'setting' => $setting,
        'value' => $value,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Add specific responses for certain settings
    if ($setting === 'theme') {
        $response['theme_applied'] = $value;
        $response['css_file'] = "../css/themes/{$value}.css";
    }
    
    if ($setting === 'language') {
        $response['reload_required'] = true;
        $response['message'] = 'Language updated. Page reload recommended.';
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log error
    error_log("Settings update error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false, 
        'message' => 'Error updating setting: ' . $e->getMessage()
    ]);
}
?>