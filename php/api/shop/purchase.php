// php/api/shop/purchase.php
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
$itemId = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;

// Validate data
if ($itemId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID']);
    exit;
}

// Get user ID
$userId = $_SESSION['user_id'];

// Begin transaction
$conn->begin_transaction();

try {
    // Get item details
    $itemQuery = "SELECT * FROM shop_items WHERE id = ? AND is_available = 1";
    $stmt = $conn->prepare($itemQuery);
    $stmt->bind_param("i", $itemId);
    $stmt->execute();
    $itemResult = $stmt->get_result();
    
    if ($itemResult->num_rows === 0) {
        throw new Exception("Item not found or unavailable");
    }
    
    $itemData = $itemResult->fetch_assoc();
    $itemPrice = $itemData['price'];
    
    // Check if user already owns this item
    $inventoryQuery = "SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?";
    $stmt = $conn->prepare($inventoryQuery);
    $stmt->bind_param("ii", $userId, $itemId);
    $stmt->execute();
    $inventoryResult = $stmt->get_result();
    
    if ($inventoryResult->num_rows > 0) {
        // User already has this item, increment quantity
        $inventoryData = $inventoryResult->fetch_assoc();
        $quantity = $inventoryData['quantity'] + 1;
        
        $updateInventory = "UPDATE user_inventory SET quantity = ? WHERE id = ?";
        $stmt = $conn->prepare($updateInventory);
        $stmt->bind_param("ii", $quantity, $inventoryData['id']);
        $stmt->execute();
    } else {
        // Add item to inventory
        $insertInventory = "INSERT INTO user_inventory (user_id, item_id, quantity, acquired_at) 
                           VALUES (?, ?, 1, NOW())";
        $stmt = $conn->prepare($insertInventory);
        $stmt->bind_param("ii", $userId, $itemId);
        $stmt->execute();
    }
    
    // Get user's current HCoin balance
    $balanceQuery = "SELECT hcoin FROM users WHERE id = ?";
    $stmt = $conn->prepare($balanceQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $balanceResult = $stmt->get_result();
    $currentBalance = $balanceResult->fetch_assoc()['hcoin'];
    
    // Check if user has enough HCoins
    if ($currentBalance < $itemPrice) {
        throw new Exception("Not enough HCoins to purchase this item");
    }
    
    // Deduct HCoins from user
    $newBalance = $currentBalance - $itemPrice;
    $updateUser = "UPDATE users SET hcoin = ? WHERE id = ?";
    $stmt = $conn->prepare($updateUser);
    $stmt->bind_param("ii", $newBalance, $userId);
    $stmt->execute();
    
    // Record transaction
    $transactionDesc = "Purchased: " . $itemData['name'];
    $insertTransaction = "INSERT INTO transactions (user_id, amount, description, 
                         transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'spend', ?, 'shop')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->bind_param("iisi", $userId, $itemPrice, $transactionDesc, $itemId);
    $stmt->execute();
    
    // Commit transaction
    $conn->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'new_balance' => $newBalance,
        'message' => 'Item purchased successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>  