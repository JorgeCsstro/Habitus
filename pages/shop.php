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

// Get sort option
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'recent';

// Get shop items
$query = "SELECT si.*, ic.name as category_name 
         FROM shop_items si
         JOIN item_categories ic ON si.category_id = ic.id
         WHERE si.is_available = 1";

if ($categoryId > 0) {
    $query .= " AND si.category_id = " . $categoryId;
}

switch ($sort) {
    case 'price_low':
        $query .= " ORDER BY si.price ASC";
        break;
    case 'price_high':
        $query .= " ORDER BY si.price DESC";
        break;
    case 'recent':
    default:
        $query .= " ORDER BY si.created_at DESC";
        break;
}

$result = $conn->query($query);
$shopItems = [];
while ($row = $result->fetch_assoc()) {
    $shopItems[] = $row;
}

// Get categories for filter
$categoryQuery = "SELECT * FROM item_categories ORDER BY name";
$categoryResult = $conn->query($categoryQuery);
$categories = [];
while ($row = $categoryResult->fetch_assoc()) {
    $categories[] = $row;
}

// Get recently purchased items by user
$recentQuery = "SELECT si.*, t.created_at as purchase_date 
               FROM shop_items si
               JOIN transactions t ON t.reference_id = si.id AND t.reference_type = 'shop'
               WHERE t.user_id = ? AND t.transaction_type = 'spend'
               ORDER BY t.created_at DESC
               LIMIT 3";
$stmt = $conn->prepare($recentQuery);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$recentResult = $stmt->get_result();
$recentItems = [];
while ($row = $recentResult->fetch_assoc()) {
    $recentItems[] = $row;
}
?>

