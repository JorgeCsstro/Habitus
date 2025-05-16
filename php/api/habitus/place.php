<?php
// php/api/habitus/place.php
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

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['room_id']) || !isset($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$roomId = intval($data['room_id']);
$items = $data['items'];

// Verify room belongs to user
$roomQuery = "SELECT id FROM rooms WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($roomQuery);
$stmt->execute([$roomId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Room not found or does not belong to you']);
    exit;
}

// Begin transaction
try {
    $conn->beginTransaction();

    // Track new item IDs
    $newItemIds = [];
    
    // Process each item
    foreach ($items as $item) {
        $inventoryId = intval($item['inventory_id']);
        $positionX = intval($item['position_x']);
        $positionY = intval($item['position_y']);
        $rotation = intval($item['rotation']);
        $scale = floatval($item['scale']);
        $zIndex = intval($item['z_index']);
        
        // Verify inventory item belongs to user
        $inventoryQuery = "SELECT id FROM user_inventory WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($inventoryQuery);
        $stmt->execute([$inventoryId, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Inventory item not found or does not belong to you");
        }
        
        if (isset($item['id']) && $item['id']) {
            // Update existing placed item
            $itemId = intval($item['id']);
            
            $updateItem = "UPDATE placed_items 
                          SET position_x = ?, position_y = ?, rotation = ?, 
                          scale = ?, z_index = ? 
                          WHERE id = ? AND room_id = ?";
            $stmt = $conn->prepare($updateItem);
            $stmt->execute([$positionX, $positionY, $rotation, $scale, $zIndex, $itemId, $roomId]);
        } else {
            // Create new placed item
            $insertItem = "INSERT INTO placed_items 
                          (room_id, inventory_id, position_x, position_y, 
                          rotation, scale, z_index) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($insertItem);
            $stmt->execute([$roomId, $inventoryId, $positionX, $positionY, $rotation, $scale, $zIndex]);
            
            // Track new item ID
            $newItemIds[$inventoryId] = $conn->lastInsertId();
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Room layout saved successfully',
        'item_ids' => $newItemIds
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>