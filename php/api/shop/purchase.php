<?php
// php/api/shop/purchase.php
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
try {
    $conn->beginTransaction();

    // Get item details
    $itemQuery = "SELECT * FROM shop_items WHERE id = ? AND is_available = 1";
    $stmt = $conn->prepare($itemQuery);
    $stmt->execute([$itemId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Item not found or unavailable");
    }
    
    $itemData = $stmt->fetch();
    $itemPrice = $itemData['price'];
    
    // Check if user already owns this item
    $inventoryQuery = "SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?";
    $stmt = $conn->prepare($inventoryQuery);
    $stmt->execute([$userId, $itemId]);
    
    if ($stmt->rowCount() > 0) {
        // User already has this item, increment quantity
        $inventoryData = $stmt->fetch();
        $quantity = $inventoryData['quantity'] + 1;
        
        $updateInventory = "UPDATE user_inventory SET quantity = ? WHERE id = ?";
        $stmt = $conn->prepare($updateInventory);
        $stmt->execute([$quantity, $inventoryData['id']]);
    } else {
        // Add item to inventory
        $insertInventory = "INSERT INTO user_inventory (user_id, item_id, quantity, acquired_at) 
                           VALUES (?, ?, 1, NOW())";
        $stmt = $conn->prepare($insertInventory);
        $stmt->execute([$userId, $itemId]);
    }
    
    // Get user's current HCoin balance
    $balanceQuery = "SELECT hcoin FROM users WHERE id = ?";
    $stmt = $conn->prepare($balanceQuery);
    $stmt->execute([$userId]);
    $currentBalance = $stmt->fetch()['hcoin'];
    
    // Check if user has enough HCoins
    if ($currentBalance < $itemPrice) {
        throw new Exception("Not enough HCoins to purchase this item");
    }
    
    // Deduct HCoins from user
    $newBalance = $currentBalance - $itemPrice;
    $updateUser = "UPDATE users SET hcoin = ? WHERE id = ?";
    $stmt = $conn->prepare($updateUser);
    $stmt->execute([$newBalance, $userId]);
    
    // Record transaction
    $transactionDesc = "Purchased: " . $itemData['name'];
    $insertTransaction = "INSERT INTO transactions (user_id, amount, description, 
                         transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'spend', ?, 'shop')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([$userId, $itemPrice, $transactionDesc, $itemId]);
    
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
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>