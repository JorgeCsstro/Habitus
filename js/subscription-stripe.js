// subscription-stripe.js - CLEAN VERSION (No CSS conflicts with subscription.css)

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;
let stripe = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// Enhanced Stripe appearance configuration
const appearance = {
    theme: 'stripe',
    variables: {
        colorPrimary: '#6a8d7f',
        colorBackground: '#ffffff',
        colorText: '#2d2926',
        colorDanger: '#e53e3e',
        colorSuccess: '#38a169',
        fontFamily: 'Poppins, Quicksand, system-ui, sans-serif',
        fontSizeBase: '16px',
        borderRadius: '8px',
        spacingUnit: '6px',
        spacingGridRow: '24px',
        spacingGridColumn: '24px'
    },
    rules: {
        '.Tab': {
            border: '2px solid #e9e2d9',
            borderRadius: '10px',
            padding: '20px 24px',
            backgroundColor: '#ffffff',
            transition: 'all 0.3s ease',
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: '500'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        },
        '.Tab--selected': {
            borderColor: '#6a8d7f',
            backgroundColor: '#f5f1ea',
            boxShadow: '0 0 0 2px rgba(106, 141, 127, 0.2)',
            fontWeight: '600'
        },
        '.Input': {
            border: '2px solid #e9e2d9',
            borderRadius: '8px',
            padding: '16px 18px',
            fontSize: '16px',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            minHeight: '54px',
            fontFamily: 'inherit'
        },
        '.Input:focus': {
            borderColor: '#6a8d7f',
            boxShadow: '0 0 0 3px rgba(106, 141, 127, 0.15)',
            outline: 'none'
        },
        '.Input:hover': {
            borderColor: '#d6cfc7'
        },
        '.Input--invalid': {
            borderColor: '#e53e3e',
            boxShadow: '0 0 0 2px rgba(229, 62, 62, 0.2)'
        },
        '.Label': {
            fontWeight: '600',
            fontSize: '15px',
            color: '#5a5755',
            marginBottom: '10px',
            fontFamily: 'inherit'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '14px',
            marginTop: '10px',
            fontWeight: '500',
            lineHeight: '1.4'
        },
        '.Block': {
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '2px solid #e9e2d9',
            padding: '24px',
            marginBottom: '20px',
            transition: 'border-color 0.3s ease'
        },
        '.Block:hover': {
            borderColor: '#d6cfc7'
        }
    }
};

// Payment element options with enhanced layout
const paymentElementOptions = {
    layout: {
        type: 'tabs',
        defaultCollapsed: false,
        radios: false,
        spacedAccordionItems: true
    },
    fields: {
        billingDetails: {
            name: 'auto',
            email: 'auto',
            phone: 'never',
            address: {
                country: 'auto',
                line1: 'never',
                line2: 'never',
                city: 'never',
                state: 'never',
                postalCode: 'auto'
            }
        }
    },
    terms: {
        card: 'auto'
    },
    wallets: {
        applePay: 'auto',
        googlePay: 'auto'
    }
};

/**
 * Debug logging function
 * @param {string} level - Log level (error, success, info, debug, warning)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
function debugLog(level, message, data = null) {
    if (!debugMode && level === 'debug') return;
    
    const emoji = {
        'error': '❌',
        'success': '✅', 
        'info': 'ℹ️',
        'debug': '🔧',
        'warning': '⚠️'
    }[level] || 'ℹ️';
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji} [${timestamp}] Stripe: ${message}`, data || '');
}

/**
 * Initialize Stripe and set up event handlers when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Subscription JavaScript initializing...');
    
    // Initialize Stripe
    if (!initializeStripe()) {
        return;
    }
    
    // Set up all event handlers
    setupModalHandlers();
    setupFaqHandlers();
    setupKeyboardHandlers();
    
    debugLog('success', 'Subscription page fully initialized');
});

/**
 * Initialize Stripe with error handling
 * @returns {boolean} Success status
 */
