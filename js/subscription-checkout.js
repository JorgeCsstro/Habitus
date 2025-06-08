// js/subscription-checkout.js - Complete working Stripe Elements implementation with fixes

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
        this.isProcessing = false;
        this.stripeInitialized = false; // Add initialization flag
        
        // Ensure modal is hidden on initialization
        this.ensureModalHidden();
        
        this.bindEvents();
        this.initializeStripe(); // This will set stripeInitialized when done
    }

    ensureModalHidden() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
            this.modal.style.visibility = 'hidden';
            this.modal.style.opacity = '0';
        }
    }

    async initializeStripe() {
        try {
            // Add detailed debugging
            this.log('Initializing Stripe...');
            this.log('Window stripeConfig:', window.stripeConfig);
            
            if (!window.stripeConfig) {
                throw new Error('Stripe configuration object not found');
            }
            
            if (!window.stripeConfig.publishableKey) {
                throw new Error('Stripe publishable key not found in configuration');
            }
            
            if (!window.stripeConfig.publishableKey.startsWith('pk_')) {
                throw new Error('Invalid Stripe publishable key format');
            }
            
            this.stripe = Stripe(window.stripeConfig.publishableKey);
            this.stripeInitialized = true;
            this.log('Stripe initialized successfully with key:', window.stripeConfig.publishableKey.substring(0, 12) + '...');
        } catch (error) {
            this.log('Stripe initialization failed:', error);
            this.stripeInitialized = false;
            this.handleError('Failed to initialize Stripe', error);
        }
    }

    bindEvents() {
        // Bind to subscription buttons with proper event handling
        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            // Remove any existing listeners
            btn.removeEventListener('click', this.handleSubscribeClick);
            
            // Add new listener with proper binding
            btn.addEventListener('click', this.handleSubscribeClick.bind(this));
        });

        // Only bind modal events if modal exists
        if (this.modal) {
            // Close button
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.removeEventListener('click', this.handleCloseClick);
                closeBtn.addEventListener('click', this.handleCloseClick.bind(this));
            }

            // Overlay click - but prevent immediate closure
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.removeEventListener('click', this.handleOverlayClick);
                overlay.addEventListener('click', this.handleOverlayClick.bind(this));
            }

            // Cancel button
            const cancelBtn = this.modal.querySelector('.btn-secondary');
            if (cancelBtn) {
                cancelBtn.removeEventListener('click', this.handleCancelClick);
                cancelBtn.addEventListener('click', this.handleCancelClick.bind(this));
            }
        }

        // Form submission
        if (this.form) {
            this.form.removeEventListener('submit', this.handleFormSubmit);
            this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // ESC key support
        document.removeEventListener('keydown', this.handleKeydown);
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleSubscribeClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isProcessing) {
            this.log('Already processing, ignoring click');
            return;
        }

        this.log('Subscribe button clicked:', e.currentTarget.dataset.planId);
        
        if (this.debugMode) {
            this.handleDebugSubscription(e.currentTarget);
        } else {
            this.openModal(e.currentTarget);
        }
    }

    handleCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
    }

    handleOverlayClick(e) {
        // Only close if clicking directly on overlay, not on modal content
        if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal();
        }
    }

    handleCancelClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
    }

    handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        this.handlePayment();
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
            e.preventDefault();
            this.closeModal();
        }
    }

    async openModal(button) {
        try {
            if (this.isProcessing) {
                this.log('Already processing, skipping modal open');
                return;
            }

            // Wait for Stripe to be initialized
            if (!this.stripeInitialized) {
                this.log('Waiting for Stripe initialization...');
                // Wait up to 5 seconds for Stripe to initialize
                let attempts = 0;
                while (!this.stripeInitialized && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!this.stripeInitialized) {
                    throw new Error('Stripe failed to initialize after 5 seconds');
                }
            }

            this.isProcessing = true;
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

            // Clear any previous errors
            this.clearError();

            // Show modal FIRST
            this.showModal();

            // Create subscription with Payment Intent
            this.log('Creating subscription...');
            const subscription = await this.createSubscription();
            
            if (!subscription.client_secret) {
                throw new Error('No client_secret received from server');
            }
            
            this.clientSecret = subscription.client_secret;

            // Initialize Stripe Elements
            this.log('Initializing Stripe Elements...');
            await this.initializeElements();

            this.log('Payment modal opened successfully');
            
        } catch (error) {
            this.handleError('Failed to open payment modal', error);
            this.closeModal();
        } finally {
            this.isProcessing = false;
        }
    }

    showModal() {
        if (this.modal) {
            // Use timeout to ensure DOM is ready
            setTimeout(() => {
                this.modal.classList.remove('hidden');
                this.modal.style.display = 'flex';
                this.modal.style.visibility = 'visible';
                this.modal.style.opacity = '1';
                
                // Add show class after display is set
                requestAnimationFrame(() => {
                    this.modal.classList.add('show');
                });
                
                document.body.style.overflow = 'hidden';
                this.log('Modal shown');
            }, 10);
        }
    }

    async createSubscription() {
        this.log('Creating subscription for:', this.currentPlan);
        
        try {
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
                const errorText = await response.text();
                this.log('Response not OK:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            this.log('Subscription response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Unknown error from server');
            }
            
            if (!data.client_secret) {
                throw new Error('No client_secret received from server');
            }
            
            return data;
        } catch (error) {
            this.log('Create subscription error:', error);
            throw error;
        }
    }

    async initializeElements() {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }
        
        if (!this.clientSecret) {
            throw new Error('Client secret not available');
        }

        this.log('Initializing Stripe Elements with client secret:', this.clientSecret.substring(0, 20) + '...');

        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#8d5b4c',
                colorBackground: '#ffffff',
                colorText: '#2d2926',
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

        // Clear any existing content and mount
        const paymentElementContainer = document.getElementById('stripe-payment-element');
        if (paymentElementContainer) {
            paymentElementContainer.innerHTML = '';
            await this.paymentElement.mount('#stripe-payment-element');
            this.log('Stripe Elements mounted successfully');
        } else {
            throw new Error('Payment element container not found');
        }
    }

    async handlePayment() {
        if (this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;
            this.setLoading(true);
            this.clearError();

            this.log('Processing payment...');

            if (!this.stripe || !this.elements) {
                throw new Error('Stripe not properly initialized');
            }

            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: window.location.origin + '/pages/subscription.php?success=true',
                },
                redirect: 'if_required'
            });

            if (error) {
                // Payment failed
                if (error.type === "card_error" || error.type === "validation_error") {
                    this.showError(error.message);
                } else {
                    this.showError("An unexpected error occurred.");
                }
                this.log('Payment error:', error);
            } else {
                // Payment succeeded
                this.handlePaymentSuccess();
            }

        } catch (error) {
            this.handleError('Payment processing failed', error);
        } finally {
            this.setLoading(false);
            this.isProcessing = false;
        }
    }

    handlePaymentSuccess() {
        this.log('Payment successful!');
        
        // Show success message
        this.showSuccess('Payment completed! Your subscription is now active.');
        
        // Disable form
        if (this.form) {
            this.form.style.pointerEvents = 'none';
        }

        // Close modal and redirect after delay
        setTimeout(() => {
            this.closeModal();
            window.location.href = 'subscription.php?success=true';
        }, 2000);
    }

    closeModal() {
        this.log('Closing modal');
        
        if (this.modal) {
            this.modal.classList.remove('show');
            this.modal.classList.add('hidden');
            this.modal.style.display = 'none';
            this.modal.style.visibility = 'hidden';
            this.modal.style.opacity = '0';
            document.body.style.overflow = '';
        }
        
        // Clean up Stripe Elements
        if (this.paymentElement) {
            try {
                this.paymentElement.unmount();
            } catch (e) {
                this.log('Error unmounting payment element:', e);
            }
            this.paymentElement = null;
        }
        if (this.elements) {
            this.elements = null;
        }
        
        this.clientSecret = null;
        this.currentPlan = null;
        this.isProcessing = false;
        
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
            if (typeof error === 'string') {
                message = error;
            } else if (error.message) {
                message = error.message;
            }
        }
        
        this.showError(message);
        this.setLoading(false);
        this.isProcessing = false;
    }

    handleDebugSubscription(button) {
        this.log('Debug mode: simulating subscription for', button.dataset.planId);
        alert(`Debug Mode: Would subscribe to ${button.dataset.planName} for ${button.dataset.planPrice}`);
    }

    log(message, ...args) {
        if (this.debugMode) {
            console.log(`[StripePaymentModal] ${message}`, ...args);
        }
    }
}

// Global functions for backward compatibility
function openPaymentModal() {
    // This function is kept for any external calls
    console.warn('openPaymentModal() is deprecated. Use StripePaymentModal class instead.');
}

function closePaymentModal() {
    if (window.stripeModal) {
        window.stripeModal.closeModal();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add detailed debugging
    console.log('Initializing Stripe Payment Modal...');
    console.log('Stripe Config at init:', window.stripeConfig);
    console.log('Debug Mode:', window.debugMode);
    
    window.stripeModal = new StripePaymentModal();
    console.log('Stripe Payment Modal initialized');
});