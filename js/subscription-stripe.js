// debug-subscription.js - Enhanced debugging version
// Replace the content of js/subscription-stripe.js with this

let selectedPlan = null;
let elements = null;
let paymentIntentClientSecret = null;
let debugMode = true; // Set to false to reduce console output

const appearance = {
    theme: 'stripe',
    variables: {
        colorPrimary: '#8d5b4c',
        colorBackground: '#ffffff',
        colorText: '#2d2926',
        colorDanger: '#e53e3e',
        colorSuccess: '#38a169',
        colorWarning: '#d69e2e',
        fontFamily: 'Poppins, system-ui, sans-serif',
        fontSizeBase: '16px',
        fontSizeSm: '14px',
        fontWeightNormal: '400',
        fontWeightMedium: '500',
        fontWeightBold: '600',
        borderRadius: '8px',
        spacingUnit: '4px',
        gridRowSpacing: '16px',
        gridColumnSpacing: '16px'
    },
    rules: {
        '.Tab': {
            border: '1px solid #e9e2d9',
            borderRadius: '8px',
            boxShadow: 'none',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            transition: 'all 0.3s ease'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0'
        },
        '.Tab--selected': {
            borderColor: '#8d5b4c',
            backgroundColor: '#f5f1ea',
            transform: 'none',
            boxShadow: '0 0 0 1px #8d5b4c'
        },
        '.TabIcon': {
            color: '#8d5b4c'
        },
        '.TabIcon--selected': {
            color: '#8d5b4c'
        },
        '.TabLabel': {
            fontWeight: '500',
            color: '#5a5755'
        },
        '.TabLabel--selected': {
            color: '#8d5b4c'
        },
        '.Input': {
            border: '1px solid #e9e2d9',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '16px',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.3s ease'
        },
        '.Input:focus': {
            borderColor: '#8d5b4c',
            boxShadow: '0 0 0 2px rgba(141, 91, 76, 0.1)',
            outline: 'none'
        },
        '.Input--invalid': {
            borderColor: '#e53e3e'
        },
        '.Input::placeholder': {
            color: '#a0aec0'
        },
        '.Label': {
            fontWeight: '500',
            fontSize: '14px',
            color: '#5a5755',
            marginBottom: '6px'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '14px',
            marginTop: '6px'
        },
        '.Block': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e9e2d9',
            padding: '16px'
        },
        '.CodeInput': {
            borderColor: '#e9e2d9',
            fontSize: '16px'
        },
        '.CodeInput:focus': {
            borderColor: '#8d5b4c',
            boxShadow: '0 0 0 2px rgba(141, 91, 76, 0.1)'
        }
    }
};

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
            phone: 'auto',
            address: {
                country: 'auto',
                line1: 'auto',
                line2: 'auto',
                city: 'auto',
                state: 'auto',
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

// Enhanced logging function
function debugLog(level, message, data = null) {
    if (!debugMode && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const emoji = {
        'error': '❌',
        'success': '✅', 
        'info': 'ℹ️',
        'debug': '🔧',
        'warning': '⚠️'
    }[level] || 'ℹ️';
    
    console.log(`[${timestamp}] ${emoji} ${message}`, data || '');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', '🚀 Debug Subscription JS Loading...');
    
    // Check if Stripe is loaded
    if (typeof stripe === 'undefined') {
        debugLog('error', 'Stripe not loaded! Check if Stripe script is included.');
        showAlert('❌ Stripe not loaded. Please refresh the page.', 'error');
        return;
    }
    
    debugLog('success', 'Stripe loaded successfully');
    debugLog('debug', 'Stripe object details', {
        version: stripe._VERSION,
        key: stripe._keyMode
    });
    
    // Initialize components
    initializeFaqToggles();
    setupModalHandlers();
    
    debugLog('success', 'Subscription page initialized successfully');
});

/**
 * Initialize FAQ toggle functionality
 */
function initializeFaqToggles() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
    debugLog('debug', `Initialized ${faqQuestions.length} FAQ toggles`);
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
    
    debugLog('debug', 'Modal handlers set up');
}

/**
 * Subscribe to a plan with extensive debugging
 */
async function subscribeToPlan(planType) {
    debugLog('info', `Starting subscription process for plan: ${planType}`);
    
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        debugLog('error', 'Invalid plan type', planType);
        showAlert('❌ Invalid plan selected', 'error');
        return;
    }
    
    selectedPlan = planType;
    
    const planDetails = {
        adfree: { name: 'Ad-Free Plan', price: '€1/month' },
        premium: { name: 'Premium Plan', price: '€5/month' }
    };
    
    // Update modal content
    const planNameEl = document.getElementById('selected-plan-name');
    const planPriceEl = document.getElementById('selected-plan-price');
    
    if (planNameEl && planPriceEl) {
        planNameEl.textContent = planDetails[planType].name;
        planPriceEl.textContent = planDetails[planType].price;
        debugLog('debug', 'Modal content updated');
    } else {
        debugLog('error', 'Modal elements not found');
    }
    
    // Show modal
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'flex';
        debugLog('debug', 'Modal displayed');
    } else {
        debugLog('error', 'Modal element not found');
        return;
    }
    
    // Initialize Stripe payment
    await initializeStripePayment();
}

