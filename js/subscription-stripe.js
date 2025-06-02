// js/subscription-stripe.js - COMPLETE ENHANCED VERSION for Google Pay Fix

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;
let stripe = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// Enhanced debug logging
function debugLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [STRIPE-${level.toUpperCase()}]`;
    
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// ENHANCED: Appearance configuration optimized for Google Pay
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
        gridColumnSpacing: '8px',
        gridRowSpacing: '8px'
    },
    rules: {
        '.Tab': {
            border: '1px solid #e9e2d9',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            fontSize: '16px',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            marginBottom: '8px'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0',
            transform: 'translateY(-1px)'
        },
        '.Tab--selected': {
            borderColor: '#6a8d7f',
            backgroundColor: '#f5f1ea',
            boxShadow: '0 2px 8px rgba(106, 141, 127, 0.15)'
        },
        '.Tab[data-testid="tab-googlePay"]': {
            backgroundColor: '#4285f4 !important',
            color: 'white !important',
            border: '1px solid #4285f4 !important',
            fontWeight: '700 !important'
        },
        '.Tab[data-testid="tab-googlePay"]:hover': {
            backgroundColor: '#3367d6 !important',
            borderColor: '#3367d6 !important',
            transform: 'translateY(-2px) !important',
            boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3) !important'
        },
        '.Tab[data-testid="tab-applePay"]': {
            backgroundColor: '#000000 !important',
            color: 'white !important',
            border: '1px solid #000000 !important',
            fontWeight: '700 !important'
        },
        '.Tab[data-testid="tab-applePay"]:hover': {
            backgroundColor: '#333333 !important',
            transform: 'translateY(-2px) !important'
        },
        '.Input': {
            border: '1px solid #e9e2d9',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s ease'
        },
        '.Input:focus': {
            borderColor: '#6a8d7f',
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(106, 141, 127, 0.1)'
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
            fontFamily: 'inherit',
            marginBottom: '6px'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '6px'
        },
        '.TabContainer': {
            gap: '8px',
            marginBottom: '16px'
        }
    }
};

// ENHANCED: Payment element options optimized for Google Pay
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
    
    // ENHANCED: Optimized wallet configuration
    wallets: {
        googlePay: 'auto',
        applePay: 'auto',
        link: 'auto'
    },
    
    business: {
        name: 'Habitus Zone'
    },
    
    paymentMethodCreation: 'manual'
};

// Enhanced Stripe initialization with Google Pay support
function initializeStripe() {
    debugLog('info', 'Starting enhanced Stripe initialization...');
    
    if (typeof window.Stripe === 'undefined') {
        debugLog('error', 'Stripe library not loaded from CDN');
        showAlert('Payment system not available. Please refresh the page.', 'error');
        disableAllSubscriptionButtons('Payment System Error');
        return false;
    }
    
    if (!window.stripe) {
        debugLog('warning', 'window.stripe not available, attempting to create...');
        
        const scripts = document.querySelectorAll('script');
        let publishableKey = null;
        
        scripts.forEach(script => {
            if (script.textContent && script.textContent.includes('Stripe(')) {
                const match = script.textContent.match(/Stripe\(['"`]([^'"`]+)['"`]/);
                if (match) {
                    publishableKey = match[1];
                }
            }
        });
        
        if (publishableKey) {
            debugLog('info', 'Found publishable key, creating Stripe instance...');
            try {
                window.stripe = Stripe(publishableKey, { 
                    locale: 'auto',
                    stripeAccount: undefined
                });
                debugLog('success', 'Created Stripe instance successfully');
            } catch (error) {
                debugLog('error', 'Failed to create Stripe instance:', error);
                showAlert('Payment system configuration error.', 'error');
                disableAllSubscriptionButtons('Configuration Error');
                return false;
            }
        } else {
            debugLog('error', 'No publishable key found');
            showAlert('Payment system not configured.', 'error');
            disableAllSubscriptionButtons('Configuration Error');
            return false;
        }
    }
    
    try {
        stripe = window.stripe;
        debugLog('success', 'Stripe initialized successfully');
        
        // Check Google Pay availability
        checkGooglePayAvailability();
        
        return true;
    } catch (error) {
        debugLog('error', 'Stripe initialization failed:', error);
        showAlert('Payment initialization error.', 'error');
        disableAllSubscriptionButtons('Initialization Error');
        return false;
    }
}

