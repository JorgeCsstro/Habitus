<?php

// auth.php - Authentication helper functions

/**
 * Check if a user is logged in
 * @return bool - True if logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current logged in user ID
 * @return int|null - User ID or null if not logged in
 */
function getCurrentUserId() {
    return isLoggedIn() ? $_SESSION['user_id'] : null;
}

/**
 * Get current logged in username
 * @return string|null - Username or null if not logged in
 */
function getCurrentUsername() {
    return isLoggedIn() ? $_SESSION['username'] : null;
}

/**
 * Require authentication - redirect to login if not logged in
 */
function requireAuth() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Redirect if already logged in
 * @param string $redirectTo - Where to redirect (default: dashboard.php)
 */
function redirectIfLoggedIn($redirectTo = 'dashboard.php') {
    if (isLoggedIn()) {
        header("Location: $redirectTo");
        exit;
    }
}

/**
 * Login user by setting session variables
 * @param int $userId - User ID
 * @param string $username - Username
 */
function loginUser($userId, $username) {
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
}

/**
 * Logout user by destroying session
 */
function logoutUser() {
    // Unset all session variables
    $_SESSION = array();
    
    // Destroy the session cookie if it exists
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destroy the session
    session_destroy();
}

/**
 * Check if current user has a specific subscription type
 * @param string $requiredType - Required subscription type
 * @return bool - True if user has required subscription or higher
 */
function hasSubscription($requiredType = 'adfree') {
    if (!isLoggedIn()) {
        return false;
    }
    
    global $conn;
    
    $query = "SELECT subscription_type, subscription_expires FROM users WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute([$_SESSION['user_id']]);
    
    if ($stmt->rowCount() === 0) {
        return false;
    }
    
    $user = $stmt->fetch();
    
    // Check if subscription is expired
    if ($user['subscription_expires'] && $user['subscription_expires'] < date('Y-m-d H:i:s')) {
        return false;
    }
    
    // Define subscription hierarchy
    $subscriptions = ['free' => 0, 'adfree' => 1, 'premium' => 2];
    
    $userLevel = $subscriptions[$user['subscription_type']] ?? 0;
    $requiredLevel = $subscriptions[$requiredType] ?? 1;
    
    return $userLevel >= $requiredLevel;
}

/**
 * Check if user is premium subscriber
 * @return bool - True if user has premium subscription
 */
function isPremium() {
    return hasSubscription('premium');
}

/**
 * Check if user is ad-free subscriber (or premium)
 * @return bool - True if user has ad-free or premium subscription
 */
function isAdFree() {
    return hasSubscription('adfree');
}

/**
 * Generate CSRF token
 * @return string - CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 * @param string $token - Token to verify
 * @return bool - True if token is valid
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Rate limiting - simple implementation
 * @param string $action - Action being rate limited
 * @param int $maxAttempts - Maximum attempts allowed
 * @param int $timeWindow - Time window in seconds
 * @return bool - True if action is allowed
 */
function rateLimitCheck($action, $maxAttempts = 5, $timeWindow = 300) {
    $key = "rate_limit_{$action}_" . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    $now = time();
    $attempts = $_SESSION[$key];
    
    // Remove old attempts outside time window
    $attempts = array_filter($attempts, function($timestamp) use ($now, $timeWindow) {
        return ($now - $timestamp) < $timeWindow;
    });
    
    // Check if max attempts exceeded
    if (count($attempts) >= $maxAttempts) {
        return false;
    }
    
    // Add current attempt
    $attempts[] = $now;
    $_SESSION[$key] = $attempts;
    
    return true;
}

/**
 * Validate password strength
 * @param string $password - Password to validate
 * @return array - Array with 'valid' boolean and 'errors' array
 */
function validatePassword($password) {
    $errors = [];
    
    if (strlen($password) < 8) {
        $errors[] = "Password must be at least 8 characters long";
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = "Password must contain at least one uppercase letter";
    }
    
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = "Password must contain at least one lowercase letter";
    }
    
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = "Password must contain at least one number";
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
    ];
}

/**
 * Hash password using secure method
 * @param string $password - Plain text password
 * @return string - Hashed password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password against hash
 * @param string $password - Plain text password
 * @param string $hash - Hashed password
 * @return bool - True if password matches hash
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate secure random token
 * @param int $length - Token length in bytes
 * @return string - Random token
 */
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Sanitize input data
 * @param mixed $data - Data to sanitize
 * @return mixed - Sanitized data
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Log security events
 * @param string $event - Event description
 * @param int $userId - User ID (optional)
 */
function logSecurityEvent($event, $userId = null) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'user_id' => $userId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // In production, you might want to log to a database or file
    error_log("Security Event: " . json_encode($logEntry));
}