function initializeStripe() {
    // Check if Stripe is loaded
    if (typeof window.Stripe === 'undefined') {
        debugLog('error', 'Stripe library not loaded! Make sure Stripe.js is included.');
        showAlert('Payment system not available. Please refresh the page.', 'error');
        disableAllSubscriptionButtons('Payment System Error');
        return false;
    }
    
    // Check if publishable key is available
    if (!window.stripe) {
        debugLog('error', 'Stripe instance not available');
        showAlert('Payment system not configured. Please contact support.', 'error');
        disableAllSubscriptionButtons('Configuration Error');
        return false;
    }
    
    try {
        // Use the global Stripe instance
        stripe = window.stripe;
        
        debugLog('success', 'Stripe loaded and configured successfully');
        debugLog('debug', 'Debug info:', window.debugInfo || {});
        
        return true;
        
    } catch (error) {
        debugLog('error', 'Stripe initialization failed:', error);
        showAlert('Payment initialization error. Please refresh the page.', 'error');
        disableAllSubscriptionButtons('Initialization Error');
        return false;
    }
}

/**
 * Set up modal event handlers
 */
function setupModalHandlers() {
    const modal = document.getElementById('payment-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const form = document.getElementById('payment-form');
    
    // Close button handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', closePaymentModal);
    });
    
    // Click outside modal to close
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });
    }
    
    // Form submission handler
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

/**
 * Set up FAQ handlers
 */
function setupFaqHandlers() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
}

/**
 * Set up keyboard handlers
 */
function setupKeyboardHandlers() {
    // ESC key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('payment-modal');
            if (modal && modal.classList.contains('show')) {
                closePaymentModal();
            }
        }
    });
}

/**
 * Subscribe to a plan
 * @param {string} planType - Plan type (adfree or premium)
 */
async function subscribeToPlan(planType) {
    debugLog('info', `Starting subscription process for: ${planType}`);
    
    // Validation
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('Invalid plan selected', 'error');
        debugLog('error', 'Invalid plan type:', planType);
        return;
    }
    
    if (!stripe) {
        showAlert('Payment system not ready. Please refresh the page.', 'error');
        debugLog('error', 'Stripe not available when subscribeToPlan called');
        return;
    }
    
    selectedPlan = planType;
    retryAttempts = 0;
    
    const planDetails = {
        adfree: { name: 'Ad-Free Plan', price: '€1/month' },
        premium: { name: 'Premium Plan', price: '€5/month' }
    };
    
    // Update modal content
    const modal = document.getElementById('payment-modal');
    const planNameEl = document.getElementById('selected-plan-name');
    const planPriceEl = document.getElementById('selected-plan-price');
    
    if (planNameEl) planNameEl.textContent = planDetails[planType].name;
    if (planPriceEl) planPriceEl.textContent = planDetails[planType].price;
    
    // Show modal
    modal.classList.add('show');
    
    // Focus management for accessibility
    setTimeout(() => {
        const closeButton = modal.querySelector('.close-modal');
        if (closeButton) closeButton.focus();
    }, 100);
    
    debugLog('info', 'Modal displayed, initializing payment form...');
    
    // Initialize payment after modal is visible
    setTimeout(() => {
        initializeStripePayment();
    }, 200);
}

/**
 * Initialize Stripe payment form
 */
