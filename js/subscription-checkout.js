// js/subscription-checkout.js - Updated with better error handling

// Global variables
let selectedPlan = null;

// Subscribe to plan function
async function subscribeToPlan(planType) {
    console.log(`Starting subscription for plan: ${planType}`);
    
    // Validate plan
    if (!planType || !['adfree', 'premium'].includes(planType)) {
        showAlert('Invalid plan selected', 'error');
        return;
    }
    
    selectedPlan = planType;
    
    // Show loading state on button
    const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
    buttons.forEach(btn => {
        if (btn.textContent !== 'Current Plan') {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Processing...';
        }
    });
    
    try {
        console.log('Sending subscription request...');
        
        // Create checkout session
        const response = await fetch('../php/api/subscription/create-checkout-session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan: planType
            })
        });
        
        console.log('Response status:', response.status);
        
        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error:', response.status, errorText);
            throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
        }
        
        // Parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            const responseText = await response.text();
            console.error('Response text:', responseText);
            throw new Error('Invalid server response. Please check server logs.');
        }
        
        console.log('Parsed response:', data);
        
        if (data.success && data.checkout_url) {
            if (data.demo_mode) {
                showAlert('Demo mode: Subscription activated! 🎉', 'success');
                setTimeout(() => {
                    window.location.href = data.checkout_url;
                }, 1500);
            } else {
                // Redirect to Stripe Checkout
                window.location.href = data.checkout_url;
            }
        } else {
            throw new Error(data.message || 'Failed to create checkout session');
        }
        
    } catch (error) {
        console.error('Subscription error:', error);
        
        let errorMessage = 'An error occurred. Please try again.';
        
        // Provide more specific error messages
        if (error.message.includes('500')) {
            errorMessage = 'Server configuration error. Please contact support.';
        } else if (error.message.includes('Invalid server response')) {
            errorMessage = 'Server response error. Please check your connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showAlert(errorMessage, 'error');
        
        // Re-enable buttons
        buttons.forEach(btn => {
            if (btn.textContent.includes('Processing')) {
                btn.disabled = false;
                btn.innerHTML = planType === 'premium' ? 'Go Premium' : 'Subscribe';
            }
        });
    }
}

// Manage subscription (open customer portal)
async function manageSubscription() {
    console.log('Opening customer portal...');
    
    // Show loading state
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
            // Redirect to Stripe Customer Portal
            window.location.href = data.url;
        } else {
            throw new Error(data.message || 'Unable to open subscription management');
        }
        
    } catch (error) {
        console.error('Portal error:', error);
        showAlert('Unable to open subscription management. Please try again.', 'error');
        
        // Re-enable button
        if (manageBtn) {
            manageBtn.disabled = false;
            manageBtn.textContent = 'Manage Subscription';
        }
    }
}

// Downgrade to free plan
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

// Toggle FAQ answers
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
    }, 5000);
}

// Check URL parameters for success/cancel messages
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
        if (urlParams.get('demo') === 'true') {
            showAlert('🎉 Demo subscription activated! This is a demo - no payment was processed.', 'success');
        } else {
            showAlert('🎉 Subscription activated successfully! Welcome to premium features!', 'success');
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
        showAlert('Subscription process was cancelled.', 'warning');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('portal') === 'success') {
        showAlert('Subscription settings updated successfully.', 'success');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Debug function to test server connectivity
async function testConnection() {
    try {
        console.log('Testing server connection...');
        const response = await fetch('../php/api/subscription/test.php');
        console.log('Test response status:', response.status);
        const text = await response.text();
        console.log('Test response:', text);
    } catch (error) {
        console.error('Connection test failed:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Subscription system initialized');
    
    // Check for success/cancel parameters
    checkUrlParams();
    
    // Test connection in debug mode
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        testConnection();
    }
    
    // Add CSS for spinner if not already present
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 0.8s linear infinite;
                vertical-align: middle;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
});

// Export functions for global access
window.subscribeToPlan = subscribeToPlan;
window.manageSubscription = manageSubscription;
window.downgradeToFree = downgradeToFree;
window.toggleFaq = toggleFaq;