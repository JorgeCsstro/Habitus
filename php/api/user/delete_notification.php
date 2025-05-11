<?php
// php/api/user/delete_notification.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['notification_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$notificationId = intval($data['notification_id']);

// Delete notification
$query = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $notificationId, $_SESSION['user_id']);
$stmt->execute();

// Check if notification was deleted
if ($stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Notification deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Notification not found or could not be deleted']);
}
?>