// Enhanced Google Pay availability check
async function checkGooglePayAvailability() {
    try {
        debugLog('info', 'Checking Google Pay availability...');
        
        // Check basic requirements
        const isHttps = window.location.protocol === 'https:';
        const isChrome = /Chrome/.test(navigator.userAgent);
        
        debugLog('debug', 'Environment check:', {
            https: isHttps,
            chrome: isChrome,
            domain: window.location.hostname
        });
        
        if (!isHttps) {
            debugLog('warning', 'HTTPS required for Google Pay - current protocol:', window.location.protocol);
        }
        
        // Test Stripe Google Pay availability
        const canMakePayment = await stripe.canMakePayment({
            type: 'googlePay'
        });
        
        debugLog('info', 'Google Pay availability check result:', canMakePayment);
        
        if (!canMakePayment) {
            debugLog('warning', 'Google Pay not available. Possible reasons:');
            debugLog('warning', '1. Not on HTTPS');
            debugLog('warning', '2. Browser doesn\'t support Google Pay');
            debugLog('warning', '3. No valid payment methods in Google Pay');
            debugLog('warning', '4. Geographic restrictions');
        }
        
        return canMakePayment;
    } catch (error) {
        debugLog('error', 'Error checking Google Pay availability:', error);
        return false;
    }
}

// Set up event handlers
function setupEventHandlers() {
    debugLog('info', 'Setting up event handlers...');
    
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
    
    debugLog('success', 'Event handlers set up successfully');
}

// Enhanced subscribe to plan function
async function subscribeToPlan(planType) {
    debugLog('info', `Starting subscription process for: ${planType}`);
    
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('Invalid plan selected', 'error');
        return;
    }
    
    // Initialize Stripe if not already done
    if (!stripe) {
        debugLog('warning', 'Stripe not initialized, attempting to initialize...');
        const initialized = initializeStripe();
        if (!initialized) {
            debugLog('error', 'Failed to initialize Stripe');
            return;
        }
    }
    
    // Double-check stripe is available
    if (!stripe) {
        debugLog('error', 'Stripe still not available after initialization attempt');
        showAlert('Payment system not ready. Please refresh the page.', 'error');
        return;
    }
    
    selectedPlan = planType;
    retryAttempts = 0;
    
    const planDetails = {
        adfree: { name: 'Ad-Free Plan', price: '€1/month' },
        premium: { name: 'Premium Plan', price: '€5/month' }
    };
    
    debugLog('info', 'Updating modal content...');
    
    // Update modal content
    const modal = document.getElementById('payment-modal');
    const planNameEl = document.getElementById('selected-plan-name');
    const planPriceEl = document.getElementById('selected-plan-price');
    
    if (planNameEl) planNameEl.textContent = planDetails[planType].name;
    if (planPriceEl) planPriceEl.textContent = planDetails[planType].price;
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    debugLog('info', 'Modal shown, initializing payment...');
    
    // Initialize payment with delay for proper rendering
    setTimeout(() => {
        initializeStripePayment();
    }, 300);
}

