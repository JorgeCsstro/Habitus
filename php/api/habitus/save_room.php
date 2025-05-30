<?php
// php/api/habitus/save_room.php - Fixed version with coordinate validation

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

// Grid configuration constants
define('GRID_SIZE', 6);
define('WALL_HEIGHT', 4);

// Function to check if position is in door area
function isDoorArea($x, $y, $surface) {
    // Door configuration:
    // - Left wall: column 1 (x=1), bottom 2 rows (y=2,3)
    // - Floor entrance: column 1 (x=1), first row (y=0)
    
    if ($surface === 'wall-left') {
        return $x === 1 && $y >= 2;
    }
    if ($surface === 'floor') {
        return $x === 1 && $y === 0;
    }
    return false;
}

// Function to get bounds for surface
function getBoundsForSurface($surface) {
    if ($surface === 'floor') {
        return ['maxX' => GRID_SIZE, 'maxY' => GRID_SIZE];
    } else if ($surface === 'wall-left') {
        return ['maxX' => GRID_SIZE, 'maxY' => WALL_HEIGHT];
    } else if ($surface === 'wall-right') {
        return ['maxX' => WALL_HEIGHT, 'maxY' => GRID_SIZE];
    }
    return ['maxX' => GRID_SIZE, 'maxY' => GRID_SIZE];
}

// Function to get item size
function getItemSize($itemId, $conn) {
    $query = "SELECT grid_width, grid_height FROM shop_items WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute([$itemId]);
    $result = $stmt->fetch();
    
    return [
        'width' => $result['grid_width'] ?? 1,
        'height' => $result['grid_height'] ?? 1
    ];
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
    $skippedItems = [];
    
    // Insert new placed items with validation
    foreach ($items as $item) {
        $inventoryId = intval($item['inventory_id']);
        $gridX = intval($item['grid_x']);
        $gridY = intval($item['grid_y']);
        $surface = isset($item['surface']) ? $item['surface'] : 'floor';
        $rotation = intval($item['rotation']);
        $zIndex = intval($item['z_index']);
        
        // Validate surface value
        if (!in_array($surface, ['floor', 'wall-left', 'wall-right'])) {
            $skippedItems[] = "Invalid surface: " . $surface;
            continue;
        }
        
        // Get item data to check size and allowed surfaces
        $inventoryQuery = "SELECT ui.id, ui.item_id, si.allowed_surfaces, si.grid_width, si.grid_height, si.name
                          FROM user_inventory ui 
                          JOIN shop_items si ON ui.item_id = si.id 
                          WHERE ui.id = ? AND ui.user_id = ?";
        $stmt = $conn->prepare($inventoryQuery);
        $stmt->execute([$inventoryId, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            $skippedItems[] = "Invalid inventory item: " . $inventoryId;
            continue;
        }
        
        $inventoryData = $stmt->fetch();
        $itemWidth = $inventoryData['grid_width'] ?? 1;
        $itemHeight = $inventoryData['grid_height'] ?? 1;
        
        // Check if item can be placed on this surface
        $allowedSurfaces = explode(',', $inventoryData['allowed_surfaces'] ?? 'floor');
        if (!in_array($surface, $allowedSurfaces)) {
            $skippedItems[] = $inventoryData['name'] . " cannot be placed on " . $surface;
            continue;
        }
        
        // Get bounds for the surface
        $bounds = getBoundsForSurface($surface);
        
        // Check if position is within bounds
        if ($gridX < 0 || $gridY < 0 || 
            $gridX + $itemWidth > $bounds['maxX'] || 
            $gridY + $itemHeight > $bounds['maxY']) {
            $skippedItems[] = $inventoryData['name'] . " is out of bounds at position (" . $gridX . "," . $gridY . ")";
            continue;
        }
        
        // Check if any part of the item is in door area
        $inDoorArea = false;
        for ($dy = 0; $dy < $itemHeight; $dy++) {
            for ($dx = 0; $dx < $itemWidth; $dx++) {
                if (isDoorArea($gridX + $dx, $gridY + $dy, $surface)) {
                    $inDoorArea = true;
                    break 2;
                }
            }
        }
        
        if ($inDoorArea) {
            $skippedItems[] = $inventoryData['name'] . " would block the door at position (" . $gridX . "," . $gridY . ")";
            continue;
        }
        
        if (isDoorArea($gridX, $gridY, $surface)) {
            $skippedItems[] = $inventoryData['name'] . " cannot be placed in door area";
            continue;
        }

        // Insert placed item
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
    
    $response = [
        'success' => true,
        'message' => 'Room layout saved successfully',
        'item_ids' => $itemIds
    ];
    
    if (!empty($skippedItems)) {
        $response['warnings'] = $skippedItems;
        $response['message'] .= ' (Some items were skipped due to invalid placement)';
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>