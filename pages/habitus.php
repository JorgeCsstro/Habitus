// pages/habitus.php
<?php
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

// Get user's current room
$roomId = isset($_GET['room_id']) ? intval($_GET['room_id']) : 0;

if ($roomId <= 0) {
    // Get user's default room
    $roomQuery = "SELECT id FROM rooms WHERE user_id = ? ORDER BY id LIMIT 1";
    $stmt = $conn->prepare($roomQuery);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $roomId = $result->fetch_assoc()['id'];
    } else {
        // Create a default room if none exists
        $createRoom = "INSERT INTO rooms (user_id, name, layout_json) VALUES (?, 'My First Room', '{}')";
        $stmt = $conn->prepare($createRoom);
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $roomId = $conn->insert_id;
    }
}

// Get room details
$roomQuery = "SELECT r.*, si.name as background_name, si.image_path as background_image 
             FROM rooms r 
             LEFT JOIN shop_items si ON r.background_id = si.id 
             WHERE r.id = ? AND r.user_id = ?";
$stmt = $conn->prepare($roomQuery);
$stmt->bind_param("ii", $roomId, $_SESSION['user_id']);
$stmt->execute();
$roomResult = $stmt->get_result();

if ($roomResult->num_rows === 0) {
    // Room not found or doesn't belong to user
    header('Location: dashboard.php');
    exit;
}

$roomData = $roomResult->fetch_assoc();

// Get placed items
$placedQuery = "SELECT pi.*, ui.item_id, si.name, si.image_path 
               FROM placed_items pi 
               JOIN user_inventory ui ON pi.inventory_id = ui.id 
               JOIN shop_items si ON ui.item_id = si.id 
               WHERE pi.room_id = ? 
               ORDER BY pi.z_index";
$stmt = $conn->prepare($placedQuery);
$stmt->bind_param("i", $roomId);
$stmt->execute();
$placedResult = $stmt->get_result();

$placedItems = [];
while ($row = $placedResult->fetch_assoc()) {
    $placedItems[] = $row;
}

// Get user's inventory (not placed in any room)
$inventoryQuery = "SELECT ui.id, ui.item_id, ui.quantity, si.name, si.image_path, si.description, 
                  ic.name as category 
                  FROM user_inventory ui 
                  JOIN shop_items si ON ui.item_id = si.id 
                  JOIN item_categories ic ON si.category_id = ic.id 
                  WHERE ui.user_id = ? AND (
                      ui.id NOT IN (SELECT inventory_id FROM placed_items) 
                      OR ui.quantity > 1
                  )";
$stmt = $conn->prepare($inventoryQuery);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$inventoryResult = $stmt->get_result();

$inventory = [];
while ($row = $inventoryResult->fetch_assoc()) {
    $inventory[] = $row;
}

// Get user's rooms
$roomsQuery = "SELECT id, name FROM rooms WHERE user_id = ?";
$stmt = $conn->prepare($roomsQuery);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$roomsResult = $stmt->get_result();

$rooms = [];
while ($row = $roomsResult->fetch_assoc()) {
    $rooms[] = $row;
}
?>

