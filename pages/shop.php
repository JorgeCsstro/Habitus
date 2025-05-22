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
                <!-- Shop Header with Search -->
                <div class="shop-header">
                    <h1>Shop</h1>
                    <div class="shop-controls">
                        <div class="search-box">
                            <input type="text" id="search-input" placeholder="Search items..." value="<?php echo htmlspecialchars($searchQuery); ?>">
                            <button class="search-btn" onclick="searchItems()">
                                <img src="../images/icons/search.svg" alt="Search">
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Category Filter Tabs -->
                <div class="category-tabs">
                    <button class="category-tab <?php echo $categoryId === 0 ? 'active' : ''; ?>" 
                            onclick="filterByCategory(0)">
                        All Items
                    </button>
                    <?php foreach ($categories as $category): ?>
                        <button class="category-tab <?php echo $categoryId === $category['id'] ? 'active' : ''; ?>" 
                                onclick="filterByCategory(<?php echo $category['id']; ?>)">
                            <?php echo htmlspecialchars($category['name']); ?>
                        </button>
                    <?php endforeach; ?>
                </div>

                <!-- Shop Items Grid -->
                <div class="shop-items-grid">
                    <?php if (empty($shopItems)): ?>
                        <div class="empty-shop">
                            <p>No items found. Please try a different search or category.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($shopItems as $item): ?>
                            <div class="shop-item-card <?php echo $item['rarity']; ?>" data-item-id="<?php echo $item['id']; ?>">
                                <?php if ($item['is_featured']): ?>
                                    <div class="featured-badge">Featured</div>
                                <?php endif; ?>
                                
                                <div class="item-image-container">
                                    <img src="../<?php echo $item['image_path']; ?>" 
                                         alt="<?php echo htmlspecialchars($item['name']); ?>"
                                         class="item-image">
                                </div>
                                
                                <div class="item-details">
                                    <h3 class="item-name"><?php echo htmlspecialchars($item['name']); ?></h3>
                                    <p class="item-category"><?php echo htmlspecialchars($item['category_name']); ?></p>
                                    
                                    <div class="item-price">
                                        <img src="../images/icons/hcoin.svg" alt="HCoin">
                                        <span><?php echo number_format($item['price']); ?></span>
                                    </div>
                                    
                                    <button class="add-to-cart-btn" 
                                            onclick="addToCart(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['name']); ?>', <?php echo $item['price']; ?>, '<?php echo $item['image_path']; ?>')"
                                            <?php echo ($userHCoins < $item['price']) ? 'disabled' : ''; ?>>
                                        <?php echo ($userHCoins < $item['price']) ? 'Not Enough HCoins' : 'Add to Cart'; ?>
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <!-- Floating Cart -->
                <div class="floating-cart" id="floating-cart">
                    <div class="cart-icon-container" onclick="toggleCart()">
                        <img src="../images/icons/cart-icon-light.webp" alt="Cart">
                        <span class="cart-count" id="cart-count">0</span>
                    </div>
                    
                    <div class="cart-dropdown" id="cart-dropdown">
                        <div class="cart-header">
                            <h3>Shopping Cart</h3>
                            <button class="clear-cart-btn" onclick="clearCart()">Clear All</button>
                        </div>
                        
                        <div class="cart-items" id="cart-items">
                            <p class="empty-cart">Your cart is empty</p>
                        </div>
                        
                        <div class="cart-footer">
                            <div class="cart-total">
                                <span>Total:</span>
                                <div class="total-price">
                                    <img src="../images/icons/hcoin.svg" alt="HCoin">
                                    <span id="cart-total">0</span>
                                </div>
                            </div>
                            <button class="checkout-btn" onclick="checkout()" disabled>
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Item Added Animation Container -->
    <div id="animation-container"></div>

    <!-- Checkout Modal -->
    <div id="checkout-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Checkout</h2>
                <button class="close-modal" onclick="closeCheckoutModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="checkout-summary">
                    <h3>Order Summary</h3>
                    <div id="checkout-items"></div>
                    
                    <div class="checkout-total">
                        <span>Total Cost:</span>
                        <div class="total-price">
                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                            <span id="checkout-total">0</span>
                        </div>
                    </div>
                    
                    <div class="balance-info">
                        <span>Your Balance:</span>
                        <div class="balance-amount">
                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                            <span><?php echo number_format($userHCoins); ?></span>
                        </div>
                    </div>
                    
                    <div class="remaining-balance">
                        <span>After Purchase:</span>
                        <div class="remaining-amount">
                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                            <span id="remaining-balance">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="cancel-btn" onclick="closeCheckoutModal()">Cancel</button>
                    <button class="confirm-btn" onclick="confirmPurchase()">Confirm Purchase</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="success-modal" class="modal">
        <div class="modal-content success">
            <div class="success-animation">
                <img src="../images/icons/check-circle.svg" alt="Success">
            </div>
            <h2>Purchase Successful!</h2>
            <p>Your items have been added to your inventory.</p>
            <div class="modal-actions">
                <button class="primary-btn" onclick="closeSuccessModal()">Continue Shopping</button>
                <a href="habitus.php" class="view-inventory-btn">Go to Habitus</a>
            </div>
        </div>
    </div>

    <script src="../js/shop.js"></script>
</body>
</html>