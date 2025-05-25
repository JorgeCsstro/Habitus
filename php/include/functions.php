<?php

// functions.php - Fixed getUserHabitusData function

/**
 * Get user data from the database
 * @param int $userId - User ID
 * @return array - User data
 */
function getUserData($userId) {
    global $conn;
    
    $sql = "SELECT * FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        return $stmt->fetch();
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
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, t.difficulty, d.current_streak, 
            d.highest_streak, d.reset_time, d.last_completed, 
            IF(d.last_completed = CURDATE(), 1, 0) as completed
            FROM tasks t
            JOIN dailies d ON t.id = d.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Daily')
            ORDER BY d.reset_time, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    $dailies = [];
    while ($row = $stmt->fetch()) {
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
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, t.difficulty, 
            g.deadline, g.use_subtasks,
            CASE 
                WHEN g.use_subtasks = 1 AND EXISTS (
                    SELECT 1 FROM subtasks WHERE parent_task_id = t.id
                ) THEN (
                    -- For tasks with subtasks, check if ALL subtasks are completed
                    SELECT COUNT(*) = COUNT(CASE WHEN is_completed = 1 THEN 1 END) 
                    FROM subtasks WHERE parent_task_id = t.id
                )
                WHEN g.progress = g.total_steps THEN 1
                ELSE 0 
            END as completed
            FROM tasks t
            JOIN goals g ON t.id = g.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Goal')
            ORDER BY g.deadline, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    $goals = [];
    while ($row = $stmt->fetch()) {
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
    
    $sql = "SELECT t.id, t.title, t.description, t.hcoin_reward, t.difficulty, 
            c.start_date, c.end_date, c.is_completed as completed, c.use_subtasks
            FROM tasks t
            JOIN challenges c ON t.id = c.task_id
            WHERE t.user_id = ? AND t.type_id = (SELECT id FROM task_types WHERE name = 'Challenge')
            AND c.end_date >= CURDATE()
            ORDER BY c.end_date, t.title";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    $challenges = [];
    while ($row = $stmt->fetch()) {
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
    
    $stmt = $conn->query($sql);
    
    $items = [];
    while ($row = $stmt->fetch()) {
        $items[] = $row;
    }
    
    return $items;
}

/**
 * Get user's habitus data - FIXED VERSION
 * @param int $userId - User ID
 * @return array - User's habitus data
 */
function getUserHabitusData($userId) {
    global $conn;
    
    // Get active room - removed background_id reference
    $sql = "SELECT r.id, r.name, r.floor_color, r.wall_color,
            r.id as active_room_id
            FROM rooms r
            WHERE r.user_id = ?
            ORDER BY r.id LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() === 0) {
        // Create a default room if none exists
        $defaultRoom = createDefaultRoom($userId);
        return $defaultRoom;
    }
    
    $roomData = $stmt->fetch();
    
    // Since we don't have a preview_image system, we'll return null for it
    $roomData['preview_image'] = null;
    
    return $roomData;
}

/**
 * Create default room for new user - FIXED VERSION
 * @param int $userId - User ID
 * @return array - Default room data
 */
function createDefaultRoom($userId) {
    global $conn;
    
    $roomName = "My First Room";
    
    // Use the correct column names based on your database schema
    $sql = "INSERT INTO rooms (user_id, name, floor_color, wall_color) VALUES (?, ?, '#FFD700', '#E0E0E0')";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId, $roomName]);
    
    $roomId = $conn->lastInsertId();
    
    return [
        'id' => $roomId,
        'name' => $roomName,
        'floor_color' => '#FFD700',
        'wall_color' => '#E0E0E0',
        'preview_image' => null,
        'active_room_id' => $roomId
    ];
}

/**
 * Get user's rooms - FIXED VERSION
 * @param int $userId - User ID
 * @return array - User's rooms
 */
function getUserRooms($userId) {
    global $conn;
    
    // Removed the background reference since it doesn't exist in your schema
    $sql = "SELECT r.id, r.name, 
            'images/backgrounds/default_room.png' as thumbnail
            FROM rooms r
            WHERE r.user_id = ?
            ORDER BY r.id";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$userId]);
    
    $rooms = [];
    while ($row = $stmt->fetch()) {
        $rooms[] = $row;
    }
    
    return $rooms;
}

/**
 * Get the number of unread notifications for a user
 * @param int $userId - User ID
 * @return int - Number of unread notifications
 */
function getUnreadNotificationsCount($userId) {
    global $conn;
    
    $query = "SELECT COUNT(*) as count FROM notifications 
              WHERE user_id = ? AND `read` = 0";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        return $stmt->fetch()['count'];
    }
    
    return 0;
}

/**
 * Get user's notifications
 * @param int $userId - User ID
 * @param int $limit - Maximum number of notifications to return (default 10)
 * @return array - Array of notification data
 */
