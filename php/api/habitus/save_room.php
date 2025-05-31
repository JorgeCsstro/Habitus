<?php
// php/api/habitus/save_room.php - ENHANCED VERSION with better debugging

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Enhanced debugging
$debugInfo = [
    'received_data' => $data,
    'user_id' => $_SESSION['user_id'],
    'timestamp' => date('Y-m-d H:i:s')
];

if (!$data) {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON data format',
        'debug' => $debugInfo
    ]);
    exit;
}

$roomId = isset($data['room_id']) ? intval($data['room_id']) : 0;
$items = isset($data['items']) ? $data['items'] : [];

$debugInfo['room_id'] = $roomId;
$debugInfo['items_count'] = count($items);

// Validate room belongs to user
$roomQuery = "SELECT id, name FROM rooms WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($roomQuery);
$stmt->execute([$roomId, $_SESSION['user_id']]);

if ($stmt->rowCount() === 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'Room not found or does not belong to you',
        'debug' => $debugInfo
    ]);
    exit;
}

$roomInfo = $stmt->fetch();
$debugInfo['room_name'] = $roomInfo['name'];

// Grid configuration constants
define('GRID_SIZE', 6);
define('WALL_HEIGHT', 4);

// Function to check if position is in door area
function isDoorArea($x, $y, $surface) {
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

try {
    // Begin transaction
    $conn->beginTransaction();
    
    // First, remove all existing placed items for this room
    $deleteQuery = "DELETE FROM placed_items WHERE room_id = ?";
    $stmt = $conn->prepare($deleteQuery);
    $stmt->execute([$roomId]);
    $deletedCount = $stmt->rowCount();
    
    $debugInfo['deleted_items'] = $deletedCount;
    
    // Map to store new IDs for temporary items
    $itemIds = [];
    $skippedItems = [];
    $processedItems = [];
    
    // Insert new placed items with validation
    foreach ($items as $index => $item) {
        $itemDebug = ['index' => $index, 'item' => $item];
        
        // Validate required fields
        if (!isset($item['inventory_id']) || !isset($item['grid_x']) || !isset($item['grid_y'])) {
            $skippedItems[] = "Item at index $index: Missing required fields (inventory_id, grid_x, grid_y)";
            continue;
        }
        
        $inventoryId = intval($item['inventory_id']);
        $gridX = intval($item['grid_x']);
        $gridY = intval($item['grid_y']);
        $surface = isset($item['surface']) ? $item['surface'] : 'floor';
        $rotation = isset($item['rotation']) ? intval($item['rotation']) : 0;
        $zIndex = isset($item['z_index']) ? intval($item['z_index']) : 1;
        
        $itemDebug['processed_values'] = [
            'inventory_id' => $inventoryId,
            'grid_x' => $gridX,
            'grid_y' => $gridY,
            'surface' => $surface,
            'rotation' => $rotation,
            'z_index' => $zIndex
        ];
        
        // Validate surface value
        if (!in_array($surface, ['floor', 'wall-left', 'wall-right'])) {
            $skippedItems[] = "Item at index $index: Invalid surface '$surface'";
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
            $skippedItems[] = "Item at index $index: Invalid inventory item ID $inventoryId";
            continue;
        }
        
        $inventoryData = $stmt->fetch();
        $itemWidth = $inventoryData['grid_width'] ?? 1;
        $itemHeight = $inventoryData['grid_height'] ?? 1;
        
        $itemDebug['inventory_data'] = $inventoryData;
        
        // Check if item can be placed on this surface
        $allowedSurfaces = explode(',', $inventoryData['allowed_surfaces'] ?? 'floor');
        if (!in_array($surface, $allowedSurfaces)) {
            $skippedItems[] = "Item at index $index: {$inventoryData['name']} cannot be placed on $surface (allowed: " . implode(', ', $allowedSurfaces) . ")";
            continue;
        }
        
        // Get bounds for the surface
        $bounds = getBoundsForSurface($surface);
        
        // Check if position is within bounds
        if ($gridX < 0 || $gridY < 0 || 
            $gridX + $itemWidth > $bounds['maxX'] || 
            $gridY + $itemHeight > $bounds['maxY']) {
            $skippedItems[] = "Item at index $index: {$inventoryData['name']} is out of bounds at position ($gridX,$gridY) with size {$itemWidth}x{$itemHeight} on $surface (max: {$bounds['maxX']}x{$bounds['maxY']})";
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
            $skippedItems[] = "Item at index $index: {$inventoryData['name']} would block the door at position ($gridX,$gridY)";
            continue;
        }

        // Insert placed item
        $insertQuery = "INSERT INTO placed_items 
                       (room_id, inventory_id, surface, grid_x, grid_y, rotation, z_index) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($insertQuery);
        $result = $stmt->execute([$roomId, $inventoryId, $surface, $gridX, $gridY, $rotation, $zIndex]);
        
        if ($result) {
            $newId = $conn->lastInsertId();
            $itemDebug['new_id'] = $newId;
            
            // If this was a temporary item, store the new ID
            if (isset($item['id']) && strpos($item['id'], 'temp_') === 0) {
                $itemIds[$item['id']] = $newId;
            }
            
            $processedItems[] = $itemDebug;
        } else {
            $skippedItems[] = "Item at index $index: Database insertion failed for {$inventoryData['name']}";
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Enhanced response with debugging info
    $response = [
        'success' => true,
        'message' => 'Room layout saved successfully',
        'item_ids' => $itemIds,
        'stats' => [
            'total_items_received' => count($items),
            'items_processed' => count($processedItems),
            'items_skipped' => count($skippedItems),
            'items_deleted' => $deletedCount
        ]
    ];
    
    if (!empty($skippedItems)) {
        $response['warnings'] = $skippedItems;
        $response['message'] .= ' (Some items were skipped due to validation issues)';
    }
    
    // Add debug info in development
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        $response['debug'] = $debugInfo;
        $response['processed_items'] = $processedItems;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollBack();
    
    $errorResponse = [
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'debug' => $debugInfo
    ];
    
    // Log the error for debugging
    error_log("Save Room Error: " . $e->getMessage() . " | Debug: " . json_encode($debugInfo));
    
    echo json_encode($errorResponse);
}
?>