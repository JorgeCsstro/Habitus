<?php
// pages/shop.php

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

// Get category filter if any
$categoryId = isset($_GET['category']) ? intval($_GET['category']) : 0;
$searchQuery = isset($_GET['search']) ? trim($_GET['search']) : '';

// Get shop items with search and filter
$query = "SELECT si.*, ic.name as category_name 
         FROM shop_items si
         JOIN item_categories ic ON si.category_id = ic.id
         WHERE si.is_available = 1";

$params = [];

if ($categoryId > 0) {
    $query .= " AND si.category_id = :categoryId";
    $params['categoryId'] = $categoryId;
}

if ($searchQuery) {
    $query .= " AND (si.name LIKE :search OR si.description LIKE :search)";
    $params['search'] = '%' . $searchQuery . '%';
}

$query .= " ORDER BY si.is_featured DESC, si.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->execute($params);
$shopItems = $stmt->fetchAll();

// Get categories for filter
$categoryQuery = "SELECT * FROM item_categories ORDER BY name";
$categoryStmt = $conn->query($categoryQuery);
$categories = $categoryStmt->fetchAll();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop - <?php echo SITE_NAME; ?></title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/shop.css">
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

            <!-- Shop Content -->
            <div class="shop-content">
                <!-- Shop Sections -->
                <div class="shop-sections">
                    <!-- Featured Shop Section -->
                    <div class="shop-section">
                        <h2>Featured Shop</h2>
                        <div class="shop-grid">
                            <?php 
                            $featuredItems = array_filter($shopItems, function($item) {
                                return $item['is_featured'] == 1;
                            });
                            $featuredItems = array_slice($featuredItems, 0, 9);
                            
                            foreach ($featuredItems as $item): 
                            ?>
                                <div class="shop-item" onclick="addToCart(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['name']); ?>', <?php echo $item['price']; ?>, '<?php echo $item['image_path']; ?>', this)">
                                    <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="shop-item-price">
                                        <img src="../images/icons/hcoin.svg" alt="HCoin">
                                        <span><?php echo number_format($item['price']); ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Popular Shop Section -->
                    <div class="shop-section">
                        <h2>Popular Shop</h2>
                        <div class="shop-grid">
                            <?php 
                            // For demo, using random items as "popular"
                            $popularItems = array_slice($shopItems, 0, 9);
                            
                            foreach ($popularItems as $item): 
                            ?>
                                <div class="shop-item" onclick="addToCart(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['name']); ?>', <?php echo $item['price']; ?>, '<?php echo $item['image_path']; ?>', this)">
                                    <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="shop-item-price">
                                        <img src="../images/icons/hcoin.svg" alt="HCoin">
                                        <span><?php echo number_format($item['price']); ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- All Shop Section -->
                    <div class="shop-section">
                        <h2>Shop</h2>
                        <div class="shop-grid">
                            <?php 
                            $allItems = array_slice($shopItems, 0, 9);
                            
                            foreach ($allItems as $item): 
                            ?>
                                <div class="shop-item" onclick="addToCart(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['name']); ?>', <?php echo $item['price']; ?>, '<?php echo $item['image_path']; ?>', this)">
                                    <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="shop-item-price">
                                        <img src="../images/icons/hcoin.svg" alt="HCoin">
                                        <span><?php echo number_format($item['price']); ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <!-- Bottom Cart -->
                <div class="bottom-cart" id="bottom-cart">
                    <div class="cart-icon-wrapper" onclick="toggleCart()">
                        <img src="../images/icons/cart-icon-light.webp" alt="Cart">
                        <span class="cart-badge" id="cart-badge">0</span>
                    </div>
                    
                    <!-- Cart Dropdown -->
                    <div class="cart-dropdown" id="cart-dropdown">
                        <div class="cart-dropdown-header">
                            <h3>Shopping Cart</h3>
                            <button class="clear-cart-btn" onclick="clearCart()">Clear All</button>
                        </div>
                        <div class="cart-dropdown-items" id="cart-items">
                            <p class="empty-cart-message">Your cart is empty</p>
                        </div>
                        <div class="cart-dropdown-footer">
                            <div class="cart-total-row">
                                <span>Total:</span>
                                <div class="cart-total-price">
                                    <img src="../images/icons/hcoin.svg" alt="HCoin">
                                    <span id="cart-total">0</span>
                                </div>
                            </div>
                            <button class="checkout-button" onclick="checkout()" disabled>Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    <script src="../js/shop.js"></script>
</body>
</html>