// Enhanced Stripe payment initialization
async function initializeStripePayment() {
    debugLog('info', 'Initializing enhanced Stripe payment form...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found');
        showAlert('Payment form container not found.', 'error');
        return;
    }
    
    // Show enhanced loading state
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Setting up secure payment form...</p>
            <small>Checking Google Pay availability...</small>
        </div>
    `;
    
    try {
        // Create payment intent with Google Pay enablement
        debugLog('info', 'Creating payment intent with Google Pay support...');
        const response = await fetchWithRetry('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                plan: selectedPlan,
                enable_google_pay: true
            })
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
        
        debugLog('info', 'Google Pay available:', data.google_pay_available);
        debugLog('info', 'Payment method types:', data.payment_method_types);
        
        // Create Stripe elements with enhanced configuration
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance,
            locale: 'auto'
        });
        
        // Create payment element with enhanced options
        paymentElement = elements.create('payment', paymentElementOptions);
        
        // Clear container and create mount point
        paymentContainer.innerHTML = '<div id="stripe-payment-element" style="min-height: 250px;"></div>';
        
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
        setupEnhancedPaymentListeners();
        
    } catch (error) {
        debugLog('error', 'Payment initialization failed:', error);
        handlePaymentInitError(error);
    }
}

// Enhanced payment element listeners
function setupEnhancedPaymentListeners() {
    if (!paymentElement) return;
    
    paymentElement.on('ready', function() {
        debugLog('success', 'Payment element ready for user input');
        
        // Enhanced tab detection after element is ready
        setTimeout(() => {
            const tabs = document.querySelectorAll('.Tab, [data-testid*="tab"]');
            debugLog('info', `Payment methods available: ${tabs.length}`);
            
            tabs.forEach((tab, index) => {
                const testId = tab.getAttribute('data-testid');
                debugLog('debug', `Tab ${index + 1}: ${testId}`);
                
                if (testId === 'tab-googlePay') {
                    debugLog('success', '🎯 Google Pay tab detected and available!');
                    
                    // Add click listener for debugging
                    tab.addEventListener('click', function() {
                        debugLog('info', 'Google Pay tab clicked by user');
                    });
                    
                    // Apply enhanced styling
                    tab.style.cssText += `
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        background-color: #4285f4 !important;
                        color: white !important;
                        border: 1px solid #4285f4 !important;
                    `;
                }
            });
            
            if (tabs.length === 0) {
                debugLog('warning', 'No payment method tabs found - checking again in 2 seconds...');
                setTimeout(() => setupEnhancedPaymentListeners(), 2000);
            }
        }, 1500);
    });
    
    paymentElement.on('change', function(event) {
        debugLog('debug', 'Payment element change event:', event);
        
        if (event.error) {
            showMessage(event.error.message);
            debugLog('warning', 'Payment validation error:', event.error);
        } else {
            showMessage('');
            debugLog('debug', 'Payment element validation passed');
        }
        
        // Log payment method selection
        if (event.value && event.value.type) {
            debugLog('info', `Payment method selected: ${event.value.type}`);
            
            if (event.value.type === 'google_pay') {
                debugLog('success', '🎯 Google Pay selected by user!');
            }
        }
    });
    
    paymentElement.on('loaderror', function(event) {
        debugLog('error', 'Payment element load error:', event);
        showMessage('Error loading payment form. Please refresh and try again.');
    });
    
    paymentElement.on('focus', function() {
        debugLog('debug', 'Payment element focused');
    });
    
    paymentElement.on('blur', function() {
        debugLog('debug', 'Payment element blurred');
    });
}

// Enhanced form submission with Google Pay handling
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
        // Enhanced payment confirmation
        debugLog('info', 'Confirming payment with Stripe...');
        
        const {error, paymentIntent} = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
                payment_method_data: {
                    billing_details: {
                        name: 'Customer'
                    }
                }
            },
            redirect: 'if_required'
        });
        
        if (error) {
            debugLog('error', 'Payment confirmation error:', error);
            handlePaymentError(error);
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            debugLog('success', `Payment succeeded: ${paymentIntent.id}`);
            debugLog('info', `Payment method used: ${paymentIntent.payment_method?.type || 'unknown'}`);
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

// Enhanced payment error handling
function handlePaymentError(error) {
    let errorMessage = 'Payment failed. Please try again.';
    
    debugLog('error', 'Payment error details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        payment_method: error.payment_method?.type
    });
    
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

// Activate subscription after successful payment
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

// Handle payment initialization errors
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

// Close payment modal and clean up
function closePaymentModal() {
    debugLog('info', 'Closing payment modal and cleaning up...');
    
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
    
    debugLog('info', 'Payment modal closed and cleaned up successfully');
}

// Show payment message
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

// Set loading state for submit button
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

// Retry payment initialization
function retryPaymentInit() {
    debugLog('info', `Retrying payment initialization (attempt ${retryAttempts + 1})`);
    initializeStripePayment();
}

// Utility function for fetch with retry logic
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

// Show alert notification
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

// Disable all subscription buttons
function disableAllSubscriptionButtons(reason) {
    const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
    buttons.forEach(button => {
        button.disabled = true;
        button.textContent = reason || 'Unavailable';
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
    });
}

// Toggle FAQ answer visibility
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

// Subscription management functions
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
    debugLog('info', 'Processing subscription cancellation...');
    
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

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Initializing enhanced Google Pay subscription system...');
    
    // Wait for the main page to set up window.stripe
    setTimeout(() => {
        if (!initializeStripe()) {
            debugLog('error', 'Initial Stripe initialization failed');
            return;
        }
        
        setupEventHandlers();
        debugLog('success', 'Enhanced Google Pay subscription system fully initialized');
        
        // Add diagnostic helper
        window.diagnoseGooglePay = function() {
            checkGooglePayAvailability().then(available => {
                console.log('🔍 Google Pay Diagnostic:');
                console.log('HTTPS:', window.location.protocol === 'https:');
                console.log('Chrome:', /Chrome/.test(navigator.userAgent));
                console.log('Stripe initialized:', !!stripe);
                console.log('Google Pay available:', available);
            });
        };
        
    }, 500);
});

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

debugLog('success', 'Enhanced Google Pay Stripe subscription handler loaded and ready');