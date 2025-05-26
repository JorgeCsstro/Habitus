// subscription.js - Subscription page functionality

let selectedPlan = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Format card number input
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    // Format expiry date input
    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', formatExpiryDate);
    }
    
    // Handle payment form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
});

/**
 * Subscribe to a plan
 * @param {string} planType - Type of plan (adfree or premium)
 */
function subscribeToPlan(planType) {
    selectedPlan = planType;
    
    // Update modal content based on plan
    const planDetails = {
        adfree: {
            name: 'Ad-Free Plan',
            price: '1€/month'
        },
        premium: {
            name: 'Premium Plan',
            price: '5€/month'
        }
    };
    
    document.getElementById('selected-plan-name').textContent = planDetails[planType].name;
    document.getElementById('selected-plan-price').textContent = planDetails[planType].price;
    
    // Show payment modal
    showPaymentModal();
}

/**
 * Show payment modal
 */
function showPaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
    
    // Focus on card number input
    setTimeout(() => {
        document.getElementById('card-number').focus();
    }, 100);
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('payment-form').reset();
}

/**
 * Format card number input
 * @param {Event} e - Input event
 */
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    e.target.value = formattedValue;
}

/**
 * Format expiry date input
 * @param {Event} e - Input event
 */
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    e.target.value = value;
}

/**
 * Handle payment form submission
 * @param {Event} e - Submit event
 */
function handlePaymentSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvc = document.getElementById('card-cvc').value;
    const cardName = document.getElementById('card-name').value;
    
    // Basic validation
    if (cardNumber.length < 16) {
        showNotification('Please enter a valid card number', 'error');
        return;
    }
    
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        showNotification('Please enter a valid expiry date (MM/YY)', 'error');
        return;
    }
    
    if (cardCvc.length < 3) {
        showNotification('Please enter a valid CVC', 'error');
        return;
    }
    
    if (!cardName.trim()) {
        showNotification('Please enter the name on the card', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-payment-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    // Simulate payment processing
    processPayment({
        plan: selectedPlan,
        cardNumber: cardNumber,
        cardExpiry: cardExpiry,
        cardCvc: cardCvc,
        cardName: cardName
    });
}

/**
 * Process payment
 * @param {Object} paymentData - Payment information
 */
function processPayment(paymentData) {
    // In a real implementation, this would use Stripe or another payment processor
    
    // Send to server
    fetch('../php/api/subscription/subscribe.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            plan: paymentData.plan,
            // In production, use tokenized payment data, not raw card info
            payment_token: 'simulated_token_' + Date.now()
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        const submitBtn = document.querySelector('.submit-payment-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe Now';
        
        if (data.success) {
            closePaymentModal();
            showNotification('Subscription successful! Thank you for supporting Habitus Zone.', 'success');
            
            // Reload page to update subscription status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(data.message || 'Payment failed. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Payment error:', error);
        
        // Reset button
        const submitBtn = document.querySelector('.submit-payment-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe Now';
        
        showNotification('An error occurred. Please try again.', 'error');
    });
}

/**
 * Manage existing subscription
 */
function manageSubscription() {
    // Show subscription management options
    if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
        cancelSubscription();
    }
}

/**
 * Cancel subscription
 */
function cancelSubscription() {
    fetch('../php/api/subscription/cancel.php', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Subscription cancelled. You will retain access until ' + data.expires_date, 'info');
            
            // Reload page to update status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(data.message || 'Error cancelling subscription', 'error');
        }
    })
    .catch(error => {
        console.error('Cancel error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

/**
 * Downgrade to free plan
 */
function downgradeToFree() {
    if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
        cancelSubscription();
    }
}

/**
 * Toggle FAQ answer
 * @param {HTMLElement} questionElement - The question button element
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    
    // Toggle active class
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
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
    }, 4000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('payment-modal');
        if (modal && modal.style.display === 'flex') {
            closePaymentModal();
        }
    }
});