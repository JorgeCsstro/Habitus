// js/subscription-stripe.js - COMPLETE IMPLEMENTATION with Enhanced Error Handling

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;
let stripe = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// Enhanced debug logging with better formatting
function debugLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [STRIPE-${level.toUpperCase()}]`;
    
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
    
    // Also log to a global debug array for later inspection
    if (!window.stripeDebugLog) window.stripeDebugLog = [];
    window.stripeDebugLog.push({
        timestamp,
        level,
        message,
        data
    });
    
    // Keep only last 100 entries
    if (window.stripeDebugLog.length > 100) {
        window.stripeDebugLog = window.stripeDebugLog.slice(-100);
    }
}

// Enhanced error reporting function
function reportError(error, context = 'Unknown') {
    debugLog('error', `Error in ${context}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stripe_available: typeof Stripe !== 'undefined',
        elements_available: !!elements,
        payment_element_available: !!paymentElement
    });
}

// Improved fetch function with detailed error handling
async function fetchWithRetry(url, options, retries = 2) {
    debugLog('info', `Making request to: ${url}`, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        retries: retries
    });
    
    for (let i = 0; i <= retries; i++) {
        try {
            debugLog('debug', `Fetch attempt ${i + 1}/${retries + 1}`);
            
            const response = await fetch(url, options);
            
            debugLog('debug', `Response received:`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url,
                ok: response.ok
            });
            
            if (response.ok) {
                const responseText = await response.text();
                debugLog('debug', `Response body: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
                
                try {
                    const responseData = JSON.parse(responseText);
                    return { ok: true, json: () => Promise.resolve(responseData) };
                } catch (jsonError) {
                    debugLog('error', 'Failed to parse JSON response:', {
                        error: jsonError.message,
                        responseText: responseText.substring(0, 1000)
                    });
                    throw new Error(`Invalid JSON response: ${jsonError.message}`);
                }
            } else {
                // Try to get error details from response
                let errorText = '';
                try {
                    errorText = await response.text();
                    debugLog('error', `HTTP ${response.status} Error Response:`, errorText);
                } catch (e) {
                    debugLog('error', 'Could not read error response body');
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
            }
        } catch (error) {
            debugLog('warning', `Fetch attempt ${i + 1} failed:`, {
                error: error.message,
                stack: error.stack,
                name: error.name
            });
            
            if (i === retries) {
                throw error;
            }
            
            // Exponential backoff with jitter
            const delay = 1000 * Math.pow(2, i) + Math.random() * 1000;
            debugLog('info', `Waiting ${delay.toFixed(0)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Enhanced Stripe initialization
function initializeStripe() {
    debugLog('info', 'Starting enhanced Stripe initialization...');
    
    try {
        // Check if Stripe is loaded
        if (typeof window.Stripe === 'undefined') {
            debugLog('error', 'Stripe library not loaded from CDN');
            showAlert('Payment system not available. Please refresh the page.', 'error');
            disableAllSubscriptionButtons('Payment System Error');
            return false;
        }
        
        // Get Stripe instance
        if (!window.stripe) {
            debugLog('warning', 'window.stripe not available, checking for publishable key...');
            
            // Try to extract publishable key from page
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
                debugLog('info', `Found publishable key: ${publishableKey.substring(0, 12)}...`);
                try {
                    window.stripe = Stripe(publishableKey, { 
                        locale: 'auto',
                        stripeAccount: undefined
                    });
                    debugLog('success', 'Created Stripe instance successfully');
                } catch (error) {
                    reportError(error, 'Stripe instance creation');
                    showAlert('Payment system configuration error.', 'error');
                    disableAllSubscriptionButtons('Configuration Error');
                    return false;
                }
            } else {
                debugLog('error', 'No publishable key found in page scripts');
                showAlert('Payment system not configured.', 'error');
                disableAllSubscriptionButtons('Configuration Error');
                return false;
            }
        }
        
        stripe = window.stripe;
        debugLog('success', 'Stripe initialized successfully');
        
        // Test basic Stripe functionality
        if (typeof stripe.elements !== 'function') {
            throw new Error('Stripe elements function not available');
        }
        
        return true;
    } catch (error) {
        reportError(error, 'Stripe initialization');
        showAlert('Payment initialization error.', 'error');
        disableAllSubscriptionButtons('Initialization Error');
        return false;
    }
}

// Enhanced payment initialization with better error handling
async function initializeStripePayment() {
    debugLog('info', 'Initializing enhanced Stripe payment form...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found');
        showAlert('Payment form container not found.', 'error');
        return;
    }
    
    // Show loading state
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Setting up secure payment form...</p>
            <small>Initializing payment methods...</small>
        </div>
    `;
    
    try {
        // Prepare request data
        const requestData = {
            plan: selectedPlan,
            enable_google_pay: true
        };
        
        debugLog('info', 'Creating payment intent...', requestData);
        
        // Make request with enhanced error handling
        const response = await fetchWithRetry('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        debugLog('debug', 'Payment intent response:', data);
        
        if (!data.success) {
            const errorMessage = data.message || 'Failed to create payment intent';
            const errorDetails = data.details || data.error_code || 'No additional details';
            
            debugLog('error', 'Payment intent creation failed:', {
                message: errorMessage,
                details: errorDetails,
                full_response: data
            });
            
            throw new Error(`${errorMessage} (${errorDetails})`);
        }
        
        if (!data.clientSecret) {
            throw new Error('No client secret received from server');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        
        debugLog('success', 'Payment intent created successfully:', {
            paymentIntentId: data.paymentIntentId,
            amount: data.amount,
            currency: data.currency,
            customerId: data.customerId,
            paymentMethodTypes: data.payment_method_types,
            googlePayAvailable: data.google_pay_available
        });
        
        // Create Stripe elements with enhanced appearance
        debugLog('info', 'Creating Stripe elements...');
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: {
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
                    }
                }
            },
            locale: 'auto'
        });
        
        // Create payment element with optimized options
        debugLog('info', 'Creating payment element...');
        paymentElement = elements.create('payment', {
            layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: true
            },
            wallets: {
                googlePay: 'auto',
                applePay: 'auto',
                link: 'auto'
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
            business: {
                name: 'Habitus Zone'
            },
            paymentMethodCreation: 'manual'
        });
        
        // Clear container and mount element
        paymentContainer.innerHTML = '<div id="stripe-payment-element" style="min-height: 250px;"></div>';
        
        debugLog('info', 'Mounting payment element...');
        await paymentElement.mount('#stripe-payment-element');
        
        debugLog('success', 'Payment element mounted successfully');
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Set up event listeners
        setupPaymentListeners();
        
    } catch (error) {
        reportError(error, 'Payment initialization');
        handlePaymentInitError(error);
    }
}

// Enhanced payment listeners
function setupPaymentListeners() {
    if (!paymentElement) {
        debugLog('warning', 'Payment element not available for listener setup');
        return;
    }
    
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
                }
            });
            
            if (tabs.length === 0) {
                debugLog('warning', 'No payment method tabs found - checking again in 2 seconds...');
                setTimeout(() => setupPaymentListeners(), 2000);
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
        }
        
        if (event.value && event.value.type) {
            debugLog('info', `Payment method selected: ${event.value.type}`);
            
            if (event.value.type === 'google_pay') {
                debugLog('success', '🎯 Google Pay selected by user!');
            }
        }
    });
    
    paymentElement.on('loaderror', function(event) {
        debugLog('error', 'Payment element load error:', event);
        reportError(new Error('Payment element failed to load'), 'Payment element loading');
        showMessage('Error loading payment form. Please refresh and try again.');
    });
    
    paymentElement.on('focus', function() {
        debugLog('debug', 'Payment element focused');
    });
    
    paymentElement.on('blur', function() {
        debugLog('debug', 'Payment element blurred');
    });
}

// Enhanced form submission
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
            reportError(error, 'Payment confirmation');
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
        reportError(error, 'Payment processing');
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

// Handle payment initialization errors with better UX
function handlePaymentInitError(error) {
    retryAttempts++;
    
    const paymentContainer = document.getElementById('payment-element');
    const errorMessage = error.message || 'Unknown error occurred';
    
    debugLog('error', `Payment init error (attempt ${retryAttempts}):`, {
        error: errorMessage,
        stack: error.stack,
        canRetry: retryAttempts < maxRetryAttempts
    });
    
    paymentContainer.innerHTML = `
        <div class="stripe-error">
            <div class="error-icon">⚠️</div>
            <h4>Payment Form Error</h4>
            <p><strong>Error:</strong> ${errorMessage}</p>
            
            ${retryAttempts < maxRetryAttempts ? `
                <div style="margin: 20px 0;">
                    <button onclick="retryPaymentInit()" class="retry-btn">🔄 Try Again</button>
                    <button onclick="closePaymentModal()" class="retry-btn" style="margin-left: 10px;">Cancel</button>
                </div>
                <small style="color: #666;">Attempt ${retryAttempts} of ${maxRetryAttempts}</small>
            ` : `
                <div style="margin: 20px 0;">
                    <button onclick="closePaymentModal()" class="retry-btn">Close</button>
                    <button onclick="showDebugInfo()" class="retry-btn" style="margin-left: 10px;">Show Debug Info</button>
                </div>
                <small style="color: #666;">Maximum retry attempts reached. Please contact support if the problem persists.</small>
            `}
        </div>
    `;
}

// Debug info display function
function showDebugInfo() {
    const debugInfo = {
        stripe_available: typeof Stripe !== 'undefined',
        window_stripe: !!window.stripe,
        selected_plan: selectedPlan,
        retry_attempts: retryAttempts,
        current_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        recent_logs: window.stripeDebugLog ? window.stripeDebugLog.slice(-10) : []
    };
    
    const debugWindow = window.open('', '_blank', 'width=800,height=600');
    debugWindow.document.write(`
        <html>
        <head><title>Stripe Debug Information</title></head>
        <body>
        <h1>Stripe Debug Information</h1>
        <pre style="font-family: monospace; white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${JSON.stringify(debugInfo, null, 2)}
        </pre>
        <p style="margin-top: 20px; color: #666;">
        Please copy this information and provide it to support for assistance.
        </p>
        </body>
        </html>
    `);
}

// Subscribe to plan function with enhanced validation
async function subscribeToPlan(planType) {
    debugLog('info', `Starting subscription process for: ${planType}`);
    
    // Validation
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('Invalid plan selected', 'error');
        return;
    }
    
    // Initialize Stripe if needed
    if (!stripe) {
        debugLog('warning', 'Stripe not initialized, attempting to initialize...');
        const initialized = initializeStripe();
        if (!initialized) {
            debugLog('error', 'Failed to initialize Stripe');
            return;
        }
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
    
    // Initialize payment with delay
    setTimeout(() => {
        initializeStripePayment();
    }, 300);
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

// Retry payment initialization
function retryPaymentInit() {
    debugLog('info', `Retrying payment initialization (attempt ${retryAttempts + 1})`);
    initializeStripePayment();
}

// Show alert notification
function showAlert(message, type = 'info') {
    debugLog('info', `Alert: ${message} (${type})`);
    
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

// Export enhanced debug function
window.stripeDebug = {
    showLogs: () => console.log('Stripe Debug Logs:', window.stripeDebugLog || []),
    clearLogs: () => window.stripeDebugLog = [],
    showInfo: showDebugInfo,
    testConnection: async () => {
        try {
            const response = await fetch('../test-payment-intent.php');
            console.log('Test connection result:', await response.text());
        } catch (error) {
            console.error('Test connection failed:', error);
        }
    }
};

// Export functions for onclick handlers
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;
window.retryPaymentInit = retryPaymentInit;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;
window.showDebugInfo = showDebugInfo;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', 'Initializing enhanced Stripe subscription system...');
    
    // Wait for the main page to set up window.stripe
    setTimeout(() => {
        if (!initializeStripe()) {
            debugLog('error', 'Initial Stripe initialization failed');
            return;
        }
        
        setupEventHandlers();
        debugLog('success', 'Enhanced Stripe subscription system fully initialized');
        
        // Add diagnostic helper
        window.diagnoseStripe = function() {
            console.log('🔍 Stripe Diagnostic:');
            console.log('HTTPS:', window.location.protocol === 'https:');
            console.log('Stripe Library:', typeof Stripe !== 'undefined');
            console.log('Stripe Instance:', !!window.stripe);
            console.log('Elements:', !!elements);
            console.log('Payment Element:', !!paymentElement);
            console.log('Selected Plan:', selectedPlan);
            console.log('Recent Logs:', window.stripeDebugLog ? window.stripeDebugLog.slice(-5) : []);
        };
        
        console.log('💡 Run window.diagnoseStripe() to see diagnostic info');
        console.log('💡 Run window.stripeDebug.showLogs() to see all logs');
        
    }, 500);
});

// Error boundary for uncaught errors
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.toLowerCase().includes('stripe')) {
        reportError(event.error, 'Global error handler');
        showAlert('Payment system error detected. Please refresh the page.', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.toString().toLowerCase().includes('stripe')) {
        reportError(new Error(event.reason), 'Unhandled promise rejection');
        showAlert('Payment processing error detected. Please try again.', 'error');
    }
});

debugLog('success', 'Complete Stripe subscription handler loaded and ready');