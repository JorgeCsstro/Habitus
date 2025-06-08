<?php
// pages/dashboard.php - ENHANCED VERSION with better integration

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';
require_once '../php/include/auth.php';

// Check if user is logged in, if not redirect to login page
if (!isLoggedIn()) {
    header('Location: login.php');    
    exit;
}

// Get user data
$userData = getUserData($_SESSION['user_id']);
$userHCoins = $userData['hcoin'];
$userHabitusName = $userData['username'] . "'s Habitus";

$currentLanguage = $userData['language'] ?? 'en';
$currentTheme = $userData['theme'] ?? 'light';

// Get user's dailies
$dailies = getUserDailies($_SESSION['user_id']);

// Get user's goals
$goals = getUserGoals($_SESSION['user_id']);

// Get user's challenges
$challenges = getUserChallenges($_SESSION['user_id']);

// Get featured shop items
$featuredItems = getFeaturedShopItems();

// ENHANCED: Get the user's room data with better error handling
$roomId = 0;
$roomData = null;
$placedItems = [];

// Get user's rooms with better error handling
try {
    $roomsQuery = "SELECT * FROM rooms WHERE user_id = ? ORDER BY id";
    $stmt = $conn->prepare($roomsQuery);
    $stmt->execute([$_SESSION['user_id']]);
    $rooms = $stmt->fetchAll();
    
    if (empty($rooms)) {
        // Create a default room if none exists
        $createRoomQuery = "INSERT INTO rooms (user_id, name, floor_color, wall_color) VALUES (?, 'My First Room', '#FFD700', '#E0E0E0')";
        $stmt = $conn->prepare($createRoomQuery);
        $stmt->execute([$_SESSION['user_id']]);
        $roomId = $conn->lastInsertId();
        
        // Reload rooms
        $stmt = $conn->prepare($roomsQuery);
        $stmt->execute([$_SESSION['user_id']]);
        $rooms = $stmt->fetchAll();
    }
    
    if (!empty($rooms)) {
        $roomData = $rooms[0];
        $roomId = $roomData['id'];
        
        // ENHANCED: Get placed items with comprehensive error handling
        $placedItemsQuery = "SELECT 
            pi.id,
            pi.room_id,
            pi.inventory_id,
            pi.surface,
            pi.grid_x,
            pi.grid_y,
            pi.rotation,
            pi.z_index,
            ui.item_id,
            si.name,
            si.image_path,
            si.category_id,
            si.rotation_variants,
            ic.name as category_name
            FROM placed_items pi
            JOIN user_inventory ui ON pi.inventory_id = ui.id
            JOIN shop_items si ON ui.item_id = si.id
            JOIN item_categories ic ON si.category_id = ic.id
            WHERE pi.room_id = ?
            ORDER BY pi.z_index";
        
        $stmt = $conn->prepare($placedItemsQuery);
        $stmt->execute([$roomId]);
        $placedItems = $stmt->fetchAll();
        
        // Process rotation variants
        foreach ($placedItems as &$item) {
            if (!empty($item['rotation_variants'])) {
                $item['rotation_variants'] = json_decode($item['rotation_variants'], true);
            }
            // Ensure all required fields are present with defaults
            $item['surface'] = $item['surface'] ?? 'floor';
            $item['grid_x'] = intval($item['grid_x']);
            $item['grid_y'] = intval($item['grid_y']);
            $item['rotation'] = intval($item['rotation'] ?? 0);
            $item['z_index'] = intval($item['z_index'] ?? 1);
        }
        unset($item); // Break reference
    }
} catch (Exception $e) {
    error_log("Dashboard Error: " . $e->getMessage());
}

// Create rotation data map for JavaScript
$rotationDataMap = [];
foreach ($placedItems as $item) {
    if (!empty($item['rotation_variants'])) {
        $rotationDataMap[$item['item_id']] = $item['rotation_variants'];
    }
}
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Habitus Zone</title>
    
    <!-- REQUIRED: Theme CSS - Add this to ALL pages -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Your existing CSS files AFTER theme CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/dashboard.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