async function initializeStripePayment() {
    debugLog('info', 'Initializing Stripe payment form...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found in DOM');
        return;
    }
    
    // Show loading state (CSS will handle styling)
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Setting up secure payment...</p>
            <small>This may take a few seconds</small>
        </div>
    `;
    
    try {
        // Create payment intent with retry logic
        debugLog('info', 'Creating payment intent...');
        const response = await fetchWithRetry('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: selectedPlan })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('debug', 'Payment intent response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to create payment intent');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        
        // Create Stripe elements with enhanced appearance
        debugLog('info', 'Creating Stripe elements...');
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance
        });
        
        // Create payment element with options
        paymentElement = elements.create('payment', paymentElementOptions);
        
        // Clear loading and create proper container
        paymentContainer.innerHTML = '<div id="stripe-payment-element"></div>';
        
        // Mount the payment element
        debugLog('info', 'Mounting payment element...');
        await paymentElement.mount('#stripe-payment-element');
        
        debugLog('success', 'Payment element mounted successfully');
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Set up enhanced event listeners
        setupPaymentElementListeners();
        
    } catch (error) {
        debugLog('error', 'Payment initialization failed:', error);
        
        retryAttempts++;
        
        paymentContainer.innerHTML = `
            <div class="stripe-error">
                <div class="error-icon">⚠️</div>
                <h4>Payment Form Error</h4>
                <p>${error.message}</p>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                    ${retryAttempts < maxRetryAttempts ? 
                        '<button onclick="retryPaymentInit()" class="retry-btn">🔄 Try Again</button>' : 
                        '<button onclick="closePaymentModal()" class="retry-btn">Close</button>'
                    }
                </div>
                ${retryAttempts < maxRetryAttempts ? 
                    `<small style="color: #666; margin-top: 10px;">Attempt ${retryAttempts} of ${maxRetryAttempts}</small>` : 
                    '<small style="color: #666; margin-top: 10px;">Please try again later or contact support</small>'
                }
            </div>
        `;
    }
}

/**
 * Set up payment element event listeners
 */
function setupPaymentElementListeners() {
    if (!paymentElement) return;
    
    paymentElement.on('ready', function() {
        debugLog('success', 'Payment element ready for user input');
    });
    
    paymentElement.on('change', function(event) {
        if (event.error) {
            showMessage(event.error.message);
            debugLog('warning', 'Payment element validation error:', event.error);
        } else {
            showMessage('');
            debugLog('debug', 'Payment element state changed (valid)');
        }
    });
    
    paymentElement.on('focus', function() {
        debugLog('debug', 'Payment element focused');
    });
    
    paymentElement.on('blur', function() {
        debugLog('debug', 'Payment element blurred');
    });
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();
    debugLog('info', 'Processing payment submission...');
    
    if (!stripe || !elements || !paymentElement) {
        const errorMsg = 'Payment system not ready. Please try again.';
        showMessage(errorMsg);
        debugLog('error', errorMsg);
        return;
    }
    
    setLoading(true);
    showMessage('');
    
    try {
        const {error, paymentIntent} = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
            },
            redirect: 'if_required'
        });
        
        if (error) {
            debugLog('error', 'Payment confirmation error:', error);
            
            let errorMessage = 'Payment failed. Please try again.';
            
            // Enhanced error handling
            switch (error.type) {
                case 'card_error':
                case 'validation_error':
                    errorMessage = error.message;
                    break;
                case 'authentication_error':
                    errorMessage = 'Authentication failed. Please check your payment details.';
                    break;
                case 'rate_limit_error':
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                    break;
                case 'api_connection_error':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
                case 'api_error':
                    errorMessage = 'Payment service error. Please try again later.';
                    break;
                case 'idempotency_error':
                    errorMessage = 'Payment already processed. Please refresh and try again.';
                    break;
                default:
                    errorMessage = error.message || 'An unexpected error occurred.';
            }
            
            showMessage(errorMessage);
            setLoading(false);
            
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            debugLog('success', 'Payment succeeded:', paymentIntent.id);
            showMessage('Payment successful! Activating subscription...');
            await activateSubscription(paymentIntent.id);
            
        } else {
            debugLog('warning', 'Unexpected payment status:', paymentIntent?.status);
            const statusMsg = `Payment status: ${paymentIntent?.status || 'unknown'}. Please contact support if this persists.`;
            showMessage(statusMsg);
            setLoading(false);
        }
        
    } catch (error) {
        debugLog('error', 'Payment processing error:', error);
        showMessage('An unexpected error occurred during payment processing. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
async function activateSubscription(paymentIntentId) {
    debugLog('info', 'Activating subscription...');
    
    try {
        const response = await fetchWithRetry('../php/api/subscription/activate-subscription.php', {
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
            debugLog('success', 'Subscription activated successfully');
            showAlert('🎉 Subscription activated successfully! Welcome to premium!', 'success');
            
            showMessage('Subscription activated! Refreshing page...');
            
            // Smooth transition before reload
            setTimeout(() => {
                closePaymentModal();
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }, 2000);
            
        } else {
            throw new Error(data.message || 'Activation failed');
        }
    } catch (error) {
        debugLog('error', 'Subscription activation error:', error);
        showMessage(`Payment succeeded but activation failed. Please contact support with payment ID: ${paymentIntentId}`);
        
        // Still show success for payment, but indicate activation issue
        showAlert('Payment successful but activation failed. Please contact support.', 'warning');
    }
    
    setLoading(false);
}

/**
 * Close payment modal and clean up
 */
function closePaymentModal() {
    debugLog('info', 'Closing payment modal');
    
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('show');
    
    // Clean up Stripe elements
    if (paymentElement) {
        try {
            paymentElement.unmount();
        } catch (e) {
            debugLog('warning', 'Error unmounting payment element:', e);
        }
        paymentElement = null;
    }
    
    if (elements) {
        elements = null;
    }
    
    // Reset state
    selectedPlan = null;
    paymentIntentClientSecret = null;
    retryAttempts = 0;
    
    showMessage('');
    setLoading(false);
    
    debugLog('info', 'Payment modal closed and cleaned up');
}

/**
 * Show payment message
 * @param {string} messageText - Message to display
 */
function showMessage(messageText) {
    const messageContainer = document.getElementById('payment-message');
    if (!messageContainer) return;
    
    if (!messageText) {
        messageContainer.classList.add('hidden');
        messageContainer.textContent = '';
        return;
    }
    
    messageContainer.classList.remove('hidden');
    messageContainer.textContent = messageText;
    
    // Auto-hide success messages
    if (messageText.toLowerCase().includes('success') || 
        messageText.toLowerCase().includes('activat')) {
        setTimeout(() => {
            if (messageContainer.textContent === messageText) {
                messageContainer.classList.add('hidden');
            }
        }, 5000);
    }
}

/**
 * Set loading state for submit button
 * @param {boolean} isLoading - Loading state
 */
function setLoading(isLoading) {
    const submitButton = document.getElementById('submit-payment-btn');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');
    
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
}

/**
 * Toggle FAQ answer visibility
 * @param {HTMLElement} questionElement - The question button element
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = questionElement.querySelector('img');
    
    // Close other open FAQs
    document.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
        if (activeQuestion !== questionElement) {
            const activeFaq = activeQuestion.closest('.faq-item');
            const activeAnswer = activeFaq.querySelector('.faq-answer');
            const activeIcon = activeQuestion.querySelector('img');
            
            activeQuestion.classList.remove('active');
            activeAnswer.classList.remove('show');
            activeAnswer.style.maxHeight = '0';
            if (activeIcon) activeIcon.style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle current FAQ
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
    
    if (answer.classList.contains('show')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = '0';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Show alert notification
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, info, warning)
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `subscription-alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Animate in
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 400);
    }, type === 'success' ? 6000 : 5000);
}

