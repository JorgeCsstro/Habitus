<?php
// php/api/habitus/rename_room.php

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

if (!$data || !isset($data['room_id']) || !isset($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Room ID and name are required']);
    exit;
}

$roomId = intval($data['room_id']);
$roomName = trim($data['name']);

if (empty($roomName)) {
    echo json_encode(['success' => false, 'message' => 'Room name cannot be empty']);
    exit;
}

// Verify room belongs to user
$verifyQuery = "SELECT id FROM rooms WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($verifyQuery);
$stmt->execute([$roomId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Room not found or does not belong to you']);
    exit;
}

// Update room name
$updateQuery = "UPDATE rooms SET name = ? WHERE id = ?";
$stmt = $conn->prepare($updateQuery);

try {
    $stmt->execute([$roomName, $roomId]);
    echo json_encode([
        'success' => true,
        'message' => 'Room renamed successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error renaming room']);
}
?>