<!DOCTYPE html>
<html lang="en">
<!-- Update the head section of shop.php -->
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
                <div class="shop-header">
                    <h1>Shop</h1>
                    <div class="shop-filters">
                        <div class="categories">
                            <label for="category-filter">Category:</label>
                            <select id="category-filter" onchange="filterByCategory(this.value)">
                                <option value="0" <?php echo $categoryId === 0 ? 'selected' : ''; ?>>All Categories</option>
                                <?php foreach ($categories as $category): ?>
                                    <option value="<?php echo $category['id']; ?>" <?php echo $categoryId === $category['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($category['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="sort">
                            <label for="sort-options">Sort by:</label>
                            <select id="sort-options" onchange="sortItems(this.value)">
                                <option value="recent" <?php echo $sort === 'recent' ? 'selected' : ''; ?>>Most Recent</option>
                                <option value="price_low" <?php echo $sort === 'price_low' ? 'selected' : ''; ?>>Price: Low to High</option>
                                <option value="price_high" <?php echo $sort === 'price_high' ? 'selected' : ''; ?>>Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <?php if (!empty($recentItems)): ?>
                    <div class="recently-purchased">
                        <h2>Recently Purchased</h2>
                        <div class="recent-items">
                            <?php foreach ($recentItems as $item): ?>
                                <div class="recent-item">
                                    <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="item-details">
                                        <h3><?php echo htmlspecialchars($item['name']); ?></h3>
                                        <p class="purchase-date">Purchased: <?php echo date('M j, Y', strtotime($item['purchase_date'])); ?></p>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <div class="shop-items">
                    <?php if (empty($shopItems)): ?>
                        <div class="empty-shop">
                            <p>No items found in the shop. Please check back later!</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($shopItems as $item): ?>
                            <div class="shop-item <?php echo $item['rarity']; ?>">
                                <div class="item-image">
                                    <img src="../<?php echo $item['image_path']; ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <?php if ($item['is_featured']): ?>
                                        <span class="featured-badge">Featured</span>
                                    <?php endif; ?>
                                </div>
                                <div class="item-details">
                                    <h3><?php echo htmlspecialchars($item['name']); ?></h3>
                                    <p class="item-category"><?php echo htmlspecialchars($item['category_name']); ?></p>
                                    <p class="item-description"><?php echo htmlspecialchars($item['description']); ?></p>
                                    <div class="item-meta">
                                        <span class="rarity-badge"><?php echo ucfirst($item['rarity']); ?></span>
                                        <span class="price">
                                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                                            <span><?php echo number_format($item['price']); ?></span>
                                        </span>
                                    </div>
                                    <button class="purchase-btn" 
                                            onclick="purchaseItem(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['name']); ?>', <?php echo $item['price']; ?>)" 
                                            <?php echo ($userHCoins < $item['price']) ? 'disabled' : ''; ?>>
                                        <?php echo ($userHCoins < $item['price']) ? 'Not Enough HCoins' : 'Purchase'; ?>
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Purchase Confirmation Modal -->
    <div id="purchase-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h2>Confirm Purchase</h2>
            <p>Are you sure you want to purchase <span id="item-name"></span> for <span id="item-price"></span> HCoins?</p>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeModal()">Cancel</button>
                <button class="confirm-btn" onclick="confirmPurchase()">Confirm Purchase</button>
            </div>
        </div>
    </div>

    <!-- Purchase Success Modal -->
    <div id="success-modal" class="modal" style="display: none;">
        <div class="modal-content success">
            <h2>Purchase Successful!</h2>
            <div class="success-animation">
                <img src="../images/icons/check-circle.svg" alt="Success">
            </div>
            <p>You have successfully purchased <span id="purchased-item-name"></span>.</p>
            <p>Your new balance: <span id="new-balance"></span> HCoins</p>
            <div class="modal-actions">
                <button class="confirm-btn" onclick="closeSuccessModal()">Continue Shopping</button>
                <a href="habitus.php" class="view-btn">Go to Habitus</a>
            </div>
        </div>
    </div>

    <script>
        let purchaseItemId = 0;
        let purchaseItemName = '';
        let purchaseItemPrice = 0;
        
        function filterByCategory(categoryId) {
            window.location.href = `shop.php?category=${categoryId}&sort=<?php echo $sort; ?>`;
        }
        
        function sortItems(sortOption) {
            window.location.href = `shop.php?category=<?php echo $categoryId; ?>&sort=${sortOption}`;
        }
        
        function purchaseItem(id, name, price) {
            purchaseItemId = id;
            purchaseItemName = name;
            purchaseItemPrice = price;
            
            // Update modal content
            document.getElementById('item-name').textContent = name;
            document.getElementById('item-price').textContent = price;
            
            // Show modal
            document.getElementById('purchase-modal').style.display = 'flex';
        }
        
        function closeModal() {
            document.getElementById('purchase-modal').style.display = 'none';
        }
        
        function confirmPurchase() {
            // Hide confirmation modal
            closeModal();
            
            // Send purchase request
            const formData = new FormData();
            formData.append('item_id', purchaseItemId);
            
            fetch('../php/api/shop/purchase.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success modal
                    document.getElementById('purchased-item-name').textContent = purchaseItemName;
                    document.getElementById('new-balance').textContent = data.new_balance;
                    document.getElementById('success-modal').style.display = 'flex';
                    
                    // Update HCoin balance in header
                    const balanceElement = document.querySelector('.hcoin-balance span');
                    if (balanceElement) {
                        balanceElement.textContent = data.new_balance;
                    }
                    
                    // Disable purchase buttons if new balance is too low
                    const purchaseButtons = document.querySelectorAll('.purchase-btn');
                    purchaseButtons.forEach(button => {
                        const price = parseInt(button.parentElement.querySelector('.price span').textContent.replace(/,/g, ''));
                        if (data.new_balance < price) {
                            button.disabled = true;
                            button.textContent = 'Not Enough HCoins';
                        }
                    });
                } else {
                    alert('Purchase failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during purchase');
            });
        }
        
        function closeSuccessModal() {
            document.getElementById('success-modal').style.display = 'none';
        }
    </script>
</body>
</html>