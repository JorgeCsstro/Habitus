// shop.js - Shop functionality with cart animations

// Cart state
let cart = [];
let cartOpen = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from localStorage
    loadCart();
    updateCartDisplay();
    
    // Close cart when clicking outside
    document.addEventListener('click', function(e) {
        if (cartOpen && !e.target.closest('.bottom-cart')) {
            toggleCart();
        }
    });
});

/**
 * Add item to cart with flying animation
 * @param {number} itemId - Item ID
 * @param {string} itemName - Item name
 * @param {number} itemPrice - Item price
 * @param {string} imagePath - Path to item image
 * @param {HTMLElement} element - The clicked element
 */
function addToCart(itemId, itemName, itemPrice, imagePath, element) {
    // Check if item already in cart
    const existingItem = cart.find(item => item.id === itemId);
    if (existingItem) {
        showNotification('Item already in cart!', 'warning');
        return;
    }

    // Get positions for animation
    const itemRect = element.getBoundingClientRect();
    const cartRect = document.querySelector('.cart-icon-wrapper').getBoundingClientRect();

    // Create flying item
    const flyingItem = document.createElement('div');
    flyingItem.className = 'flying-item';
    flyingItem.innerHTML = `<img src="../${imagePath}" alt="${itemName}">`;
    
    // Set initial position
    flyingItem.style.left = itemRect.left + 'px';
    flyingItem.style.top = itemRect.top + 'px';
    
    document.body.appendChild(flyingItem);

    // Animate to cart
    const animationDuration = 800;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function for smooth animation
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        
        // Calculate position
        const currentX = itemRect.left + (cartRect.left - itemRect.left) * easeOutQuad;
        const currentY = itemRect.top + (cartRect.top - itemRect.top) * easeOutQuad;
        
        // Add parabolic arc for up and down motion
        const arcHeight = 150;
        const arc = Math.sin(progress * Math.PI) * arcHeight;
        
        flyingItem.style.left = currentX + 'px';
        flyingItem.style.top = (currentY - arc) + 'px';
        flyingItem.style.transform = `scale(${1 - progress * 0.3})`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Remove flying item
            flyingItem.remove();
            
            // Add to cart
            cart.push({
                id: itemId,
                name: itemName,
                price: itemPrice,
                image: imagePath
            });
            
            // Save cart
            saveCart();
            
            // Update cart display
            updateCartDisplay();
            
            // Wiggle cart
            const cartWrapper = document.querySelector('.bottom-cart');
            cartWrapper.classList.add('cart-wiggle');
            setTimeout(() => {
                cartWrapper.classList.remove('cart-wiggle');
            }, 500);
            
            showNotification('Item added to cart!', 'success');
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Toggle cart dropdown
 */
function toggleCart() {
    cartOpen = !cartOpen;
    const dropdown = document.getElementById('cart-dropdown');
    
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
    const badge = document.getElementById('cart-badge');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.querySelector('.checkout-button');
    
    // Update badge
    badge.textContent = cart.length;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        cartTotal.textContent = '0';
    } else {
        let html = '';
        let total = 0;
        
        cart.forEach(item => {
            html += `
                <div class="cart-item">
                    <img src="../${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">
                            <img src="../images/icons/hcoin.svg" alt="HCoin">
                            <span>${item.price.toLocaleString()}</span>
                        </div>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
                </div>
            `;
            total += item.price;
        });
        
        cartItems.innerHTML = html;
        cartTotal.textContent = total.toLocaleString();
        checkoutBtn.disabled = false;
    }
}

/**
 * Remove item from cart
 * @param {number} itemId - Item ID to remove
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
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, warning, info, error)
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
    notification.textContent = message;
    
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

/**
 * Checkout process
 */
function checkout() {
    if (cart.length === 0) return;
    
    // Get current balance
    const currentBalance = parseInt(document.querySelector('.hcoin-balance span').textContent.replace(/,/g, ''));
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    if (currentBalance < total) {
        showNotification('Not enough HCoins!', 'error');
        return;
    }
    
    // Show checkout modal or process
    if (confirm(`Total: ${total.toLocaleString()} HCoins\n\nProceed with checkout?`)) {
        // Process each item
        processCheckout();
    }
}

/**
 * Process checkout
 */
function processCheckout() {
    const checkoutBtn = document.querySelector('.checkout-button');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';
    
    // Create promises for each item purchase
    const purchases = cart.map(item => 
        fetch('../php/api/shop/purchase.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `item_id=${item.id}`
        }).then(response => response.json())
    );
    
    // Process all purchases
    Promise.all(purchases)
        .then(results => {
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                // Clear cart
                cart = [];
                saveCart();
                updateCartDisplay();
                
                // Update balance
                const lastResult = results[results.length - 1];
                if (lastResult.new_balance !== undefined) {
                    document.querySelector('.hcoin-balance span').textContent = 
                        lastResult.new_balance.toLocaleString();
                }
                
                // Close cart dropdown
                toggleCart();
                
                showNotification('Purchase successful! Items added to your inventory.', 'success');
            } else {
                // Find first error
                const error = results.find(r => !r.success);
                showNotification(error.message || 'Purchase failed', 'error');
            }
            
            // Reset button
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
        })
        .catch(error => {
            console.error('Purchase error:', error);
            showNotification('An error occurred during purchase', 'error');
            
            // Reset button
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
        });
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    const savedCart = localStorage.getItem('habitusCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    try {
        localStorage.setItem('habitusCart', JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}