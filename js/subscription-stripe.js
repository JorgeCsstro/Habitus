// subscription-stripe.js - FIXED VERSION with Proper Payment Element Display

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;
let stripe = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// Enhanced Stripe appearance configuration for better form display
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
        spacingUnit: '10px',
        spacingGridRow: '30px',
        spacingGridColumn: '30px',
        tabSpacing: '20px'
    },
    rules: {
        '.Tab': {
            border: '2px solid #e9e2d9',
            borderRadius: '12px',
            padding: '24px 28px',
            backgroundColor: '#ffffff',
            transition: 'all 0.3s ease',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '500',
            minHeight: '80px',
            boxSizing: 'border-box'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        '.Tab--selected': {
            borderColor: '#6a8d7f',
            backgroundColor: '#f5f1ea',
            boxShadow: '0 0 0 3px rgba(106, 141, 127, 0.2)',
            fontWeight: '600'
        },
        '.Input': {
            border: '2px solid #e9e2d9',
            borderRadius: '10px',
            padding: '20px 24px',
            fontSize: '16px',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            minHeight: '60px',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
        },
        '.Input:focus': {
            borderColor: '#6a8d7f',
            boxShadow: '0 0 0 4px rgba(106, 141, 127, 0.15)',
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
            fontSize: '16px',
            color: '#5a5755',
            marginBottom: '15px',
            fontFamily: 'inherit'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '15px',
            marginTop: '15px',
            fontWeight: '500',
            lineHeight: '1.4'
        },
        '.Block': {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #e9e2d9',
            padding: '30px',
            marginBottom: '25px',
            transition: 'border-color 0.3s ease',
            minHeight: '90px',
            boxSizing: 'border-box'
        },
        '.Block:hover': {
            borderColor: '#d6cfc7'
        }
    }
};

// Enhanced payment element options with proper layout for maximum display
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
    },
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
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
    debugLog('info', 'Fixed subscription JavaScript initializing...');
    
    // Initialize Stripe
    if (!initializeStripe()) {
        return;
    }
    
    // Set up all event handlers
    setupModalHandlers();
    setupFaqHandlers();
    setupKeyboardHandlers();
    setupFormHandlers();
    
    debugLog('success', 'Fixed subscription page fully initialized');
});

/**
 * Initialize Stripe with enhanced error handling
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
 * Set up form handlers
 */
function setupFormHandlers() {
    const form = document.getElementById('payment-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

/**
 * Subscribe to a plan - FIXED VERSION
 * @param {string} planType - Plan type (adfree or premium)
 */
async function subscribeToPlan(planType) {
    debugLog('info', `Starting fixed subscription process for: ${planType}`);
    
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
    
    // Show modal with enhanced animation
    modal.classList.add('show');
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    setTimeout(() => {
        const closeButton = modal.querySelector('.close-modal');
        if (closeButton) closeButton.focus();
    }, 100);
    
    debugLog('info', 'Fixed modal displayed, initializing payment form...');
    
    // Initialize payment after modal is visible with longer delay for proper rendering
    setTimeout(() => {
        initializeFixedStripePayment();
    }, 500);
}

/**
 * Initialize fixed Stripe payment form
 */
async function initializeFixedStripePayment() {
    debugLog('info', 'Initializing fixed Stripe payment form...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found in DOM');
        return;
    }
    
    // Show enhanced loading state with fixed height
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Setting up secure payment form...</p>
            <small>This may take a few seconds</small>
        </div>
    `;
    
    try {
        // Create payment intent with enhanced retry logic
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
        debugLog('debug', 'Fixed payment intent response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to create payment intent');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        
        // Create Stripe elements with fixed appearance
        debugLog('info', 'Creating fixed Stripe elements...');
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance
        });
        
        // Create payment element with fixed options
        paymentElement = elements.create('payment', paymentElementOptions);
        
        // Clear loading and create proper container with fixed structure
        paymentContainer.innerHTML = '<div id="stripe-payment-element" style="min-height: 560px; height: auto;"></div>';
        
        // Mount the payment element with error handling
        debugLog('info', 'Mounting fixed payment element...');
        
        try {
            await paymentElement.mount('#stripe-payment-element');
            debugLog('success', 'Fixed payment element mounted successfully');
            
            // Force a resize after mounting to ensure proper display
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                debugLog('debug', 'Triggered resize event for payment element');
            }, 500);
            
        } catch (mountError) {
            debugLog('error', 'Payment element mount failed:', mountError);
            throw new Error('Failed to mount payment form: ' + mountError.message);
        }
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Set up enhanced event listeners
        setupFixedPaymentElementListeners();
        
    } catch (error) {
        debugLog('error', 'Fixed payment initialization failed:', error);
        
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
 * Set up fixed payment element event listeners
 */
function setupFixedPaymentElementListeners() {
    if (!paymentElement) return;
    
    paymentElement.on('ready', function() {
        debugLog('success', 'Fixed payment element ready for user input');
        
        // Additional resize trigger when element is ready
        setTimeout(() => {
            const iframe = document.querySelector('#payment-element iframe');
            if (iframe) {
                iframe.style.minHeight = '480px';
                iframe.style.height = 'auto';
                debugLog('debug', 'Applied fixed height to payment iframe');
            }
        }, 100);
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
    
    paymentElement.on('loaderror', function(event) {
        debugLog('error', 'Payment element load error:', event);
        showMessage('Error loading payment form. Please refresh and try again.');
    });
    
    // Additional event listener for element size changes
    paymentElement.on('heightchange', function(event) {
        debugLog('debug', 'Payment element height changed:', event.height);
        
        // Ensure container adjusts to content
        const container = document.getElementById('stripe-payment-element');
        if (container && event.height) {
            container.style.minHeight = Math.max(event.height + 50, 560) + 'px';
        }
    });
}

/**
 * Handle fixed form submission
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();
    debugLog('info', 'Processing fixed payment submission...');
    
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
            debugLog('error', 'Fixed payment confirmation error:', error);
            
            let errorMessage = 'Payment failed. Please try again.';
            
            // Enhanced error handling with specific messages
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
            debugLog('success', 'Fixed payment succeeded:', paymentIntent.id);
            showMessage('Payment successful! Activating subscription...');
            await activateSubscription(paymentIntent.id);
            
        } else {
            debugLog('warning', 'Unexpected payment status:', paymentIntent?.status);
            const statusMsg = `Payment status: ${paymentIntent?.status || 'unknown'}. Please contact support if this persists.`;
            showMessage(statusMsg);
            setLoading(false);
        }
        
    } catch (error) {
        debugLog('error', 'Fixed payment processing error:', error);
        showMessage('An unexpected error occurred during payment processing. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment - FIXED
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
async function activateSubscription(paymentIntentId) {
    debugLog('info', 'Activating fixed subscription...');
    
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
            debugLog('success', 'Fixed subscription activated successfully');
            showAlert('🎉 Subscription activated successfully! Welcome to premium features!', 'success');
            
            showMessage('Subscription activated! Refreshing page...');
            
            // Enhanced smooth transition before reload
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
        debugLog('error', 'Fixed subscription activation error:', error);
        showMessage(`Payment succeeded but activation failed. Please contact support with payment ID: ${paymentIntentId}`);
        
        // Still show success for payment, but indicate activation issue
        showAlert('Payment successful but activation failed. Please contact support.', 'warning');
    }
    
    setLoading(false);
}

/**
 * Close payment modal and clean up - FIXED
 */
function closePaymentModal() {
    debugLog('info', 'Closing fixed payment modal');
    
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('show');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Enhanced cleanup of Stripe elements
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
    
    debugLog('info', 'Fixed payment modal closed and cleaned up');
}

/**
 * Show fixed payment message
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
 * Set fixed loading state for submit button
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
 * Toggle FAQ answer visibility - FIXED
 * @param {HTMLElement} questionElement - The question button element
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = questionElement.querySelector('img');
    
    // Close other open FAQs with enhanced animation
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
    
    // Toggle current FAQ with enhanced animation
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
 * Show fixed alert notification
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, info, warning)
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `subscription-alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Enhanced animate in
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    // Remove after delay with enhanced timing
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 400);
    }, type === 'success' ? 6000 : 5000);
}

