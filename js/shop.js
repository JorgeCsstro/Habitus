// shop.js - Shop functionality with cart animations

// Cart state
let cart = [];
let cartOpen = false;

// Initialize cart from localStorage
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartDisplay();
});

/**
 * Toggle cart dropdown
 */
function toggleCart() {
    const dropdown = document.getElementById('cart-dropdown');
    cartOpen = !cartOpen;
    
    if (cartOpen) {
        dropdown.classList.add('show');
    } else {
        dropdown.classList.remove('show');
    }
}

/**
 * Update cart display
 */
function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Update count
    cartCount.textContent = cart.length;
    
    // Update items display
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        checkoutBtn.disabled = true;
    } else {
        let itemsHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            itemsHTML += `
                <div class="cart-item">
                    <img src="../${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <p class="cart-item-name">${item.name}</p>
                        <div class="cart-item-price">
                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                            <span>${item.price.toLocaleString()}</span>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
                </div>
            `;
            total += item.price;
        });
        
        cartItems.innerHTML = itemsHTML;
        checkoutBtn.disabled = false;
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = total.toLocaleString();
}

/**
 * Remove item from cart
 */
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart', 'info');
}

/**
 * Clear all items from cart
 */
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        updateCartDisplay();
        showNotification('Cart cleared', 'info');
    }
}

/**
 * Search items
 */
function searchItems() {
    const searchValue = document.getElementById('search-input').value;
    const currentCategory = document.querySelector('.category-tab.active').onclick.toString().match(/\d+/);
    const categoryId = currentCategory ? currentCategory[0] : 0;
    
    window.location.href = `shop.php?category=${categoryId}&search=${encodeURIComponent(searchValue)}`;
}

// Allow search on Enter key
document.getElementById('search-input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchItems();
    }
});

/**
 * Filter by category
 */
function filterByCategory(categoryId) {
    const searchValue = document.getElementById('search-input').value;
    window.location.href = `shop.php?category=${categoryId}&search=${encodeURIComponent(searchValue)}`;
}

/**
 * Open checkout modal
 */
function checkout() {
    if (cart.length === 0) return;
    
    // Update checkout modal
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    const remainingBalance = document.getElementById('remaining-balance');
    
    // Get current balance from header
    const currentBalance = parseInt(document.querySelector('.hcoin-balance span').textContent.replace(/,/g, ''));
    
    // Display items
    let itemsHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        itemsHTML += `
            <div class="checkout-item">
                <span>${item.name}</span>
                <div class="item-price">
                    <img src="../images/icons/hcoin.svg" alt="HCoin" style="width: 16px; height: 16px;">
                    <span>${item.price.toLocaleString()}</span>
                </div>
            </div>
        `;
        total += item.price;
    });
    
    checkoutItems.innerHTML = itemsHTML;
    checkoutTotal.textContent = total.toLocaleString();
    
    // Calculate remaining balance
    const remaining = currentBalance - total;
    remainingBalance.textContent = remaining.toLocaleString();
    
    if (remaining < 0) {
        remainingBalance.parentElement.classList.add('insufficient');
        document.querySelector('.confirm-btn').disabled = true;
    } else {
        remainingBalance.parentElement.classList.remove('insufficient');
        document.querySelector('.confirm-btn').disabled = false;
    }
    
    // Show modal
    document.getElementById('checkout-modal').classList.add('show');
}

/**
 * Close checkout modal
 */
function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('show');
}

/**
 * Confirm purchase
 */
function confirmPurchase() {
    const confirmBtn = document.querySelector('.confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
    
    // Process each item in cart
    const purchases = cart.map(item => 
        fetch('../php/api/shop/purchase.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `item_id=${item.id}`
        }).then(response => response.json())
    );
    
    Promise.all(purchases)
        .then(results => {
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                // Clear cart
                cart = [];
                saveCart();
                updateCartDisplay();
                
                // Close checkout modal
                closeCheckoutModal();
                
                // Update balance in header
                const lastResult = results[results.length - 1];
                if (lastResult.new_balance !== undefined) {
                    document.querySelector('.hcoin-balance span').textContent = 
                        lastResult.new_balance.toLocaleString();
                }
                
                // Show success modal
                document.getElementById('success-modal').classList.add('show');
                
                // Update disabled buttons
                updatePurchaseButtons(lastResult.new_balance);
            } else {
                // Find first error
                const error = results.find(r => !r.success);
                showNotification(error.message || 'Purchase failed', 'error');
                
                // Reset button
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm Purchase';
            }
        })
        .catch(error => {
            console.error('Purchase error:', error);
            showNotification('An error occurred during purchase', 'error');
            
            // Reset button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Purchase';
        });
}

/**
 * Close success modal
 */
function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('show');
}

/**
 * Update purchase buttons based on new balance
 */
function updatePurchaseButtons(newBalance) {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const itemCard = btn.closest('.shop-item-card');
        const priceElement = itemCard.querySelector('.item-price span');
        const price = parseInt(priceElement.textContent.replace(/,/g, ''));
        
        if (newBalance < price) {
            btn.disabled = true;
            btn.textContent = 'Not Enough HCoins';
        } else {
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
        }
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
    
    // Close cart if clicking outside
    if (cartOpen && !e.target.closest('.floating-cart')) {
        toggleCart();
    }
});

// Add notification styles dynamically
const notificationStyles = `
    .shop-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transform: translateX(400px);
        transition: transform 0.3s;
        z-index: 2000;
        max-width: 300px;
    }
    
    .shop-notification.show {
        transform: translateX(0);
    }
    
    .shop-notification.success {
        border-left: 4px solid #6a8d7f;
    }
    
    .shop-notification.error {
        border-left: 4px solid #a15c5c;
    }
    
    .shop-notification.warning {
        border-left: 4px solid #c4a356;
    }
    
    .shop-notification.info {
        border-left: 4px solid #5d7b8a;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

/**
 * Load cart from localStorage
 */
function loadCart() {
    const savedCart = localStorage.getItem('habitusCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('habitusCart', JSON.stringify(cart));
}

/**
 * Add item to cart with animation
 */
function addToCart(itemId, itemName, itemPrice, imagePath) {
    // Check if item already in cart
    const existingItem = cart.find(item => item.id === itemId);
    if (existingItem) {
        showNotification('Item already in cart!', 'warning');
        return;
    }
    
    // Get the item card element
    const itemCard = document.querySelector(`.shop-item-card[data-item-id="${itemId}"]`);
    if (!itemCard) return;
    
    // Get positions for animation
    const itemRect = itemCard.getBoundingClientRect();
    const cartIcon = document.querySelector('.cart-icon-container');
    const cartRect = cartIcon.getBoundingClientRect();
    
    // Create flying item element
    const flyingItem = document.createElement('div');
    flyingItem.className = 'flying-item';
    flyingItem.innerHTML = `<img src="../${imagePath}" alt="${itemName}">`;
}