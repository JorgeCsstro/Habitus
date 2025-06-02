// subscription-stripe.js - COMPLETE FIX for Stripe Element Display Issues

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;
let stripe = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// COMPLETE FIX: Minimal Stripe appearance configuration
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
        spacingUnit: '6px'
    },
    rules: {
        '.Tab': {
            border: '1px solid #e9e2d9',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            fontSize: '16px'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0'
        },
        '.Tab--selected': {
            borderColor: '#6a8d7f',
            backgroundColor: '#f5f1ea'
        },
        '.Input': {
            border: '1px solid #e9e2d9',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#ffffff'
        },
        '.Input:focus': {
            borderColor: '#6a8d7f',
            outline: 'none'
        },
        '.Input:hover': {
            borderColor: '#d6cfc7'
        },
        '.Input--invalid': {
            borderColor: '#e53e3e'
        },
        '.Label': {
            fontWeight: '600',
            fontSize: '14px',
            color: '#5a5755',
            fontFamily: 'inherit'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '14px',
            fontWeight: '500'
        }
    }
};

// COMPLETE FIX: Optimal payment element options for full display
const paymentElementOptions = {
    layout: {
        type: 'tabs',
        defaultCollapsed: false,
        radios: false
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
    console.log(`${emoji} [${timestamp}] Stripe Fixed: ${message}`, data || '');
}

/**
 * Initialize everything when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'COMPLETE FIX: Initializing subscription system...');
    
    if (!initializeStripe()) {
        return;
    }
    
    setupEventHandlers();
    debugLog('success', 'COMPLETE FIX: Subscription system fully initialized');
});

/**
 * Initialize Stripe with error handling
 */
function initializeStripe() {
    if (typeof window.Stripe === 'undefined') {
        debugLog('error', 'Stripe library not loaded!');
        showAlert('Payment system not available. Please refresh the page.', 'error');
        disableAllSubscriptionButtons('Payment System Error');
        return false;
    }
    
    if (!window.stripe) {
        debugLog('error', 'Stripe instance not available');
        showAlert('Payment system not configured. Please contact support.', 'error');
        disableAllSubscriptionButtons('Configuration Error');
        return false;
    }
    
    try {
        stripe = window.stripe;
        debugLog('success', 'Stripe loaded and configured successfully');
        return true;
    } catch (error) {
        debugLog('error', 'Stripe initialization failed:', error);
        showAlert('Payment initialization error. Please refresh the page.', 'error');
        disableAllSubscriptionButtons('Initialization Error');
        return false;
    }
}

/**
 * Set up all event handlers
 */
function setupEventHandlers() {
    // Modal handlers
    const modal = document.getElementById('payment-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closePaymentModal);
    });
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });
    }
    
    // Keyboard handlers
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('payment-modal');
            if (modal && modal.classList.contains('show')) {
                closePaymentModal();
            }
        }
    });
    
    // Form handler
    const form = document.getElementById('payment-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // FAQ handlers
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
}

/**
 * COMPLETE FIX: Subscribe to a plan
 */
async function subscribeToPlan(planType) {
    debugLog('info', `COMPLETE FIX: Starting subscription for: ${planType}`);
    
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('Invalid plan selected', 'error');
        return;
    }
    
    if (!stripe) {
        showAlert('Payment system not ready. Please refresh the page.', 'error');
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
    document.body.style.overflow = 'hidden';
    
    // Initialize payment with delay for proper rendering
    setTimeout(() => {
        initializeStripePayment();
    }, 200);
}

/**
 * COMPLETE FIX: Initialize Stripe payment form
 */
