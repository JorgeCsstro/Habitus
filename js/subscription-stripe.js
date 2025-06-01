// subscription-stripe.js - Fixed Stripe payment integration for Habitus Zone

let selectedPlan = null;
let elements = null;
let paymentIntentClientSecret = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Subscription page loaded');
    
    // Check if Stripe is available
    if (typeof stripe === 'undefined') {
        console.error('❌ Stripe not loaded! Check your publishable key.');
        return;
    }
    
    console.log('✅ Stripe loaded successfully');
    
    // Initialize FAQ toggles
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
    
    console.log('✅ FAQ toggles initialized');
});

/**
 * Subscribe to a plan - Initialize Stripe payment
 * @param {string} planType - Type of plan (adfree or premium)
 */
async function subscribeToPlan(planType) {
    console.log('🎯 subscribeToPlan called with:', planType);
    
    selectedPlan = planType;
    
    // Update modal content based on plan
    const planDetails = {
        adfree: {
            name: 'Ad-Free Plan',
            price: '€1/month',
            features: ['No advertisements', 'Clean interface', 'Support development']
        },
        premium: {
            name: 'Premium Plan',
            price: '€5/month',
            features: ['No advertisements', 'Exclusive items', 'Premium themes', 'Priority support', 'Early access']
        }
    };
    
    document.getElementById('selected-plan-name').textContent = planDetails[planType].name;
    document.getElementById('selected-plan-price').textContent = planDetails[planType].price;
    
    // Show modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
    console.log('💳 Payment modal shown');
    
    // Initialize Stripe payment
    await initializeStripePayment();
}

/**
 * Initialize Stripe Payment Element
 */
async function initializeStripePayment() {
    console.log('🔧 Initializing Stripe payment...');
    setLoading(true);
    showMessage(''); // Clear any previous messages
    
    try {
        // Create payment intent on server
        console.log('📡 Creating payment intent...');
        const response = await fetch('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: selectedPlan })
        });
        
        const data = await response.json();
        console.log('📡 Payment intent response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to initialize payment');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        
        // Configure Stripe Elements appearance
        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#8d5b4c',
                colorBackground: '#ffffff',
                colorSurface: '#ffffff',
                colorText: '#2d2926',
                colorDanger: '#a15c5c',
                fontFamily: 'Poppins, sans-serif',
                fontSizeBase: '16px',
                spacingUnit: '4px',
                borderRadius: '8px'
            }
        };
        
        // Create Stripe Elements
        console.log('🎨 Creating Stripe elements...');
        elements = stripe.elements({
            clientSecret: paymentIntentClientSecret,
            appearance
        });
        
        // Create and mount Payment Element
        const paymentElementOptions = {
            layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: false
            },
            paymentMethodOrder: ['card'], // Show card first
            fields: {
                billingDetails: {
                    name: 'auto',
                    email: 'auto'
                }
            }
        };
        
        const paymentElement = elements.create('payment', paymentElementOptions);
        
        // Clear the container first
        const container = document.getElementById('payment-element');
        container.innerHTML = '';
        
        // Mount the payment element
        console.log('🔗 Mounting payment element...');
        paymentElement.mount('#payment-element');
        
        // Listen for element ready event
        paymentElement.on('ready', function(event) {
            console.log('✅ Payment element ready');
            setLoading(false);
            
            // Enable submit button
            const submitBtn = document.getElementById('submit-payment-btn');
            submitBtn.disabled = false;
        });
        
        // Listen for payment method change
        paymentElement.on('change', function(event) {
            if (event.error) {
                showMessage(event.error.message);
            } else {
                showMessage('');
            }
        });
        
    } catch (error) {
        console.error('❌ Error initializing payment:', error);
        showMessage(error.message || 'Failed to initialize payment. Please try again.');
        setLoading(false);
    }
}

// Handle form submission
document.getElementById('payment-form').addEventListener('submit', handleSubmit);

