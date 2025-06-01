// subscription-stripe.js - DEBUG VERSION

let selectedPlan = null;
let elements = null;
let paymentIntentClientSecret = null;

// Enhanced logging function
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('🚀 Subscription page initializing...');
    
    // Check if Stripe is available
    if (typeof stripe === 'undefined') {
        debugLog('❌ Stripe not loaded!');
        showMessage('Payment system not available. Please refresh the page.');
        return;
    }
    
    debugLog('✅ Stripe loaded successfully');
    
    // Initialize components
    initializeFaqToggles();
    setupModalHandlers();
    
    debugLog('✅ Subscription page ready');
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
    debugLog(`📋 Initialized ${faqQuestions.length} FAQ toggles`);
}

/**
 * Set up modal event handlers
 */
function setupModalHandlers() {
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closePaymentModal);
    });
    
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });
    }
    
    const form = document.getElementById('payment-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    debugLog('🔧 Modal handlers set up');
}

/**
 * Subscribe to a plan
 */
async function subscribeToPlan(planType) {
    debugLog('🎯 Starting subscription process', { plan: planType });
    
    selectedPlan = planType;
    
    const planDetails = {
        adfree: { name: 'Ad-Free Plan', price: '€1/month' },
        premium: { name: 'Premium Plan', price: '€5/month' }
    };
    
    const selectedPlanDetails = planDetails[planType];
    if (!selectedPlanDetails) {
        debugLog('❌ Invalid plan selected', planType);
        showMessage('Invalid plan selected');
        return;
    }
    
    // Update modal content
    document.getElementById('selected-plan-name').textContent = selectedPlanDetails.name;
    document.getElementById('selected-plan-price').textContent = selectedPlanDetails.price;
    
    // Show modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
    
    // Initialize Stripe payment
    await initializeStripePayment();
}

/**
 * Initialize Stripe Payment Element with enhanced debugging
 */
async function initializeStripePayment() {
    debugLog('🔧 Initializing Stripe payment...', { plan: selectedPlan });
    setLoading(true);
    showMessage('');
    
    try {
        debugLog('📡 Making request to create payment intent...');
        
        const requestBody = JSON.stringify({ plan: selectedPlan });
        debugLog('📡 Request body:', requestBody);
        
        const response = await fetch('../php/api/subscription/create-payment-intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody
        });
        
        debugLog('📡 Response received', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        // Check response status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Get response as text first to check what we actually received
        const responseText = await response.text();
        debugLog('📡 Raw response text (first 500 chars):', responseText.substring(0, 500));
        
        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
            throw new Error('Server returned empty response');
        }
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
            debugLog('📡 Parsed JSON response:', data);
        } catch (parseError) {
            debugLog('❌ JSON parse failed', {
                error: parseError.message,
                responseLength: responseText.length,
                responseStart: responseText.substring(0, 200),
                responseEnd: responseText.substring(-200)
            });
            
            // Check if response looks like HTML (server error page)
            if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
                throw new Error('Server returned HTML instead of JSON. Check server logs for PHP errors.');
            }
            
            throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
        }
        
        if (!data.success) {
            const errorMsg = data.message || 'Unknown server error';
            debugLog('❌ Server returned error', data);
            throw new Error(errorMsg);
        }
        
        if (!data.clientSecret) {
            debugLog('❌ Missing clientSecret in response', data);
            throw new Error('No client secret received from server');
        }
        
        paymentIntentClientSecret = data.clientSecret;
        debugLog('✅ Payment intent created successfully', {
            paymentIntentId: data.paymentIntentId,
            customerId: data.customerId
        });
        
        // Configure Stripe Elements
        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#8d5b4c',
                colorBackground: '#ffffff',
                colorText: '#2d2926',
                colorDanger: '#a15c5c',
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '8px'
            }
        };
        
        debugLog('🎨 Creating Stripe elements...');
        elements = stripe.elements({
            clientSecret: paymentIntentClientSecret,
            appearance
        });
        
        const paymentElement = elements.create('payment', {
            layout: {
                type: 'tabs',
                defaultCollapsed: false
            }
        });
        
        // Clear container and mount
        const container = document.getElementById('payment-element');
        if (!container) {
            throw new Error('Payment element container not found');
        }
        
        container.innerHTML = '';
        
        debugLog('🔗 Mounting payment element...');
        paymentElement.mount('#payment-element');
        
        // Handle events
        paymentElement.on('ready', function() {
            debugLog('✅ Payment element ready');
            setLoading(false);
            
            const submitBtn = document.getElementById('submit-payment-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        });
        
        paymentElement.on('change', function(event) {
            debugLog('💳 Payment element changed', event);
            if (event.error) {
                showMessage(event.error.message);
            } else {
                showMessage('');
            }
        });
        
    } catch (error) {
        debugLog('❌ Payment initialization error', {
            message: error.message,
            stack: error.stack
        });
        showMessage(error.message || 'Failed to initialize payment. Please try again.');
        setLoading(false);
    }
}

/**
 * Handle payment form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    debugLog('💳 Processing payment...');
    
    if (!stripe || !elements) {
        debugLog('❌ Stripe or elements not ready');
        showMessage('Payment system not ready. Please refresh and try again.');
        return;
    }
    
    setLoading(true);
    showMessage('');
    
    try {
        debugLog('🔐 Confirming payment with Stripe...');
        
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required'
        });
        
        if (error) {
            debugLog('❌ Payment error', error);
            
            if (error.type === 'card_error' || error.type === 'validation_error') {
                showMessage(error.message);
            } else {
                showMessage('Payment failed. Please try again.');
            }
            setLoading(false);
        } else if (paymentIntent) {
            debugLog('✅ Payment intent result', {
                id: paymentIntent.id,
                status: paymentIntent.status
            });
            
            if (paymentIntent.status === 'succeeded') {
                await activateSubscription(paymentIntent.id);
            } else {
                showMessage(`Payment status: ${paymentIntent.status}`);
                setLoading(false);
            }
        }
    } catch (error) {
        debugLog('❌ Payment processing error', error);
        showMessage('An error occurred during payment. Please try again.');
        setLoading(false);
    }
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(paymentIntentId) {
    debugLog('🎉 Activating subscription...', { paymentIntentId });
    
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
        debugLog('🎉 Activation response', data);
        
        if (data.success) {
            showNotification('🎉 Subscription activated successfully!', 'success');
            closePaymentModal();
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to activate subscription');
        }
    } catch (error) {
        debugLog('❌ Activation error', error);
        showMessage('Payment succeeded but activation failed. Please contact support.');
    }
    
    setLoading(false);
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    debugLog('🚪 Closing payment modal');
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
    if (!messageContainer) return;
    
    if (!messageText) {
        messageContainer.classList.add('hidden');
        messageContainer.textContent = '';
        return;
    }
    
    messageContainer.classList.remove('hidden');
    messageContainer.textContent = messageText;
    debugLog('💬 Showing message:', messageText);
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
    
    debugLog(`⏳ Loading state: ${isLoading}`);
}

/**
 * Toggle FAQ visibility
 */
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    
    questionElement.classList.toggle('active');
    answer.classList.toggle('show');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    debugLog(`📢 ${type.toUpperCase()}: ${message}`);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Global functions
window.subscribeToPlan = subscribeToPlan;
window.closePaymentModal = closePaymentModal;

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('payment-modal');
        if (modal && modal.style.display === 'flex') {
            closePaymentModal();
        }
    }
});

debugLog('🔧 Debug Subscription Stripe JS loaded');