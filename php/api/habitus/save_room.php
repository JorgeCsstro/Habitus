<?php
// php/api/habitus/save_room.php - Updated to handle surface parameter

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

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

$roomId = isset($data['room_id']) ? intval($data['room_id']) : 0;
$items = isset($data['items']) ? $data['items'] : [];

// Validate room belongs to user
$roomQuery = "SELECT id FROM rooms WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($roomQuery);
$stmt->execute([$roomId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Room not found or does not belong to you']);
    exit;
}

try {
    // Begin transaction
    $conn->beginTransaction();
    
    // First, remove all existing placed items for this room
    $deleteQuery = "DELETE FROM placed_items WHERE room_id = ?";
    $stmt = $conn->prepare($deleteQuery);
    $stmt->execute([$roomId]);
    
    // Map to store new IDs for temporary items
    $itemIds = [];
    
    // Insert new placed items
    foreach ($items as $item) {
        $inventoryId = intval($item['inventory_id']);
        $gridX = intval($item['grid_x']);
        $gridY = intval($item['grid_y']);
        $surface = isset($item['surface']) ? $item['surface'] : 'floor';
        $rotation = intval($item['rotation']);
        $zIndex = intval($item['z_index']);
        
        // Validate surface value
        if (!in_array($surface, ['floor', 'wall-left', 'wall-right'])) {
            throw new Exception("Invalid surface value: " . $surface);
        }
        
        // Verify inventory item belongs to user
        $inventoryQuery = "SELECT ui.id, si.allowed_surfaces 
                          FROM user_inventory ui 
                          JOIN shop_items si ON ui.item_id = si.id 
                          WHERE ui.id = ? AND ui.user_id = ?";
        $stmt = $conn->prepare($inventoryQuery);
        $stmt->execute([$inventoryId, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid inventory item");
        }
        
        $inventoryData = $stmt->fetch();
        
        // Check if item can be placed on this surface
        $allowedSurfaces = explode(',', $inventoryData['allowed_surfaces'] ?? 'floor');
        if (!in_array($surface, $allowedSurfaces)) {
            throw new Exception("Item cannot be placed on " . $surface);
        }
        
        // Insert placed item with surface
        $insertQuery = "INSERT INTO placed_items 
                       (room_id, inventory_id, surface, grid_x, grid_y, rotation, z_index) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($insertQuery);
        $stmt->execute([$roomId, $inventoryId, $surface, $gridX, $gridY, $rotation, $zIndex]);
        
        // If this was a temporary item, store the new ID
        if (isset($item['id']) && strpos($item['id'], 'temp_') === 0) {
            $itemIds[$item['id']] = $conn->lastInsertId();
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Room layout saved successfully',
        'item_ids' => $itemIds
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>