/**
 * Handle payment form submission
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();
    console.log('💳 Payment form submitted');
    
    if (!stripe || !elements) {
        console.error('❌ Stripe not initialized');
        showMessage('Payment system not ready. Please refresh and try again.');
        return;
    }
    
    setLoading(true);
    showMessage('');
    
    try {
        console.log('🔐 Confirming payment...');
        
        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/pages/subscription.php',
                receipt_email: null, // Will use email from billing details
            },
            redirect: 'if_required'
        });
        
        if (error) {
            // Show error to customer
            console.error('❌ Payment error:', error);
            if (error.type === 'card_error' || error.type === 'validation_error') {
                showMessage(error.message);
            } else if (error.code === 'payment_intent_authentication_failure') {
                showMessage('Authentication failed. Please try again.');
            } else {
                showMessage('An unexpected error occurred. Please try again.');
            }
            setLoading(false);
        } else if (paymentIntent) {
            // Payment succeeded or requires further action
            console.log('✅ Payment intent status:', paymentIntent.status);
            
            if (paymentIntent.status === 'succeeded') {
                // Payment succeeded, activate subscription
                await activateSubscription(paymentIntent.id);
            } else if (paymentIntent.status === 'processing') {
                // Payment is processing
                showMessage('Payment is processing. You will receive a confirmation soon.');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else if (paymentIntent.status === 'requires_action') {
                // Additional authentication required
                showMessage('Additional authentication required. Please complete the process.');
            }
        }
    } catch (error) {
        console.error('❌ Payment error:', error);
        showMessage('Payment failed. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
async function activateSubscription(paymentIntentId) {
    console.log('🎉 Activating subscription for payment:', paymentIntentId);
    
    try {
        const response = await fetch('../php/api/subscription/activate-subscription.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan: selectedPlan,
                payment_intent_id: paymentIntentId
            })
        });
        
        const data = await response.json();
        console.log('🎉 Activation response:', data);
        
        if (data.success) {
            // Show success message
            showNotification('Subscription activated successfully! Reloading...', 'success');
            
            // Close modal
            closePaymentModal();
            
            // Reload page after delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to activate subscription');
        }
    } catch (error) {
        console.error('❌ Activation error:', error);
        showMessage('Payment succeeded but activation failed. Please contact support.');
    }
    
    setLoading(false);
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    console.log('🚪 Closing payment modal');
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    
    // Clear Stripe elements
    if (elements) {
        elements = null;
        paymentIntentClientSecret = null;
    }
    
    // Clear any messages
    showMessage('');
    
    // Reset form state
    setLoading(false);
}

/**
 * Show message in payment form
 * @param {string} messageText - Message to display
 */
function showMessage(messageText) {
    const messageContainer = document.getElementById('payment-message');
    
    if (!messageContainer) {
        console.warn('⚠️ Payment message container not found');
        return;
    }
    
    if (!messageText) {
        messageContainer.classList.add('hidden');
        messageContainer.textContent = '';
        return;
    }
    
    messageContainer.classList.remove('hidden');
    messageContainer.textContent = messageText;
}

/**
 * Set loading state
 * @param {boolean} isLoading - Loading state
 */
function setLoading(isLoading) {
    const submitButton = document.getElementById('submit-payment-btn');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');
    const paymentElement = document.getElementById('payment-element');
    
    if (submitButton) {
        submitButton.disabled = isLoading;
    }
    
    if (spinner && buttonText) {
        if (isLoading) {
            spinner.classList.remove('hidden');
            buttonText.classList.add('hidden');
        } else {
            spinner.classList.add('hidden');
            buttonText.classList.remove('hidden');
        }
    }
    
    // Show loading state in payment element area
    if (isLoading && paymentElement && !elements) {
        paymentElement.innerHTML = '<div class="loading-message">Loading payment form...</div>';
    }
}

/**
 * Manage existing subscription
 */
async function manageSubscription() {
    // Show subscription management options
    const action = confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.');
    
    if (action) {
        await cancelSubscription();
    }
}

/**
 * Cancel subscription
 */
async function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
        return;
    }
    
    try {
        const response = await fetch('../php/api/subscription/cancel.php', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'info');
            
            // Reload page to update status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(data.message || 'Error cancelling subscription', 'error');
        }
    } catch (error) {
        console.error('❌ Cancel error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
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
 * Toggle FAQ answer visibility
 * @param {HTMLElement} questionElement - The question button element
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = questionElement.querySelector('img');
    
    // Toggle active class
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
    
    // Rotate icon
    if (questionElement.classList.contains('active')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
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

// Debug logging
console.log('🔧 Subscription Stripe JS loaded');

// Make functions globally available for testing
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.manageSubscription = manageSubscription;