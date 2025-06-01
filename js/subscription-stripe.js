// subscription-stripe.js - FIXED VERSION for proper Stripe form display

let selectedPlan = null;
let elements = null;
let paymentElement = null;
let paymentIntentClientSecret = null;
let debugMode = true;

// Enhanced Stripe appearance configuration
const appearance = {
    theme: 'stripe',
    variables: {
        colorPrimary: '#8d5b4c',
        colorBackground: '#ffffff',
        colorText: '#2d2926',
        colorDanger: '#e53e3e',
        colorSuccess: '#38a169',
        fontFamily: 'Poppins, system-ui, sans-serif',
        fontSizeBase: '16px',
        borderRadius: '6px',
        spacingUnit: '4px',
        spacingGridRow: '20px',
        spacingGridColumn: '20px'
    },
    rules: {
        '.Tab': {
            border: '1px solid #e9e2d9',
            borderRadius: '6px',
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            marginBottom: '8px'
        },
        '.Tab:hover': {
            borderColor: '#d6cfc7',
            backgroundColor: '#f9f5f0'
        },
        '.Tab--selected': {
            borderColor: '#8d5b4c',
            backgroundColor: '#f5f1ea',
            boxShadow: '0 0 0 1px #8d5b4c'
        },
        '.Input': {
            border: '1px solid #e9e2d9',
            borderRadius: '6px',
            padding: '14px 16px',
            fontSize: '16px',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s ease',
            minHeight: '50px'
        },
        '.Input:focus': {
            borderColor: '#8d5b4c',
            boxShadow: '0 0 0 2px rgba(141, 91, 76, 0.1)',
            outline: 'none'
        },
        '.Label': {
            fontWeight: '500',
            fontSize: '14px',
            color: '#5a5755',
            marginBottom: '8px'
        },
        '.Error': {
            color: '#e53e3e',
            fontSize: '14px',
            marginTop: '8px'
        },
        '.Block': {
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #e9e2d9',
            padding: '20px',
            marginBottom: '16px'
        }
    }
};

// Payment element options with better layout
const paymentElementOptions = {
    layout: {
        type: 'tabs',
        defaultCollapsed: false,
        radios: false,
        spacedAccordionItems: false
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

function debugLog(level, message, data = null) {
    if (!debugMode && level === 'debug') return;
    
    const emoji = {
        'error': '❌',
        'success': '✅', 
        'info': 'ℹ️',
        'debug': '🔧',
        'warning': '⚠️'
    }[level] || 'ℹ️';
    
    console.log(`${emoji} ${message}`, data || '');
}

document.addEventListener('DOMContentLoaded', function() {
    debugLog('info', '🚀 Subscription JS Loading...');
    
    if (typeof stripe === 'undefined') {
        debugLog('error', 'Stripe not loaded!');
        showAlert('❌ Stripe not loaded. Please refresh the page.', 'error');
        return;
    }
    
    debugLog('success', 'Stripe loaded successfully');
    
    initializeFaqToggles();
    setupModalHandlers();
    
    debugLog('success', 'Subscription page initialized');
});

function initializeFaqToggles() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
}

function setupModalHandlers() {
    const modal = document.getElementById('payment-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const form = document.getElementById('payment-form');
    
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
    
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // ESC key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('payment-modal');
            if (modal && modal.style.display === 'flex') {
                closePaymentModal();
            }
        }
    });
}

async function subscribeToPlan(planType) {
    debugLog('info', `Starting subscription for: ${planType}`);
    
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('❌ Invalid plan selected', 'error');
        return;
    }
    
    selectedPlan = planType;
    
    const planDetails = {
        adfree: { name: 'Ad-Free Plan', price: '€1/month' },
        premium: { name: 'Premium Plan', price: '€5/month' }
    };
    
    // Update modal content
    document.getElementById('selected-plan-name').textContent = planDetails[planType].name;
    document.getElementById('selected-plan-price').textContent = planDetails[planType].price;
    
    // Show modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
    
    // Initialize payment after modal is visible
    setTimeout(() => {
        initializeStripePayment();
    }, 100);
}

async function initializeStripePayment() {
    debugLog('info', 'Initializing Stripe payment...');
    
    const paymentContainer = document.getElementById('payment-element');
    if (!paymentContainer) {
        debugLog('error', 'Payment container not found');
        return;
    }
    
    // Clear any existing content and show loading
    paymentContainer.innerHTML = `
        <div class="stripe-loading">
            <div class="loading-spinner"></div>
            <p>Loading secure payment form...</p>
        </div>
    `;
    
    try {
        // Create payment intent
        debugLog('info', 'Creating payment intent...');
        const response = await fetch('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: selectedPlan })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('debug', 'Payment intent response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to create payment intent');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        
        // Create Stripe elements
        debugLog('info', 'Creating Stripe elements...');
        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: appearance
        });
        
        // Create payment element
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
        
        // Set up event listeners
        paymentElement.on('ready', function() {
            debugLog('success', 'Payment element ready');
        });
        
        paymentElement.on('change', function(event) {
            const messageContainer = document.getElementById('payment-message');
            if (event.error) {
                showMessage(event.error.message);
                debugLog('warning', 'Payment element error:', event.error);
            } else {
                showMessage('');
            }
        });
        
    } catch (error) {
        debugLog('error', 'Payment initialization failed:', error);
        
        paymentContainer.innerHTML = `
            <div class="stripe-error">
                <div class="error-icon">⚠️</div>
                <h4>Payment Form Error</h4>
                <p>${error.message}</p>
                <button onclick="retryPaymentInit()" class="retry-btn">🔄 Try Again</button>
            </div>
        `;
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    debugLog('info', 'Processing payment...');
    
    if (!stripe || !elements || !paymentElement) {
        showMessage('Payment system not ready. Please try again.');
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
            
            if (error.type === 'card_error' || error.type === 'validation_error') {
                showMessage(error.message);
            } else {
                showMessage('Payment failed. Please try again.');
            }
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            debugLog('success', 'Payment succeeded:', paymentIntent.id);
            await activateSubscription(paymentIntent.id);
        } else {
            debugLog('warning', 'Unexpected payment status:', paymentIntent?.status);
            showMessage(`Payment status: ${paymentIntent?.status || 'unknown'}`);
            setLoading(false);
        }
    } catch (error) {
        debugLog('error', 'Payment processing error:', error);
        showMessage('An error occurred. Please try again.');
        setLoading(false);
    }
}

async function activateSubscription(paymentIntentId) {
    debugLog('info', 'Activating subscription...');
    
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
            debugLog('success', 'Subscription activated');
            showAlert('🎉 Subscription activated successfully!', 'success');
            closePaymentModal();
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(data.message || 'Activation failed');
        }
    } catch (error) {
        debugLog('error', 'Activation error:', error);
        showMessage('Payment succeeded but activation failed. Please contact support.');
    }
    
    setLoading(false);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    
    // Clean up Stripe elements
    if (paymentElement) {
        paymentElement.unmount();
        paymentElement = null;
    }
    if (elements) {
        elements = null;
    }
    
    selectedPlan = null;
    paymentIntentClientSecret = null;
    
    showMessage('');
    setLoading(false);
    
    debugLog('info', 'Payment modal closed');
}

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
}

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

function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `subscription-alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.classList.add('show'), 10);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

function retryPaymentInit() {
    initializeStripePayment();
}

// Global function exports
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;
window.toggleFaq = toggleFaq;
window.retryPaymentInit = retryPaymentInit;