/**
 * Retry payment initialization
 */
function retryPaymentInit() {
    debugLog('info', `Retrying payment initialization (attempt ${retryAttempts + 1})`);
    initializeStripePayment();
}

/**
 * Utility function for fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithRetry(url, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            debugLog('warning', `Fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

/**
 * Disable all subscription buttons with reason
 * @param {string} reason - Reason for disabling
 */
function disableAllSubscriptionButtons(reason) {
    document.addEventListener('DOMContentLoaded', function() {
        const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
        buttons.forEach(button => {
            button.disabled = true;
            button.textContent = reason || 'Unavailable';
        });
    });
}

/**
 * Subscription management functions
 */

/**
 * Manage existing subscription
 */
function manageSubscription() {
    if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
        cancelSubscription();
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
 * Cancel subscription
 */
function cancelSubscription() {
    fetch('../php/api/subscription/cancel.php', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Subscription cancelled. You will retain access until ' + data.expires_date, 'info');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showAlert(data.message || 'Error cancelling subscription', 'error');
        }
    })
    .catch(error => {
        console.error('Cancel error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    });
}

// Global function exports for onclick handlers
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;
window.retryPaymentInit = retryPaymentInit;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;

// Initialize logging
debugLog('success', 'Stripe subscription handler loaded and ready');