<?php
// pages/habitus.php - Enhanced with item size support

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';
require_once '../php/include/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('Location: login.php');
    exit;
}

// Get user data
$userData = getUserData($_SESSION['user_id']);
$userHCoins = $userData['hcoin'];
$userHabitusName = $userData['username'] . "'s Habitus";

// Get room ID from URL or use default
$roomId = isset($_GET['room_id']) ? intval($_GET['room_id']) : 0;

// Get user's rooms
$roomsQuery = "SELECT * FROM rooms WHERE user_id = ? ORDER BY id";
$stmt = $conn->prepare($roomsQuery);
$stmt->execute([$_SESSION['user_id']]);
$rooms = $stmt->fetchAll();

// If no room ID specified, use first room
if ($roomId === 0 && count($rooms) > 0) {
    $roomId = $rooms[0]['id'];
}

// If user has no rooms, create a default one
if (count($rooms) === 0) {
    $createRoomQuery = "INSERT INTO rooms (user_id, name, floor_color, wall_color) VALUES (?, 'My First Room', '#FFD700', '#E0E0E0')";
    $stmt = $conn->prepare($createRoomQuery);
    $stmt->execute([$_SESSION['user_id']]);
    $roomId = $conn->lastInsertId();
    
    // Reload rooms
    $stmt = $conn->prepare($roomsQuery);
    $stmt->execute([$_SESSION['user_id']]);
    $rooms = $stmt->fetchAll();
}

// Get current room data
$roomData = null;
foreach ($rooms as $room) {
    if ($room['id'] == $roomId) {
        $roomData = $room;
        break;
    }
}

// Get placed items for this room
$placedItemsQuery = "SELECT pi.*, ui.item_id, si.name, si.image_path, si.category_id, ic.name as category_name
                    FROM placed_items pi
                    JOIN user_inventory ui ON pi.inventory_id = ui.id
                    JOIN shop_items si ON ui.item_id = si.id
                    JOIN item_categories ic ON si.category_id = ic.id
                    WHERE pi.room_id = ?
                    ORDER BY pi.z_index";
$stmt = $conn->prepare($placedItemsQuery);
$stmt->execute([$roomId]);
$placedItems = $stmt->fetchAll();

// Get user's inventory with item sizes
$inventoryQuery = "SELECT ui.*, si.name, si.image_path, si.category_id, si.grid_width, si.grid_height, ic.name as category
                  FROM user_inventory ui
                  JOIN shop_items si ON ui.item_id = si.id
                  JOIN item_categories ic ON si.category_id = ic.id
                  WHERE ui.user_id = ? AND ui.quantity > 0
                  ORDER BY si.category_id, si.name";
$stmt = $conn->prepare($inventoryQuery);
$stmt->execute([$_SESSION['user_id']]);
$inventory = $stmt->fetchAll();

// Filter out items that are already placed (unless quantity > 1)
$availableInventory = [];
foreach ($inventory as $item) {
    $placedCount = 0;
    foreach ($placedItems as $placed) {
        if ($placed['inventory_id'] == $item['id']) {
            $placedCount++;
        }
    }
    
    if ($item['quantity'] > $placedCount) {
        $availableInventory[] = $item;
    }
}
$inventory = $availableInventory;

