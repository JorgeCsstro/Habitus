// php/api/habitus/place.php
<?php
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
$stmt->bind_param("ii", $roomId, $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Room not found or does not belong to you']);
    exit;
}

// Begin transaction
$conn->begin_transaction();

try {
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
        $stmt->bind_param("ii", $inventoryId, $_SESSION['user_id']);
        $stmt->execute();
        $inventoryResult = $stmt->get_result();
        
        if ($inventoryResult->num_rows === 0) {
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
            $stmt->bind_param("iiidiii", $positionX, $positionY, $rotation, 
                             $scale, $zIndex, $itemId, $roomId);
            $stmt->execute();
        } else {
            // Create new placed item
            $insertItem = "INSERT INTO placed_items 
                          (room_id, inventory_id, position_x, position_y, 
                          rotation, scale, z_index) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($insertItem);
            $stmt->bind_param("iiiiidi", $roomId, $inventoryId, $positionX, 
                             $positionY, $rotation, $scale, $zIndex);
            $stmt->execute();
            
            // Track new item ID
            $newItemIds[$inventoryId] = $conn->insert_id;
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
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

// php/api/habitus/remove.php
<?php
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
$stmt->bind_param("ii", $itemId, $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to you']);
    exit;
}

// Remove item
$deleteItem = "DELETE FROM placed_items WHERE id = ?";
$stmt = $conn->prepare($deleteItem);
$stmt->bind_param("i", $itemId);
$stmt->execute();

echo json_encode(['success' => true, 'message' => 'Item removed successfully']);
?>

// php/api/habitus/get_inventory_item.php
<?php
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
$stmt->bind_param("ii", $inventoryId, $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Item not found or does not belong to you']);
    exit;
}

$item = $result->fetch_assoc();

echo json_encode(['success' => true, 'item' => $item]);
?>

// php/api/habitus/create_room.php
<?php
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
$name = isset($_POST['name']) ? trim($_POST['name']) : '';

if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Room name is required']);
    exit;
}

// Create new room
$insertRoom = "INSERT INTO rooms (user_id, name, layout_json) VALUES (?, ?, '{}')";
$stmt = $conn->prepare($insertRoom);
$stmt->bind_param("is", $_SESSION['user_id'], $name);
$stmt->execute();

$roomId = $conn->insert_id;

echo json_encode([
    'success' => true,
    'message' => 'Room created successfully',
    'room_id' => $roomId
]);
?>