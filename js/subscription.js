// subscription.js - General subscription page functionality (non-Stripe)

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Subscription page management loaded');
    
    // Check if critical elements exist
    checkCriticalElements();
    
    // Set up additional event handlers
    setupAdditionalHandlers();
    
    // Initialize page features
    initializePageFeatures();
});

/**
 * Check if critical elements exist in the DOM
 */
function checkCriticalElements() {
    const modal = document.getElementById('payment-modal');
    const paymentElement = document.getElementById('payment-element');
    
    if (!modal) {
        console.error('❌ Payment modal not found!');
    } else {
        console.log('✅ Payment modal found');
    }
    
    if (!paymentElement) {
        console.error('❌ Payment element container not found!');
    } else {
        console.log('✅ Payment element container found');
    }
    
    // Log modal dimensions for debugging
    if (modal) {
        const rect = modal.getBoundingClientRect();
        console.log('📐 Modal dimensions:', {
            width: rect.width,
            height: rect.height,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
}

/**
 * Set up additional event handlers
 */
function setupAdditionalHandlers() {
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('payment-modal');
        if (e.target === modal) {
            if (typeof closePaymentModal === 'function') {
                closePaymentModal();
            }
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('payment-modal');
            if (modal && modal.classList.contains('show')) {
                if (typeof closePaymentModal === 'function') {
                    closePaymentModal();
                }
            }
        }
    });
    
    // Handle plan card hover effects
    setupPlanCardEffects();
}

/**
 * Initialize page features
 */
function initializePageFeatures() {
    // Smooth scroll for anchor links (if any)
    setupSmoothScrolling();
    
    // Initialize lazy loading for images (if needed)
    setupLazyLoading();
    
    // Set up intersection observer for animations
    setupScrollAnimations();
}

/**
 * Set up plan card hover effects
 */
function setupPlanCardEffects() {
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle animation or effect if needed
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            // Reset transform if not current plan
            if (!this.classList.contains('current')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
}

/**
 * Set up smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Set up lazy loading for images
 */
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => imageObserver.observe(img));
    }
}

/**
 * Set up scroll animations for elements
 */
function setupScrollAnimations() {
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements that should animate on scroll
        const animateElements = document.querySelectorAll('.plan-card, .benefit, .faq-item');
        animateElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            animationObserver.observe(el);
        });
    }
}

/**
 * Enhanced FAQ toggle function (fallback if not defined in Stripe file)
 */
if (typeof window.toggleFaq !== 'function') {
    window.toggleFaq = function(questionElement) {
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
    };
}

/**
 * Show notification helper function
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `subscription-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(141, 91, 76, 0.15);
        transform: translateX(400px);
        transition: transform 0.3s;
        max-width: 300px;
        font-weight: 500;
        border-left: 4px solid ${getNotificationColor(type)};
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string} - Color value
 */
function getNotificationColor(type) {
    const colors = {
        success: '#6a8d7f',
        error: '#a15c5c',
        warning: '#c4a356',
        info: '#5d7b8a'
    };
    return colors[type] || colors.info;
}

/**
 * Subscription management functions (fallback if not defined in Stripe file)
 */
if (typeof window.manageSubscription !== 'function') {
    window.manageSubscription = function() {
        if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
            cancelSubscription();
        }
    };
}

if (typeof window.downgradeToFree !== 'function') {
    window.downgradeToFree = function() {
        if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
            cancelSubscription();
        }
    };
}

/**
 * Cancel subscription function (if not defined elsewhere)
 */
function cancelSubscription() {
    fetch('../php/api/subscription/cancel.php', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Subscription cancelled. You will retain access until ' + data.expires_date, 'info');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showNotification(data.message || 'Error cancelling subscription', 'error');
        }
    })
    .catch(error => {
        console.error('Cancel error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

/**
 * Handle page visibility changes for better UX
 */
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Page became visible - could refresh subscription status if needed
        console.log('🔄 Page became visible - subscription status check');
    }
});

/**
 * Handle online/offline events
 */
window.addEventListener('online', function() {
    console.log('🌐 Connection restored');
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    console.log('📡 Connection lost');
    showNotification('Connection lost. Please check your internet.', 'warning');
});

/**
 * Debug helper functions
 */
window.subscriptionDebug = {
    checkElements: checkCriticalElements,
    showTestNotification: () => showNotification('Test notification', 'info'),
    logModalState: function() {
        const modal = document.getElementById('payment-modal');
        console.log('Modal state:', {
            exists: !!modal,
            visible: modal ? modal.style.display : 'N/A',
            classes: modal ? modal.className : 'N/A'
        });
    }
};

console.log('✅ Subscription management functions loaded');
console.log('🔧 Debug helper available at window.subscriptionDebug');