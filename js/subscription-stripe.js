// subscription-stripe.js - Enhanced Stripe payment integration for Habitus Zone

let selectedPlan = null;
let elements = null;
let paymentIntentClientSecret = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize FAQ toggles
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
});

/**
 * Subscribe to a plan - Initialize Stripe payment
 * @param {string} planType - Type of plan (adfree or premium)
 */
async function subscribeToPlan(planType) {
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
    document.getElementById('payment-modal').style.display = 'flex';
    
    // Initialize Stripe payment
    await initializeStripePayment();
}

/**
 * Initialize Stripe Payment Element
 */
async function initializeStripePayment() {
    setLoading(true);
    showMessage(''); // Clear any previous messages
    
    try {
        // Create payment intent on server
        const response = await fetch('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: selectedPlan })
        });
        
        const data = await response.json();
        
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
            },
            rules: {
                '.Tab': {
                    border: '1px solid #e9e2d9',
                    boxShadow: '0 2px 5px rgba(141, 91, 76, 0.08)',
                },
                '.Tab:hover': {
                    backgroundColor: '#f5f1ea',
                },
                '.Tab--selected': {
                    backgroundColor: '#f5f1ea',
                    borderColor: '#8d5b4c',
                },
                '.Input': {
                    borderColor: '#e9e2d9',
                },
                '.Input:focus': {
                    borderColor: '#8d5b4c',
                    boxShadow: '0 0 0 3px rgba(141, 91, 76, 0.1)',
                }
            }
        };
        
        // Create Stripe Elements
        elements = stripe.elements({
            clientSecret: paymentIntentClientSecret,
            appearance
        });
        
        // Create and mount Payment Element with options
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
            },
            wallets: {
                applePay: 'auto',
                googlePay: 'auto'
            }
        };
        
        const paymentElement = elements.create('payment', paymentElementOptions);
        
        // Clear the container first
        const container = document.getElementById('payment-element');
        container.innerHTML = '';
        
        // Mount the payment element
        paymentElement.mount('#payment-element');
        
        // Listen for element ready event
        paymentElement.on('ready', function(event) {
            setLoading(false);
            
            // Check if wallet payments are available
            if (event.availablePaymentMethods) {
                console.log('Available payment methods:', event.availablePaymentMethods);
            }
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
        console.error('Error initializing payment:', error);
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
    
    if (!stripe || !elements) {
        console.error('Stripe not initialized');
        return;
    }
    
    setLoading(true);
    showMessage('');
    
    try {
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
        console.error('Payment error:', error);
        showMessage('Payment failed. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
async function activateSubscription(paymentIntentId) {
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
        console.error('Activation error:', error);
        showMessage('Payment succeeded but activation failed. Please contact support.');
    }
    
    setLoading(false);
}

/**
 * Close payment modal
 */
function closePaymentModal() {
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
        const response = await fetch('../php/api/subscription/manage-subscription.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=cancel'
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
        console.error('Cancel error:', error);
        showNotification('An error occurred. Please try again.', 'error');
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

// Add CSS for loading message
const style = document.createElement('style');
style.textContent = `
    .loading-message {
        text-align: center;
        padding: 40px;
        color: #5a5755;
        font-style: italic;
    }
`;
document.head.appendChild(style);