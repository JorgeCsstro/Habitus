<?php
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
$roomId = isset($_POST['room_id']) ? intval($_POST['room_id']) : 0;
$name = isset($_POST['name']) ? trim($_POST['name']) : '';

if (empty($name) || $roomId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Room name and ID are required']);
    exit;
}

// Verify room belongs to user
$roomQuery = "SELECT id FROM rooms WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($roomQuery);
$stmt->execute([$roomId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Room not found or does not belong to you']);
    exit;
}

// Update room name
$updateRoom = "UPDATE rooms SET name = ? WHERE id = ?";
$stmt = $conn->prepare($updateRoom);
$stmt->execute([$name, $roomId]);

echo json_encode([
    'success' => true,
    'message' => 'Room renamed successfully'
]);
?>
