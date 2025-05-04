<?php
/**
 * Get user data from the database
 * @param int $userId - User ID
 * @return array - User data
 */
function getUserData($userId) {
    global $conn;
    
    $sql = "SELECT * FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return $result->fetch_assoc();
    }
    
    return [];
}

/**
 * Check if a user is logged in
 * @return bool - True if logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get user's daily tasks
 * @param int $userId - User ID
 * @return array - User's daily tasks
 */
function getUserDailies($userId) {
    global $conn;
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, d.current_streak, 
            d.highest_streak, d.reset_time, d.last_completed, 
            IF(d.last_completed = CURDATE(), 1, 0) as completed
            FROM tasks t
            JOIN dailies d ON t.id = d.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Daily')
            ORDER BY d.reset_time, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $dailies = [];
    while ($row = $result->fetch_assoc()) {
        $dailies[] = $row;
    }
    
    return $dailies;
}

/**
 * Get user's goal tasks
 * @param int $userId - User ID
 * @return array - User's goal tasks
 */
function getUserGoals($userId) {
    global $conn;
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, 
            g.deadline, g.progress, g.total_steps,
            IF(g.progress >= g.total_steps, 1, 0) as completed
            FROM tasks t
            JOIN goals g ON t.id = g.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Goal')
            ORDER BY g.deadline, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $goals = [];
    while ($row = $result->fetch_assoc()) {
        $goals[] = $row;
    }
    
    return $goals;
}

/**
 * Get user's challenge tasks
 * @param int $userId - User ID
 * @return array - User's challenge tasks
 */
function getUserChallenges($userId) {
    global $conn;
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, 
            c.start_date, c.end_date, c.is_completed as completed
            FROM tasks t
            JOIN challenges c ON t.id = c.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Challenge')
            AND c.end_date >= CURDATE()
            ORDER BY c.end_date, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $challenges = [];
    while ($row = $result->fetch_assoc()) {
        $challenges[] = $row;
    }
    
    return $challenges;
}

/**
 * Get featured shop items
 * @return array - Featured shop items
 */
function getFeaturedShopItems() {
    global $conn;
    
    $sql = "SELECT s.id, s.name, s.description, s.image_path, s.price, s.rarity,
            c.name as category
            FROM shop_items s
            JOIN item_categories c ON s.category_id = c.id
            WHERE s.is_featured = 1 AND s.is_available = 1
            ORDER BY s.price LIMIT 9";
    
    $result = $conn->query($sql);
    
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    return $items;
}

/**
 * Get user's habitus data
 * @param int $userId - User ID
 * @return array - User's habitus data
 */
function getUserHabitusData($userId) {
    global $conn;
    
    // Get active room
    $sql = "SELECT r.id, r.name, r.background_id, r.layout_json,
            CONCAT('images/backgrounds/', b.image_path) as preview_image,
            r.id as active_room_id
            FROM rooms r
            LEFT JOIN shop_items b ON r.background_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.id LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Create a default room if none exists
        $defaultRoom = createDefaultRoom($userId);
        return $defaultRoom;
    }
    
    return $result->fetch_assoc();
}

/**
 * Create default room for new user
 * @param int $userId - User ID
 * @return array - Default room data
 */
function createDefaultRoom($userId) {
    global $conn;
    
    $roomName = "My First Room";
    
    $sql = "INSERT INTO rooms (user_id, name, layout_json) VALUES (?, ?, '{}')";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $userId, $roomName);
    $stmt->execute();
    
    $roomId = $conn->insert_id;
    
    return [
        'id' => $roomId,
        'name' => $roomName,
        'background_id' => null,
        'layout_json' => '{}',
        'preview_image' => null,
        'active_room_id' => $roomId
    ];
}

/**
 * Get user's rooms
 * @param int $userId - User ID
 * @return array - User's rooms
 */
function getUserRooms($userId) {
    global $conn;
    
    $sql = "SELECT r.id, r.name, 
            IFNULL(CONCAT('images/backgrounds/', b.image_path), 'images/backgrounds/default_room.png') as thumbnail
            FROM rooms r
            LEFT JOIN shop_items b ON r.background_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.id";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rooms = [];
    while ($row = $result->fetch_assoc()) {
        $rooms[] = $row;
    }
    
    return $rooms;
}