/**
 * Initialize Stripe Payment Element with comprehensive debugging
 */
async function initializeStripePayment() {
    console.log('🔧 Initializing Stripe payment with enhanced styling...');
    
    const paymentElement = document.getElementById('payment-element');
    if (!paymentElement) {
        console.error('Payment element container not found');
        return;
    }
    
    // Show enhanced loading state
    paymentElement.innerHTML = `
        <div class="payment-loading">
            <div></div>
            <p>Loading secure payment form...</p>
        </div>
    `;
    
    try {
        // Your existing API call code here...
        const response = await fetch('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: selectedPlan })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Server error');
        }
        
        // Create elements with enhanced styling
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance
        });
        
        const paymentElementStripe = elements.create('payment', paymentElementOptions);
        
        // Clear container and mount
        paymentElement.innerHTML = '';
        
        // Mount with error handling
        try {
            await paymentElementStripe.mount('#payment-element');
            console.log('✅ Payment element mounted with enhanced styling');
        } catch (mountError) {
            console.error('Mount error:', mountError);
            paymentElement.innerHTML = `
                <div>
                    <p>Failed to load payment form. Please refresh the page and try again.</p>
                    <button onclick="initializeStripePayment()">
                        Retry
                    </button>
                </div>
            `;
            return;
        }
        
        // Event handlers
        paymentElementStripe.on('ready', function() {
            console.log('✅ Payment element ready');
            document.getElementById('submit-payment-btn').disabled = false;
        });
        
        paymentElementStripe.on('change', function(event) {
            if (event.error) {
                showMessage(event.error.message);
            } else {
                showMessage('');
            }
        });
        
    } catch (error) {
        console.error('❌ Payment initialization error:', error);
        paymentElement.innerHTML = `
            <div>
                <h4>Payment Form Error</h4>
                <p>${error.message}</p>
                <button onclick="initializeStripePayment()">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

/**
 * Handle payment form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    debugLog('info', 'Processing payment submission...');
    
    if (!stripe || !elements) {
        debugLog('error', 'Stripe or elements not ready');
        showMessage('Payment system not ready. Please refresh and try again.');
        return;
    }
    
    setLoading(true);
    showMessage('');
    
    try {
        debugLog('info', 'Confirming payment with Stripe...');
        
        const confirmResult = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required'
        });
        
        debugLog('debug', 'Payment confirmation result', confirmResult);
        
        if (confirmResult.error) {
            debugLog('error', 'Payment confirmation error', confirmResult.error);
            
            if (confirmResult.error.type === 'card_error' || confirmResult.error.type === 'validation_error') {
                showMessage(confirmResult.error.message);
            } else {
                showMessage('Payment failed. Please try again.');
            }
            setLoading(false);
        } else if (confirmResult.paymentIntent) {
            debugLog('success', 'Payment confirmed', {
                id: confirmResult.paymentIntent.id,
                status: confirmResult.paymentIntent.status
            });
            
            if (confirmResult.paymentIntent.status === 'succeeded') {
                await activateSubscription(confirmResult.paymentIntent.id);
            } else {
                showMessage(`Payment status: ${confirmResult.paymentIntent.status}`);
                setLoading(false);
            }
        }
    } catch (error) {
        debugLog('error', 'Payment processing error', error);
        showMessage('An error occurred during payment. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(paymentIntentId) {
    debugLog('info', 'Activating subscription...', { paymentIntentId });
    
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
        debugLog('debug', 'Activation response', data);
        
        if (data.success) {
            debugLog('success', 'Subscription activated successfully');
            showAlert('🎉 Subscription activated successfully!', 'success');
            closePaymentModal();
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to activate subscription');
        }
    } catch (error) {
        debugLog('error', 'Activation error', error);
        showMessage('Payment succeeded but activation failed. Please contact support.');
    }
    
    setLoading(false);
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    debugLog('info', 'Closing payment modal');
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    
    if (elements) {
        elements = null;
    }
    paymentIntentClientSecret = null;
    selectedPlan = null;
    
    showMessage('');
    setLoading(false);
}

/**
 * Show message in payment form
 */
function showMessage(messageText) {
    const messageContainer = document.getElementById('payment-message');
    if (!messageContainer) {
        debugLog('warning', 'Message container not found');
        return;
    }
    
    if (!messageText) {
        messageContainer.classList.add('hidden');
        messageContainer.textContent = '';
        return;
    }
    
    messageContainer.classList.remove('hidden');
    messageContainer.textContent = messageText;
    debugLog('info', 'Showing message', messageText);
}

/**
 * Set loading state
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
    
    debugLog('debug', `Loading state changed to: ${isLoading}`);
}

/**
 * Toggle FAQ visibility
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
    
    debugLog('debug', 'FAQ toggled');
}

/**
 * Show alert notification
 */
function showAlert(message, type = 'info') {
    debugLog('info', `Showing ${type} alert: ${message}`);
    
    const alertDiv = document.createElement('div');
    alertDiv.textContent = message;
    
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
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Export functions globally
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('payment-modal');
        if (modal && modal.style.display === 'flex') {
            closePaymentModal();
        }
    }
});

debugLog('success', 'Debug Subscription JavaScript loaded and ready');