<!DOCTYPE html>
<html lang="en">
<!-- Update the head section of habitus.php -->
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
                        <button class="save-room-btn" onclick="saveRoomLayout()">Save Layout</button>
                    </div>
                </div>

                <div class="habitus-editor">
                    <div class="room-canvas-container">
                        <div id="room-canvas" class="room-canvas"></div>
                    </div>
                    
                    <div class="room-inventory">
                        <h3>Your Inventory</h3>
                        <div class="inventory-filters">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="furniture">Furniture</button>
                            <button class="filter-btn" data-filter="decorations">Decorations</button>
                            <button class="filter-btn" data-filter="backgrounds">Backgrounds</button>
                        </div>
                        
                        <div class="inventory-items">
                            <?php if (empty($inventory)): ?>
                                <p class="empty-inventory">Your inventory is empty. Visit the shop to buy items!</p>
                            <?php else: ?>
                                <?php foreach ($inventory as $item): ?>
                                    <div class="inventory-item" 
                                         data-id="<?php echo $item['id']; ?>"
                                         data-category="<?php echo strtolower($item['category']); ?>"
                                         draggable="true">
                                        <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                        <div class="item-info">
                                            <span class="item-name"><?php echo htmlspecialchars($item['name']); ?></span>
                                            <?php if ($item['quantity'] > 1): ?>
                                                <span class="item-quantity">x<?php echo $item['quantity']; ?></span>
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
                
                <div class="room-item-controls" style="display: none;">
                    <button class="rotate-left-btn"><img src="../images/icons/rotate-left.svg" alt="Rotate Left"></button>
                    <button class="rotate-right-btn"><img src="../images/icons/rotate-right.svg" alt="Rotate Right"></button>
                    <button class="bring-forward-btn"><img src="../images/icons/layer-up.svg" alt="Bring Forward"></button>
                    <button class="send-backward-btn"><img src="../images/icons/layer-down.svg" alt="Send Backward"></button>
                    <button class="remove-item-btn"><img src="../images/icons/trash.svg" alt="Remove"></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Templates for modals -->
    <div id="new-room-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>Create New Room</h3>
            <div class="form-group">
                <label for="new-room-name">Room Name</label>
                <input type="text" id="new-room-name" placeholder="My Awesome Room">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeModal('new-room-modal')">Cancel</button>
                <button class="create-btn" onclick="submitNewRoom()">Create</button>
            </div>
        </div>
    </div>

    <div id="rename-room-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>Rename Room</h3>
            <div class="form-group">
                <label for="room-name">New Name</label>
                <input type="text" id="room-name" value="<?php echo htmlspecialchars($roomData['name']); ?>">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeModal('rename-room-modal')">Cancel</button>
                <button class="save-btn" onclick="submitRenameRoom()">Save</button>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.2.1/fabric.min.js"></script>
    <script src="../js/habitus.js"></script>
    <script>
        // Initialize room canvas
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the room editor
            initRoomEditor(<?php echo $roomId; ?>, <?php echo json_encode($placedItems); ?>);
            
            // Initialize inventory drag and drop
            initInventoryDragDrop();
            
            // Initialize filter buttons
            initFilterButtons();
        });
        
        function changeRoom(roomId) {
            window.location.href = 'habitus.php?room_id=' + roomId;
        }
        
        function createNewRoom() {
            document.getElementById('new-room-modal').style.display = 'flex';
        }
        
        function renameRoom() {
            document.getElementById('rename-room-modal').style.display = 'flex';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function submitNewRoom() {
            const name = document.getElementById('new-room-name').value.trim();
            if (name === '') {
                alert('Please enter a room name');
                return;
            }
            
            // Create new room via AJAX
            fetch('../php/api/habitus/create_room.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'name=' + encodeURIComponent(name)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'habitus.php?room_id=' + data.room_id;
                } else {
                    alert('Error creating room: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while creating the room');
            });
        }
        
        function submitRenameRoom() {
            const name = document.getElementById('room-name').value.trim();
            if (name === '') {
                alert('Please enter a room name');
                return;
            }
            
            // Rename room via AJAX
            fetch('../php/api/habitus/rename_room.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'room_id=<?php echo $roomId; ?>&name=' + encodeURIComponent(name)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update room name in select box
                    const option = document.querySelector('#room-select option[value="<?php echo $roomId; ?>"]');
                    if (option) {
                        option.textContent = name;
                    }
                    closeModal('rename-room-modal');
                } else {
                    alert('Error renaming room: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while renaming the room');
            });
        }
        
        function initFilterButtons() {
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    // Get filter category
                    const filter = this.dataset.filter;
                    
                    // Filter inventory items
                    const items = document.querySelectorAll('.inventory-item');
                    items.forEach(item => {
                        if (filter === 'all' || item.dataset.category === filter) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        }
    </script>
</body>
</html>