// Define default item sizes (can be moved to database)
$itemSizes = [
    'wooden_chair' => ['width' => 1, 'height' => 1],
    'simple_table' => ['width' => 2, 'height' => 2],
    'bookshelf' => ['width' => 1, 'height' => 2],
    'cozy_sofa' => ['width' => 3, 'height' => 2],
    'potted_plant' => ['width' => 1, 'height' => 1],
    'floor_lamp' => ['width' => 1, 'height' => 1],
    'picture_frame' => ['width' => 1, 'height' => 1],
    'cactus' => ['width' => 1, 'height' => 1],
    'wall_clock' => ['width' => 1, 'height' => 1]
];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Habitus Room - <?php echo SITE_NAME; ?></title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/habitus.css">
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
</head>
<body>
    <div class="main-container">
        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Habitus Content -->
            <div class="habitus-content">
                <div class="habitus-header">
                    <div class="room-selector">
                        <select id="room-select" onchange="changeRoom(this.value)">
                            <?php foreach ($rooms as $room): ?>
                                <option value="<?php echo $room['id']; ?>" <?php echo ($room['id'] == $roomId) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($room['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <button class="new-room-btn" onclick="createNewRoom()">+ New Room</button>
                        <button class="rename-room-btn" onclick="renameRoom()">Rename</button>
                    </div>
                    <div class="room-actions">
                        <button class="save-room-btn" onclick="saveRoom()">Save Layout</button>
                        <button class="clear-room-btn" onclick="clearRoom()">Clear Room</button>
                    </div>
                </div>

                <div class="habitus-editor">
                    <div class="room-container">
                        <div id="isometric-room" class="isometric-room">
                            <!-- Grid overlay -->
                            <div class="room-grid" id="room-grid"></div>
                            <!-- Floor -->
                            <div class="room-floor" id="room-floor"></div>
                            <!-- Left wall -->
                            <div class="room-wall-left" id="wall-left"></div>
                            <!-- Right wall -->
                            <div class="room-wall-right" id="wall-right"></div>
                            <!-- Door (non-placeable area) -->
                            <div class="room-door"></div>
                            <!-- Placed items container -->
                            <div class="placed-items" id="placed-items"></div>
                        </div>
                    </div>
                    
                    <div class="room-inventory">
                        <h3>Your Inventory</h3>
                        <div class="inventory-filters">
                            <button class="filter-btn active" data-filter="all" onclick="filterInventory('all')">All</button>
                            <button class="filter-btn" data-filter="furniture" onclick="filterInventory('furniture')">Furniture</button>
                            <button class="filter-btn" data-filter="decorations" onclick="filterInventory('decorations')">Decorations</button>
                            <button class="filter-btn" data-filter="walls" onclick="filterInventory('walls')">Walls</button>
                            <button class="filter-btn" data-filter="floors" onclick="filterInventory('floors')">Floors</button>
                        </div>
                        
                        <!-- Replace the inventory items section in habitus.php with this updated version -->
                        <div class="inventory-items" id="inventory-items">
                            <?php if (empty($inventory)): ?>
                                <p class="empty-inventory">Your inventory is empty. Visit the shop to buy items!</p>
                            <?php else: ?>
                                <?php foreach ($inventory as $item): ?>
                                    <?php
                                    // Get item size
                                    $itemBaseName = strtolower(preg_replace('/\.(jpg|png|webp|gif)$/i', '', basename($item['image_path'])));
                                    $itemWidth = isset($item['grid_width']) ? $item['grid_width'] : 1;
                                    $itemHeight = isset($item['grid_height']) ? $item['grid_height'] : 1;
                                    
                                    // Get allowed surfaces
                                    $allowedSurfaces = isset($item['allowed_surfaces']) ? explode(',', $item['allowed_surfaces']) : ['floor'];
                                    ?>
                                    <div class="inventory-item" 
                                         data-id="<?php echo $item['id']; ?>"
                                         data-item-id="<?php echo $item['item_id']; ?>"
                                         data-category="<?php echo strtolower($item['category']); ?>"
                                         data-image="<?php echo $item['image_path']; ?>"
                                         data-name="<?php echo htmlspecialchars($item['name']); ?>"
                                         data-allowed-surfaces="<?php echo htmlspecialchars($item['allowed_surfaces'] ?? 'floor'); ?>"
                                         draggable="true"
                                         ondragstart="startDrag(event)">
                                        <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                        <div class="item-info">
                                            <span class="item-name"><?php echo htmlspecialchars($item['name']); ?></span>
                                            <?php if ($item['quantity'] > 1): ?>
                                                <span class="item-quantity">x<?php echo $item['quantity']; ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <?php if ($itemWidth > 1 || $itemHeight > 1): ?>
                                            <div class="item-size-badge"><?php echo $itemWidth; ?>x<?php echo $itemHeight; ?></div>
                                        <?php endif; ?>
                                        
                                        <!-- Surface compatibility indicators -->
                                        <div class="item-surface-badge">
                                            <?php if (in_array('floor', $allowedSurfaces)): ?>
                                                <span class="surface-icon floor" title="Can be placed on floor">F</span>
                                            <?php endif; ?>
                                            <?php if (in_array('wall-left', $allowedSurfaces) || in_array('wall-right', $allowedSurfaces)): ?>
                                                <span class="surface-icon wall" title="Can be placed on walls">W</span>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        
                        <div class="inventory-actions">
                            <a href="shop.php" class="shop-btn">Shop for More Items</a>
                        </div>
                    </div>
                </div>
                
                <!-- Item context menu -->
                <div id="item-context-menu" class="item-context-menu" style="display: none;">
                    <button onclick="rotateItem()">Rotate</button>
                    <button onclick="moveToFront()">Bring to Front</button>
                    <button onclick="moveToBack()">Send to Back</button>
                    <button onclick="removeItem()">Remove</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Room name modal -->
    <div id="room-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3 id="modal-title">Create New Room</h3>
            <div class="form-group">
                <label for="room-name-input">Room Name</label>
                <input type="text" id="room-name-input" placeholder="Enter room name">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeRoomModal()">Cancel</button>
                <button class="save-btn" onclick="saveRoomName()">Save</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    <script src="../js/habitus-room.js"></script>
    <script>
        // Initialize the room with enhanced features
        document.addEventListener('DOMContentLoaded', function() {
            const roomData = <?php echo json_encode($roomData); ?>;
            const placedItems = <?php echo json_encode($placedItems); ?>;
            
            // Initialize the enhanced room system
            initializeHabitusRoom(roomData, placedItems);
        });
    </script>
</body>
</html>