async function initializeStripePayment() {
    debugLog('info', 'COMPLETE FIX: Initializing Stripe payment form...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found');
        return;
    }
    
    // Show loading state
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Setting up secure payment form...</p>
            <small>Please wait a moment...</small>
        </div>
    `;
    
    try {
        // Create payment intent
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
        
        // COMPLETE FIX: Create Stripe elements
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance
        });
        
        // COMPLETE FIX: Create payment element
        paymentElement = elements.create('payment', paymentElementOptions);
        
        // COMPLETE FIX: Clear container and create minimal mount point
        paymentContainer.innerHTML = '<div id="stripe-payment-element"></div>';
        
        // COMPLETE FIX: Mount the payment element
        debugLog('info', 'Mounting payment element...');
        await paymentElement.mount('#stripe-payment-element');
        
        debugLog('success', 'COMPLETE FIX: Payment element mounted successfully');
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Set up event listeners
        setupPaymentElementListeners();
        
        // COMPLETE FIX: Ensure proper sizing after mount
        setTimeout(() => {
            ensureProperSizing();
        }, 100);
        
    } catch (error) {
        debugLog('error', 'Payment initialization failed:', error);
        handlePaymentInitError(error);
    }
}

/**
 * COMPLETE FIX: Ensure proper sizing of payment element
 */
function ensureProperSizing() {
    const paymentContainer = document.getElementById('payment-element');
    const stripeContainer = document.getElementById('stripe-payment-element');
    
    if (paymentContainer && stripeContainer) {
        // Force reflow to ensure proper sizing
        const iframe = stripeContainer.querySelector('iframe');
        if (iframe) {
            debugLog('debug', 'COMPLETE FIX: Payment form iframe detected and sized properly');
            
            // Log dimensions for debugging
            debugLog('debug', 'Container dimensions:', {
                container: {
                    width: paymentContainer.offsetWidth,
                    height: paymentContainer.offsetHeight
                },
                stripeContainer: {
                    width: stripeContainer.offsetWidth,
                    height: stripeContainer.offsetHeight
                },
                iframe: {
                    width: iframe.offsetWidth,
                    height: iframe.offsetHeight
                }
            });
        }
    }
}

/**
 * Set up payment element event listeners
 */
function setupPaymentElementListeners() {
    if (!paymentElement) return;
    
    paymentElement.on('ready', function() {
        debugLog('success', 'COMPLETE FIX: Payment element ready for input');
        ensureProperSizing();
    });
    
    paymentElement.on('change', function(event) {
        if (event.error) {
            showMessage(event.error.message);
            debugLog('warning', 'Payment validation error:', event.error);
        } else {
            showMessage('');
            debugLog('debug', 'Payment element validation passed');
        }
    });
    
    paymentElement.on('focus', function() {
        debugLog('debug', 'Payment element focused');
    });
    
    paymentElement.on('blur', function() {
        debugLog('debug', 'Payment element blurred');
    });
    
    paymentElement.on('loaderror', function(event) {
        debugLog('error', 'Payment element load error:', event);
        showMessage('Error loading payment form. Please refresh and try again.');
    });
}

/**
 * Handle payment initialization errors
 */
function handlePaymentInitError(error) {
    retryAttempts++;
    
    const paymentContainer = document.getElementById('payment-element');
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

/**
 * COMPLETE FIX: Handle form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    debugLog('info', 'COMPLETE FIX: Processing payment submission...');
    
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
            handlePaymentError(error);
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            debugLog('success', 'Payment succeeded:', paymentIntent.id);
            showMessage('Payment successful! Activating subscription...');
            await activateSubscription(paymentIntent.id);
        } else {
            debugLog('warning', 'Unexpected payment status:', paymentIntent?.status);
            showMessage(`Payment status: ${paymentIntent?.status || 'unknown'}. Please contact support.`);
            setLoading(false);
        }
        
    } catch (error) {
        debugLog('error', 'Payment processing error:', error);
        showMessage('An unexpected error occurred. Please try again.');
        setLoading(false);
    }
}

/**
 * Handle payment errors with specific messages
 */
function handlePaymentError(error) {
    let errorMessage = 'Payment failed. Please try again.';
    
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
}

/**
 * Activate subscription after successful payment
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
            showAlert('🎉 Subscription activated successfully! Welcome to premium features!', 'success');
            showMessage('Subscription activated! Refreshing page...');
            
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
        showAlert('Payment successful but activation failed. Please contact support.', 'warning');
    }
    
    setLoading(false);
}

/**
 * COMPLETE FIX: Close payment modal and clean up
 */
function closePaymentModal() {
    debugLog('info', 'COMPLETE FIX: Closing payment modal');
    
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Clean up Stripe elements
    if (paymentElement) {
        try {
            paymentElement.unmount();
            debugLog('debug', 'Payment element unmounted successfully');
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
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `subscription-alert ${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 100000;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 500;
        color: white;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        info: '#4299e1',
        warning: '#ed8936'
    };
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(alertDiv);
    
    // Animate in
    setTimeout(() => {
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
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
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * Disable all subscription buttons
 */
function disableAllSubscriptionButtons(reason) {
    document.addEventListener('DOMContentLoaded', function() {
        const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
        buttons.forEach(button => {
            button.disabled = true;
            button.textContent = reason || 'Unavailable';
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        });
    });
}

/**
 * Subscription management functions
 */
function manageSubscription() {
    if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
        cancelSubscription();
    }
}

function downgradeToFree() {
    if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
        cancelSubscription();
    }
}

function cancelSubscription() {
    debugLog('info', 'Cancelling subscription...');
    
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
        debugLog('error', 'Cancel error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    });
}

// Export functions for onclick handlers
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;
window.retryPaymentInit = retryPaymentInit;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;

debugLog('success', 'COMPLETE FIX: Stripe subscription handler loaded and ready');

// Error boundary for uncaught errors
window.addEventListener('error', function(event) {
    debugLog('error', 'Uncaught error:', event.error);
    if (event.error && event.error.message && event.error.message.includes('stripe')) {
        showAlert('Payment system error detected. Please refresh the page.', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    debugLog('error', 'Unhandled promise rejection:', event.reason);
    if (event.reason && event.reason.toString().includes('stripe')) {
        showAlert('Payment processing error detected. Please try again.', 'error');
    }
});