function getUserNotifications($userId, $limit = 10) {
    global $conn;
    
    // Convert limit to integer to ensure it's safe
    $limit = (int)$limit;
    
    // Use the limit directly in the query string instead of as a parameter
    $query = "SELECT * FROM notifications 
              WHERE user_id = ? 
              ORDER BY created_at DESC 
              LIMIT $limit";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$userId]);
    
    $notifications = [];
    while ($row = $stmt->fetch()) {
        $notifications[] = $row;
    }
    
    return $notifications;
}

/**
 * Format notification time to be more human-readable
 * @param string $timestamp - Timestamp to format
 * @return string - Formatted time string
 */
function formatNotificationTime($timestamp) {
    $time = strtotime($timestamp);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return "Just now";
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . " min" . ($minutes > 1 ? "s" : "") . " ago";
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . " hour" . ($hours > 1 ? "s" : "") . " ago";
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . " day" . ($days > 1 ? "s" : "") . " ago";
    } else {
        return date("M j, Y", $time);
    }
}

/**
 * Get subtasks for a task
 * @param int $taskId - Parent task ID
 * @return array - Array of subtask data
 */
function getSubtasks($taskId) {
    global $conn;
    
    $sql = "SELECT id, title, description, is_completed, order_position 
            FROM subtasks 
            WHERE parent_task_id = ? 
            ORDER BY order_position, id";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    
    $subtasks = [];
    while ($row = $stmt->fetch()) {
        $subtasks[] = $row;
    }
    
    return $subtasks;
}

/**
 * Create a new subtask
 * @param int $taskId - Parent task ID
 * @param string $title - Subtask title
 * @param string $description - Subtask description (optional)
 * @return int - ID of the created subtask
 */
function createSubtask($taskId, $title, $description = '') {
    global $conn;
    
    // Get highest order position
    $sql = "SELECT MAX(order_position) as max_pos FROM subtasks WHERE parent_task_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    $result = $stmt->fetch();
    $orderPosition = ($result['max_pos'] !== null) ? $result['max_pos'] + 1 : 0;
    
    // Create subtask
    $sql = "INSERT INTO subtasks (parent_task_id, title, description, order_position) 
            VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId, $title, $description, $orderPosition]);
    
    return $conn->lastInsertId();
}

/**
 * Update subtask completion status
 * @param int $subtaskId - Subtask ID
 * @param bool $completed - Completion status
 * @return bool - Success status
 */
function updateSubtaskStatus($subtaskId, $completed) {
    global $conn;
    
    $sql = "UPDATE subtasks SET is_completed = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$completed ? 1 : 0, $subtaskId]);
    
    return $stmt->rowCount() > 0;
}

/**
 * Check if all subtasks are completed for a task
 * @param int $taskId - Parent task ID
 * @return bool - True if all completed or no subtasks
 */
function areAllSubtasksCompleted($taskId) {
    global $conn;
    
    $sql = "SELECT COUNT(*) as total, SUM(is_completed) as completed 
            FROM subtasks 
            WHERE parent_task_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    $result = $stmt->fetch();
    
    // If no subtasks, return true
    if ($result['total'] == 0) {
        return true;
    }
    
    // Check if all subtasks are completed
    return $result['total'] == $result['completed'];
}

/**
 * Update goal progress based on subtask completion
 * @param int $taskId - Parent task ID
 */
function updateGoalProgress($taskId) {
    global $conn;
    
    // Get number of completed subtasks
    $sql = "SELECT COUNT(*) as completed FROM subtasks 
            WHERE parent_task_id = ? AND is_completed = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    $completed = $stmt->fetch()['completed'];
    
    // Get total number of subtasks
    $sql = "SELECT COUNT(*) as total FROM subtasks WHERE parent_task_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    $total = $stmt->fetch()['total'];
    
    // If no subtasks, don't update progress
    if ($total == 0) {
        return;
    }
    
    // Update goal progress
    $sql = "UPDATE goals SET progress = ? WHERE task_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$completed, $taskId]);
}

/**
 * Count subtasks for a task
 * @param int $taskId - Parent task ID
 * @return int - Number of subtasks
 */
function countSubtasks($taskId) {
    global $conn;
    
    $sql = "SELECT COUNT(*) as count FROM subtasks WHERE parent_task_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    
    return $stmt->fetch()['count'];
}

/**
 * Count completed subtasks for a task
 * @param int $taskId - Parent task ID
 * @return int - Number of completed subtasks
 */
function countCompletedSubtasks($taskId) {
    global $conn;
    
    $sql = "SELECT COUNT(*) as count FROM subtasks WHERE parent_task_id = ? AND is_completed = 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$taskId]);
    
    return $stmt->fetch()['count'];
}