</head>
<body class="theme-<?php echo $currentTheme; ?>">
    <div class="main-container">

        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Dashboard Content -->
            <div class="dashboard-content">
                <!-- Dailies Panel -->
                <div class="panel dailies-panel">
                    <div class="panel-header">
                        <img src="../images/icons/dailies-icon.webp" alt="Calendar">
                        <h2>Dailies</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($dailies)): ?>
                            <p class="empty-message">No dailies found. Add some to get started!</p>
                        <?php else: ?>
                            <ul class="dailies-list">
                                <?php foreach ($dailies as $daily): ?>
                                    <li class="daily-item <?php echo ($daily['completed']) ? 'completed' : ''; ?>">
                                        <span class="daily-bullet">●</span>
                                        <span class="daily-title"><?php echo htmlspecialchars($daily['title']); ?></span>
                                        <span class="daily-dots"></span>
                                        <?php if ($daily['reset_time']): ?>
                                            <span class="daily-time"><?php echo date('H:i', strtotime($daily['reset_time'])); ?></span>
                                        <?php endif; ?>
                                        <button class="complete-button <?php echo ($daily['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $daily['id']; ?>"
                                                onclick="completeDaily(<?php echo $daily['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=daily'">
                            <img src="../images/icons/task_add-icon.webp" alt="Add">
                            Add new daily...
                        </button>
                    </div>
                </div>

                <!-- Featured Shop Panel -->
                <div class="panel shop-panel">
                    <div class="panel-header">
                        <img src="../images/icons/shop-icon.webp" alt="Shop">
                        <h2>Featured Shop</h2>
                    </div>
                    <div class="panel-content">
                        <div class="shop-grid">
                            <?php foreach ($featuredItems as $item): ?>
                                <div class="shop-item">
                                    <?php
                                    // Convert image path to WebP
                                    $imagePath = $item['image_path'];
                                    $webpPath = preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $imagePath);
                                    ?>
                                    <img src="../<?php echo htmlspecialchars($webpPath); ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="item-price">
                                        <img src="../images/icons/hcoin-small.webp" alt="HCoin">
                                        <span><?php echo $item['price']; ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="go-to-shop-button" onclick="location.href='shop.php'">
                            <img src="../images/icons/cart-icon.webp" alt="Shop">
                            Go to Shop
                        </button>
                    </div>
                </div>

                <!-- Habitus Preview Panel -->
                <div class="panel habitus-panel">
                    <div class="panel-header">
                        <img src="../images/icons/home-icon.webp" alt="Habitus">
                        <h2>Habitus</h2>
                    </div>
                    <div class="panel-content">
                        <div class="habitus-preview">
                            <div class="dashboard-room">
                                <div id="isometric-room" class="isometric-room"></div>
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="edit-habitus-button" onclick="location.href='habitus.php'">
                            <img src="../images/icons/edit-icon.webp" alt="Edit">
                            Edit your Habitus...
                        </button>
                    </div>
                </div>

                <!-- Goals Panel -->
                <div class="panel goals-panel">
                    <div class="panel-header">
                        <img src="../images/icons/goals-icon.webp" alt="Goals">
                        <h2>Goals</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($goals)): ?>
                            <p class="empty-message">No goals found. Add some to track your progress!</p>
                        <?php else: ?>
                            <ul class="goals-list">
                                <?php foreach ($goals as $goal): ?>
                                    <li class="goal-item <?php echo ($goal['completed']) ? 'completed' : ''; ?>">
                                        <span class="goal-bullet">●</span>
                                        <span class="goal-title"><?php echo htmlspecialchars($goal['title']); ?></span>
                                        <span class="goal-dots"></span>
                                        <button class="complete-button <?php echo ($goal['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $goal['id']; ?>"
                                                onclick="completeGoal(<?php echo $goal['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=goal'">
                            <img src="../images/icons/task_add-icon.webp" alt="Add">
                            Add new objective...
                        </button>
                    </div>
                </div>

                <!-- Challenges Panel -->
                <div class="panel challenges-panel">
                    <div class="panel-header">
                        <img src="../images/icons/challenge-icon.webp" alt="Challenges">
                        <h2>Challenges</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($challenges)): ?>
                            <p class="empty-message">No challenges found. Try something new!</p>
                        <?php else: ?>
                            <ul class="challenges-list">
                                <?php foreach ($challenges as $challenge): ?>
                                    <li class="challenge-item <?php echo ($challenge['completed']) ? 'completed' : ''; ?>">
                                        <span class="challenge-bullet">●</span>
                                        <span class="challenge-title"><?php echo htmlspecialchars($challenge['title']); ?></span>
                                        <span class="challenge-dots"></span>
                                        <button class="complete-button <?php echo ($challenge['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $challenge['id']; ?>"
                                                onclick="completeChallenge(<?php echo $challenge['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=challenge'">
                            <img src="../images/icons/task_add-icon.webp" alt="Add">
                            Add new challenge...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="../js/main.js"></script>

    <script>
    // REQUIRED: Theme initialization for ALL pages
    window.initialTheme = '<?php echo $currentTheme; ?>';
    document.documentElement.setAttribute('data-theme', window.initialTheme);
    document.body.classList.add('theme-' + window.initialTheme);
    </script>

    <!-- Load theme manager on ALL pages -->
    <script src="../js/theme-manager.js"></script>

    <script src="../js/dashboard.js"></script>
    <!-- Habitus Room Script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // ENHANCED: Better data validation and error handling
            const roomData = <?php echo json_encode($roomData); ?>;
            const placedItems = <?php echo json_encode($placedItems); ?> || [];
            const rotationData = <?php echo json_encode($rotationDataMap); ?> || {};
            
            console.group('🏠 Dashboard Room Initialization');
            
            // Validate data before initialization
            let initializationSuccess = false;
            
            if (!roomData) {
                console.error('❌ No room data available');
            } else if (!Array.isArray(placedItems)) {
                console.error('❌ Invalid placed items data (not an array)');
            } else {
                // Additional validation for placed items
                const validItems = placedItems.filter(item => {
                    if (!item || typeof item.grid_x === 'undefined' || typeof item.grid_y === 'undefined') {
                        console.warn('⚠️ Skipping invalid item:', item);
                        return false;
                    }
                    return true;
                });
                
                if (validItems.length !== placedItems.length) {
                    console.warn(`⚠️ Filtered out ${placedItems.length - validItems.length} invalid items`);
                }
                
                try {
                    // Initialize the room system
                    if (typeof initializeHabitusRoom === 'function') {
                        console.log('🔧 Initializing dashboard room system...');
                        const result = initializeHabitusRoom(roomData, validItems, rotationData);
                        if (result) {
                            initializationSuccess = true;
                            console.log('✅ Dashboard room system initialized successfully');
                        } else {
                            console.error('❌ initializeHabitusRoom returned false');
                        }
                    } else {
                        console.error('❌ initializeHabitusRoom function not found');
                    }
                } catch (error) {
                    console.error('❌ Error during room initialization:', error);
                }
            }
            
            if (!initializationSuccess) {
                console.warn('⚠️ Room initialization failed - showing fallback message');
                const roomElement = document.getElementById('isometric-room');
                if (roomElement) {
                    roomElement.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #888; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                            <p>Unable to load room preview.</p>
                            <p style="font-size: 0.9em; margin-top: 10px;">
                                <a href="habitus.php" style="color: #6a8d7f; text-decoration: none;">Visit the Habitus page to place items →</a>
                            </p>
                        </div>
                    `;
                }
            }
            
            console.groupEnd();
        });
    </script>
    <script src="../js/habitus-room.js"></script>
</body>
</html>