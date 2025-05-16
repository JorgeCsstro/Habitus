<?php
// php/api/habitus/create_room.php
require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$name = isset($_POST['name']) ? trim($_POST['name']) : '';

if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Room name is required']);
    exit;
}

// Create new room
$insertRoom = "INSERT INTO rooms (user_id, name, layout_json) VALUES (?, ?, '{}')";
$stmt = $conn->prepare($insertRoom);
$stmt->execute([$_SESSION['user_id'], $name]);

$roomId = $conn->lastInsertId();

echo json_encode([
    'success' => true,
    'message' => 'Room created successfully',
    'room_id' => $roomId
]);
?>