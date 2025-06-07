// js/subscription-checkout.js - Complete Stripe Elements implementation - FIXED

class StripePaymentModal {
    constructor() {
        this.modal = document.getElementById('stripe-payment-modal');
        this.form = document.getElementById('stripe-payment-form');
        this.submitBtn = document.getElementById('stripe-submit-btn');
        this.errorDiv = document.getElementById('payment-errors');
        this.successDiv = document.getElementById('payment-success');
        
        // Debug mode support
        this.debugMode = window.debugMode || false;
        
        // Stripe configuration
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.clientSecret = null;
        this.currentPlan = null;
        
        // Ensure modal is hidden on initialization
        this.ensureModalHidden();
        
        this.initializeStripe();
        this.bindEvents();
    }

    ensureModalHidden() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
        }
    }

    async initializeStripe() {
        try {
            if (!window.stripeConfig?.publishableKey) {
                throw new Error('Stripe configuration not found');
            }
            
            this.stripe = Stripe(window.stripeConfig.publishableKey);
            this.log('Stripe initialized successfully');
        } catch (error) {
            this.handleError('Failed to initialize Stripe', error);
        }
    }

    bindEvents() {
        // Bind to subscription buttons
        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.log('Subscribe button clicked:', btn.dataset.planId);
                
                if (this.debugMode) {
                    this.handleDebugSubscription(btn);
                } else {
                    this.openModal(btn);
                }
            });
        });

        // Bind close modal events
        if (this.modal) {
            // Close button
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal();
                });
            }

            // Overlay click
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal();
                });
            }

            // Cancel button
            const cancelBtn = this.modal.querySelector('.btn-secondary');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal();
                });
            }
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePayment();
            });
        }

        // ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    async openModal(button) {
        try {
            this.log('Opening modal for button:', button);
            
            // Extract plan data from button
            this.currentPlan = {
                id: button.dataset.planId,
                name: button.dataset.planName,
                price: button.dataset.planPrice,
                priceId: button.dataset.priceId
            };

            this.log('Opening payment modal for plan:', this.currentPlan);

            if (!this.currentPlan.priceId) {
                throw new Error('Price ID not found on button');
            }

            // Update modal content
            const planNameEl = document.getElementById('selected-plan-name');
            const planPriceEl = document.getElementById('selected-plan-price');
            
            if (planNameEl) planNameEl.textContent = this.currentPlan.name;
            if (planPriceEl) planPriceEl.textContent = this.currentPlan.price;

            // Show modal first
            this.showModal();

            // Create checkout session
            const session = await this.createCheckoutSession();
            this.clientSecret = session.client_secret;

            // Initialize Stripe Elements
            await this.initializeElements();

            this.log('Payment modal opened successfully');
        } catch (error) {
            this.handleError('Failed to open payment modal', error);
            this.closeModal();
        }
    }

    showModal() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('show');
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    async createCheckoutSession() {
        this.log('Creating checkout session for:', this.currentPlan);
        
        const response = await fetch('../php/api/subscription/create-checkout-session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                price_id: this.currentPlan.priceId,
                plan_id: this.currentPlan.id,
                customer_data: {
                    email: window.currentUser?.email || '',
                    name: window.currentUser?.username || ''
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create checkout session');
        }

        const data = await response.json();
        this.log('Checkout session created:', data);
        return data;
    }

    async initializeElements() {
        if (!this.stripe || !this.clientSecret) {
            throw new Error('Stripe not properly initialized');
        }

        this.log('Initializing Stripe Elements with client secret');

        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#3b82f6',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#dc2626',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px'
            }
        };

        this.elements = this.stripe.elements({
            clientSecret: this.clientSecret,
            appearance: appearance
        });

        this.paymentElement = this.elements.create('payment', {
            layout: {
                type: 'tabs',
                defaultCollapsed: false
            }
        });

        // Clear any existing content
        const paymentElementContainer = document.getElementById('stripe-payment-element');
        if (paymentElementContainer) {
            paymentElementContainer.innerHTML = '';
            this.paymentElement.mount('#stripe-payment-element');
        } else {
            throw new Error('Payment element container not found');
        }

        // Handle real-time validation
        this.paymentElement.on('change', (event) => {
            if (event.error) {
                this.showError(event.error.message);
            } else {
                this.clearError();
            }
        });

        this.log('Stripe Elements initialized and mounted');
    }

    async handlePayment() {
        if (!this.stripe || !this.elements) {
            this.handleError('Payment system not initialized');
            return;
        }

        this.setLoading(true);
        this.clearError();

        try {
            this.log('Submitting payment...');
            
            // Submit the form to trigger validation
            const { error: submitError } = await this.elements.submit();
            if (submitError) {
                throw submitError;
            }

            // Confirm the payment
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/pages/subscription.php?success=true`,
                    receipt_email: window.currentUser?.email || ''
                },
                redirect: 'if_required'
            });

            if (error) {
                throw error;
            }

            // Payment succeeded
            this.log('Payment confirmed:', paymentIntent);
            await this.handlePaymentSuccess(paymentIntent);

        } catch (error) {
            this.handleError('Payment failed', error);
        } finally {
            this.setLoading(false);
        }
    }

    async handlePaymentSuccess(paymentIntent) {
        this.log('Payment successful:', paymentIntent.id);

        // Show success message
        this.showSuccess('Payment successful! Setting up your subscription...');

        // Wait a moment for webhook processing
        setTimeout(async () => {
            try {
                // Verify subscription status
                const subscription = await this.verifySubscription(paymentIntent.id);

                if (subscription && subscription.status === 'active') {
                    this.showSuccess('Subscription activated successfully!');
                } else {
                    this.showSuccess('Payment completed! Your subscription will be activated shortly.');
                }

                // Close modal after delay and reload page
                setTimeout(() => {
                    this.closeModal();
                    window.location.href = 'subscription.php?success=true';
                }, 2000);

            } catch (error) {
                this.log('Could not verify subscription:', error);
                this.showSuccess('Payment completed! Your subscription will be activated shortly.');
                
                setTimeout(() => {
                    this.closeModal();
                    window.location.href = 'subscription.php?success=true';
                }, 3000);
            }
        }, 1000);
    }

    async verifySubscription(paymentIntentId) {
        try {
            const response = await fetch(`../php/api/subscription/verify-subscription.php?payment_intent=${paymentIntentId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            this.log('Could not verify subscription status:', error);
        }
        return null;
    }

    closeModal() {
        this.log('Closing modal');
        
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Clean up Stripe Elements
        if (this.paymentElement) {
            this.paymentElement.unmount();
            this.paymentElement = null;
        }
        if (this.elements) {
            this.elements = null;
        }
        
        this.clientSecret = null;
        this.currentPlan = null;
        
        // Clear any messages
        this.clearError();
        if (this.successDiv) {
            this.successDiv.classList.add('hidden');
        }
        
        this.log('Payment modal closed and cleaned up');
    }

    setLoading(loading) {
        if (!this.submitBtn) return;
        
        const btnText = this.submitBtn.querySelector('.btn-text');
        const spinner = this.submitBtn.querySelector('.spinner');
        
        if (loading) {
            if (btnText) btnText.textContent = 'Processing...';
            if (spinner) spinner.classList.add('show');
            this.submitBtn.disabled = true;
            this.submitBtn.setAttribute('aria-busy', 'true');
        } else {
            if (btnText) btnText.textContent = 'Subscribe Now';
            if (spinner) spinner.classList.remove('show');
            this.submitBtn.disabled = false;
            this.submitBtn.removeAttribute('aria-busy');
        }
    }

    showError(message) {
        if (this.errorDiv) {
            this.errorDiv.textContent = message;
            this.errorDiv.classList.add('show');
        }
        this.log('Error:', message);
    }

    clearError() {
        if (this.errorDiv) {
            this.errorDiv.textContent = '';
            this.errorDiv.classList.remove('show');
        }
    }

    showSuccess(message) {
        if (this.successDiv) {
            this.successDiv.textContent = message;
            this.successDiv.classList.remove('hidden');
        }
    }

    handleError(context, error = null) {
        this.log(`${context}:`, error);
        
        let message = 'An unexpected error occurred. Please try again.';
        
        if (error) {
            switch (error.type) {
                case 'card_error':
                case 'validation_error':
                    message = error.message;
                    break;
                case 'api_connection_error':
                    message = 'Network error. Please check your connection and try again.';
                    break;
                case 'rate_limit_error':
                    message = 'Too many requests. Please wait a moment and try again.';
                    break;
                default:
                    if (error.code) {
                        switch (error.code) {
                            case 'card_declined':
                                message = 'Your card was declined. Please try a different payment method.';
                                break;
                            case 'expired_card':
                                message = 'Your card has expired. Please use a different card.';
                                break;
                            case 'insufficient_funds':
                                message = 'Insufficient funds. Please try a different payment method.';
                                break;
                            case 'incorrect_cvc':
                                message = 'Your card security code is incorrect.';
                                break;
                            default:
                                message = error.message || message;
                        }
                    }
            }
        }
        
        this.showError(message);
    }

    // Debug mode support - maintain existing functionality
    async handleDebugSubscription(button) {
        this.log('Debug mode: simulating subscription');
        
        const planId = button.dataset.planId;
        
        try {
            const response = await fetch('../php/api/subscription/create-checkout-session.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    plan: planId,
                    debug_mode: true 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.demo_mode) {
                    showAlert('Demo subscription activated! 🎉', 'success');
                    setTimeout(() => {
                        window.location.href = data.checkout_url;
                    }, 1500);
                } else {
                    showAlert('Subscription activated successfully!', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } else {
                throw new Error(data.message || 'Failed to create subscription');
            }
            
        } catch (error) {
            this.log('Debug subscription error:', error);
            showAlert('Debug subscription failed: ' + error.message, 'error');
        }
    }

    log(...args) {
        if (this.debugMode || window.location.hostname === 'localhost') {
            console.log('[StripePaymentModal]', ...args);
        }
    }
}

// Legacy functions for backwards compatibility
async function subscribeToPlan(planType) {
    console.log(`Legacy function called: subscribeToPlan(${planType})`);
    
    if (window.debugMode) {
        try {
            const response = await fetch('../php/api/subscription/create-checkout-session.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planType
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.demo_mode) {
                showAlert('Demo mode: Subscription activated! 🎉', 'success');
                setTimeout(() => {
                    window.location.href = data.checkout_url;
                }, 1500);
            } else if (data.success) {
                window.location.href = data.checkout_url;
            } else {
                throw new Error(data.message || 'Failed to create checkout session');
            }
            
        } catch (error) {
            console.error('Subscription error:', error);
            showAlert(error.message || 'An error occurred. Please try again.', 'error');
        }
    } else {
        // Find the corresponding button and trigger modal
        const button = document.querySelector(`[data-plan-id="${planType}"]`);
        if (button && window.stripePaymentModal) {
            window.stripePaymentModal.openModal(button);
        }
    }
}

async function manageSubscription() {
    console.log('Opening customer portal...');
    
    const manageBtn = document.querySelector('.manage-subscription-btn');
    if (manageBtn) {
        manageBtn.disabled = true;
        manageBtn.innerHTML = '<span class="spinner"></span> Loading...';
    }
    
    try {
        const response = await fetch('../php/api/subscription/create-portal-session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.message || 'Unable to open subscription management');
        }
        
    } catch (error) {
        console.error('Portal error:', error);
        showAlert('Unable to open subscription management. Please try again.', 'error');
        
        if (manageBtn) {
            manageBtn.disabled = false;
            manageBtn.textContent = 'Manage Subscription';
        }
    }
}

async function downgradeToFree() {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
        return;
    }
    
    try {
        const response = await fetch('../php/api/subscription/cancel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Subscription cancelled. You will retain access until ' + data.expires_date, 'info');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            throw new Error(data.message || 'Error cancelling subscription');
        }
        
    } catch (error) {
        console.error('Cancel error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    }
}

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
    
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        info: '#4299e1',
        warning: '#ed8936'
    };
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        setTimeout(() => alertDiv.remove(), 400);
    }, 5000);
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
        if (urlParams.get('demo') === 'true') {
            showAlert('🎉 Demo subscription activated! This is a demo - no payment was processed.', 'success');
        } else {
            showAlert('🎉 Subscription activated successfully! Welcome to premium features!', 'success');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
        showAlert('Subscription process was cancelled.', 'warning');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('portal') === 'success') {
        showAlert('Subscription settings updated successfully.', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Global functions for modal control
function closePaymentModal() {
    if (window.stripePaymentModal) {
        window.stripePaymentModal.closeModal();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the modal system
    window.stripePaymentModal = new StripePaymentModal();
    
    // Check for success/cancel parameters
    checkUrlParams();
    
    console.log('StripePaymentModal initialized successfully');
});

// Export functions for global access
window.subscribeToPlan = subscribeToPlan;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;
window.toggleFaq = toggleFaq;
window.closePaymentModal = closePaymentModal;