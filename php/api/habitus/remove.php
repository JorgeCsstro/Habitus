<?php
// php/api/habitus/remove.php
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
$itemId = isset($_POST['id']) ? intval($_POST['id']) : 0;

if ($itemId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID']);
    exit;
}

// Verify item belongs to user's room
$itemQuery = "SELECT pi.id 
             FROM placed_items pi 
             JOIN rooms r ON pi.room_id = r.id 
             WHERE pi.id = ? AND r.user_id = ?";
$stmt = $conn->prepare($itemQuery);
$stmt->execute([$itemId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to you']);
    exit;
}

// Remove item
$deleteItem = "DELETE FROM placed_items WHERE id = ?";
$stmt = $conn->prepare($deleteItem);
$stmt->execute([$itemId]);

echo json_encode(['success' => true, 'message' => 'Item removed successfully']);
?>