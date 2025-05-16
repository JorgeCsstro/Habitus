<?php
// php/api/user/mark_notifications_read.php

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

if (!$data || !isset($data['notification_ids']) || !is_array($data['notification_ids'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$notificationIds = $data['notification_ids'];
if (empty($notificationIds)) {
    echo json_encode(['success' => true, 'message' => 'No notifications to mark as read']);
    exit;
}

// Prepare the query with placeholders
$placeholders = implode(',', array_fill(0, count($notificationIds), '?'));

$query = "UPDATE notifications SET `read` = 1 
          WHERE id IN ($placeholders) AND user_id = ?";

// Add all IDs to parameters array, then add user_id at the end
$params = $notificationIds;
$params[] = $_SESSION['user_id'];

$stmt = $conn->prepare($query);
$stmt->execute($params);

// Check how many rows were affected
if ($stmt->rowCount() > 0) {
    echo json_encode(['success' => true, 'message' => 'Notifications marked as read']);
} else {
    echo json_encode(['success' => false, 'message' => 'No notifications were updated']);
}
?>