<?php
// php/api/user/get_update_details.php

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get notification ID
$notificationId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($notificationId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid notification ID']);
    exit;
}

// Get notification details
$query = "SELECT n.*, u.details 
          FROM notifications n
          LEFT JOIN updates u ON n.reference_id = u.id
          WHERE n.id = ? AND n.user_id = ? AND n.type = 'update'";

$stmt = $conn->prepare($query);
$stmt->execute([$notificationId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Update not found']);
    exit;
}

$update = $stmt->fetch();

echo json_encode([
    'success' => true,
    'details' => $update['details'] ?? ''
]);
?>