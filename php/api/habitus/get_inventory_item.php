<?php
// php/api/habitus/get_inventory_item.php
require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get inventory item ID
$inventoryId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($inventoryId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid inventory item ID']);
    exit;
}

// Get inventory item details
$itemQuery = "SELECT ui.id, ui.item_id, ui.quantity, si.name, si.image_path, 
             si.description, ic.name as category 
             FROM user_inventory ui 
             JOIN shop_items si ON ui.item_id = si.id 
             JOIN item_categories ic ON si.category_id = ic.id 
             WHERE ui.id = ? AND ui.user_id = ?";
$stmt = $conn->prepare($itemQuery);
$stmt->execute([$inventoryId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to you']);
    exit;
}

$item = $stmt->fetch();

echo json_encode(['success' => true, 'item' => $item]);
?>