/**
 * Retry payment initialization - FIXED
 */
function retryPaymentInit() {
    debugLog('info', `Retrying fixed payment initialization (attempt ${retryAttempts + 1})`);
    initializeFixedStripePayment();
}

/**
 * Fixed utility function for fetch with retry logic
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
            debugLog('warning', `Fixed fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries) {
                throw error;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * Disable all subscription buttons with reason - FIXED
 * @param {string} reason - Reason for disabling
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
 * Fixed subscription management functions
 */

/**
 * Manage existing subscription - FIXED
 */
function manageSubscription() {
    if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
        cancelSubscription();
    }
}

/**
 * Downgrade to free plan - FIXED
 */
function downgradeToFree() {
    if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
        cancelSubscription();
    }
}

/**
 * Cancel subscription - FIXED
 */
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

// Fixed global function exports for onclick handlers
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;
window.retryPaymentInit = retryPaymentInit;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;

// Fixed initialization logging
debugLog('success', 'Fixed Stripe subscription handler loaded and ready');

// Fixed page visibility handling for better UX
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        debugLog('info', 'Page became visible - checking payment state');
        // Could refresh payment state if needed
    }
});

// Fixed online/offline handling
window.addEventListener('online', function() {
    debugLog('success', 'Connection restored');
    showAlert('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    debugLog('warning', 'Connection lost');
    showAlert('Connection lost. Please check your internet.', 'warning');
});

// Fixed error boundary for uncaught errors
window.addEventListener('error', function(event) {
    debugLog('error', 'Uncaught error:', event.error);
    if (event.error && event.error.message && event.error.message.includes('stripe')) {
        showAlert('Payment system error detected. Please refresh the page.', 'error');
    }
});

// Fixed unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    debugLog('error', 'Unhandled promise rejection:', event.reason);
    if (event.reason && event.reason.toString().includes('stripe')) {
        showAlert('Payment processing error detected. Please try again.', 'error');
    }
});

// Fixed window resize handler to help with payment element display
window.addEventListener('resize', function() {
    if (paymentElement) {
        debugLog('debug', 'Window resized, triggering payment element reflow');
        // Small delay to allow for CSS transitions
        setTimeout(() => {
            const iframe = document.querySelector('#payment-element iframe');
            if (iframe) {
                iframe.style.height = 'auto';
                iframe.style.minHeight = '480px';
            }
        }, 100);
    }
});

debugLog('success', 'Fixed error handlers and event listeners configured');