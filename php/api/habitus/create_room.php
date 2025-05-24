<?php
// php/api/habitus/create_room.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Room name is required']);
    exit;
}

$roomName = trim($data['name']);

if (empty($roomName)) {
    echo json_encode(['success' => false, 'message' => 'Room name cannot be empty']);
    exit;
}

// Check room limit (optional - e.g., max 5 rooms per user)
$countQuery = "SELECT COUNT(*) as room_count FROM rooms WHERE user_id = ?";
$stmt = $conn->prepare($countQuery);
$stmt->execute([$_SESSION['user_id']]);
$result = $stmt->fetch();

if ($result['room_count'] >= 5) {
    echo json_encode(['success' => false, 'message' => 'You have reached the maximum number of rooms (5)']);
    exit;
}

// Create new room
$insertQuery = "INSERT INTO rooms (user_id, name, floor_color, wall_color) VALUES (?, ?, '#FFD700', '#E0E0E0')";
$stmt = $conn->prepare($insertQuery);

try {
    $stmt->execute([$_SESSION['user_id'], $roomName]);
    $roomId = $conn->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'room_id' => $roomId,
        'message' => 'Room created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error creating room']);
}
?>