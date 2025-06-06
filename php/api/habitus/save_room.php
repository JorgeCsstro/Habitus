<?php
// php/api/habitus/save_room.php - Enhanced for inventory tracking system

require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON response header
header('Content-Type: application/json');

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
    'timestamp' => date('Y-m-d H:i:s'),
    'system_version' => 'enhanced_inventory_tracking_v1.0'
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

// Enhanced validation functions
function isDoorArea($x, $y, $surface) {
    if ($surface === 'wall-left') {
        return $x === 1 && $y >= 2;
    }
    if ($surface === 'floor') {
        return $x === 1 && $y === 0;
    }
    return false;
}

function getBoundsForSurface($surface) {
    switch ($surface) {
        case 'floor':
            return ['maxX' => GRID_SIZE, 'maxY' => GRID_SIZE];
        case 'wall-left':
            return ['maxX' => GRID_SIZE, 'maxY' => WALL_HEIGHT];
        case 'wall-right':
            return ['maxX' => WALL_HEIGHT, 'maxY' => GRID_SIZE];
        default:
            return ['maxX' => GRID_SIZE, 'maxY' => GRID_SIZE];
    }
}

function validateItemPlacement($item, $conn, $userId, $roomId) {
    $errors = [];
    
    // Validate required fields
    $requiredFields = ['inventory_id', 'grid_x', 'grid_y'];
    foreach ($requiredFields as $field) {
        if (!isset($item[$field])) {
            $errors[] = "Missing required field: $field";
        }
    }
    
    if (!empty($errors)) {
        return ['valid' => false, 'errors' => $errors];
    }
    
    $inventoryId = intval($item['inventory_id']);
    $gridX = intval($item['grid_x']);
    $gridY = intval($item['grid_y']);
    $surface = isset($item['surface']) ? $item['surface'] : 'floor';
    
    // Validate surface
    if (!in_array($surface, ['floor', 'wall-left', 'wall-right'])) {
        $errors[] = "Invalid surface: $surface";
    }
    
    // FIXED: Enhanced inventory validation
    $inventoryQuery = "SELECT ui.id, ui.item_id, ui.quantity, si.allowed_surfaces, 
                      si.grid_width, si.grid_height, si.name
                      FROM user_inventory ui 
                      JOIN shop_items si ON ui.item_id = si.id 
                      WHERE ui.id = ? AND ui.user_id = ?";
    $stmt = $conn->prepare($inventoryQuery);
    $stmt->execute([$inventoryId, $userId]);
    
    if ($stmt->rowCount() === 0) {
        $errors[] = "Invalid inventory item ID: $inventoryId";
        return ['valid' => false, 'errors' => $errors];
    }
    
    $inventoryData = $stmt->fetch();
    $itemWidth = $inventoryData['grid_width'] ?? 1;
    $itemHeight = $inventoryData['grid_height'] ?? 1;
    
    // FIXED: Check if user has enough of this item in inventory
    $usedQuery = "SELECT COUNT(*) as used_count FROM placed_items 
                  WHERE inventory_id = ? AND room_id IN (
                      SELECT id FROM rooms WHERE user_id = ?
                  )";
    $stmt = $conn->prepare($usedQuery);
    $stmt->execute([$inventoryId, $userId]);
    $usedCount = $stmt->fetch()['used_count'];
    
    if ($usedCount >= $inventoryData['quantity']) {
        $errors[] = "No more of this item available in inventory (quantity: {$inventoryData['quantity']}, used: {$usedCount})";
    }
    
    // Check surface compatibility
    $allowedSurfaces = explode(',', $inventoryData['allowed_surfaces'] ?? 'floor');
    if (!in_array($surface, $allowedSurfaces)) {
        $errors[] = "Item '{$inventoryData['name']}' cannot be placed on $surface";
    }
    
    // Check bounds
    $bounds = getBoundsForSurface($surface);
    if ($gridX < 0 || $gridY < 0 || 
        $gridX + $itemWidth > $bounds['maxX'] || 
        $gridY + $itemHeight > $bounds['maxY']) {
        $errors[] = "Item placement out of bounds";
    }
    
    // Check door area
    for ($dy = 0; $dy < $itemHeight; $dy++) {
        for ($dx = 0; $dx < $itemWidth; $dx++) {
            if (isDoorArea($gridX + $dx, $gridY + $dy, $surface)) {
                $errors[] = "Item would block the door area";
                break 2;
            }
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'inventory_data' => $inventoryData
    ];
}

try {
    // Begin transaction
    $conn->beginTransaction();
    
    // FIXED: Get current placed items for this room to track what's being removed
    $currentItemsQuery = "SELECT inventory_id FROM placed_items WHERE room_id = ?";
    $stmt = $conn->prepare($currentItemsQuery);
    $stmt->execute([$roomId]);
    $currentItems = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Remove all existing placed items for this room
    $deleteQuery = "DELETE FROM placed_items WHERE room_id = ?";
    $stmt = $conn->prepare($deleteQuery);
    $stmt->execute([$roomId]);
    $deletedCount = $stmt->rowCount();
    
    $debugInfo['deleted_items'] = $deletedCount;
    $debugInfo['previous_inventory_usage'] = array_count_values($currentItems);
    
    // Track processing results
    $itemIds = [];
    $skippedItems = [];
    $processedItems = [];
    $inventoryUsage = [];
    
    // Process valid items
    foreach ($items as $index => $item) {
        $validation = validateItemPlacement($item, $conn, $_SESSION['user_id'], $roomId);
        
        if (!$validation['valid']) {
            $skippedItems[] = "Item at index $index: " . implode(', ', $validation['errors']);
            continue;
        }
        
        $inventoryId = intval($item['inventory_id']);
        $gridX = intval($item['grid_x']);
        $gridY = intval($item['grid_y']);
        $surface = isset($item['surface']) ? $item['surface'] : 'floor';
        $rotation = isset($item['rotation']) ? intval($item['rotation']) : 0;
        $zIndex = isset($item['z_index']) ? intval($item['z_index']) : 1;
        
        // Track inventory usage for validation
        if (isset($inventoryUsage[$inventoryId])) {
            $inventoryUsage[$inventoryId]++;
        } else {
            $inventoryUsage[$inventoryId] = 1;
        }
        
        // FIXED: Additional check for inventory quantity during processing
        $totalUsedNow = $inventoryUsage[$inventoryId];
        $availableQuantity = $validation['inventory_data']['quantity'];
        
        if ($totalUsedNow > $availableQuantity) {
            $skippedItems[] = "Item at index $index: Exceeds available quantity (trying to place {$totalUsedNow}, only have {$availableQuantity})";
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
            
            // Track new ID for temporary items
            if (isset($item['id']) && strpos($item['id'], 'temp_') === 0) {
                $itemIds[$item['id']] = $newId;
            }
            
            $processedItems[] = [
                'id' => $newId,
                'inventory_id' => $inventoryId,
                'position' => "[$gridX, $gridY]",
                'surface' => $surface,
                'name' => $validation['inventory_data']['name']
            ];
        } else {
            $skippedItems[] = "Item at index $index: Database insertion failed";
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Create comprehensive response
    $response = [
        'success' => true,
        'message' => 'Room layout saved successfully',
        'item_ids' => $itemIds,
        'stats' => [
            'total_items_received' => count($items),
            'items_processed' => count($processedItems),
            'items_skipped' => count($skippedItems),
            'items_deleted_from_db' => $deletedCount
        ],
        'inventory_usage' => $inventoryUsage
    ];
    
    // Add warnings if items were skipped
    if (!empty($skippedItems)) {
        $response['warnings'] = $skippedItems;
        $response['message'] .= ' (Some items were skipped due to validation issues)';
    }
    
    // Add debug info in development mode
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        $response['debug'] = array_merge($debugInfo, [
            'processed_items' => $processedItems,
            'inventory_usage_final' => $inventoryUsage
        ]);
    }
    
    // Log successful save for analytics
    error_log("Room Save Success: User {$_SESSION['user_id']}, Room $roomId, Items: {$response['stats']['items_processed']}");
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollBack();
    
    $errorResponse = [
        'success' => false, 
        'message' => 'Database error occurred while saving room layout',
        'error_details' => $e->getMessage(),
        'debug' => $debugInfo
    ];
    
    // Log the error
    error_log("Save Room Error: " . $e->getMessage() . " | Debug: " . json_encode($debugInfo));
    
    echo json_encode($errorResponse);
}
?>