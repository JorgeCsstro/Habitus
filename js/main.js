// main.js - Core JavaScript functionality for Habitus

/**
 * Initialize the application when DOM content is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add non-index page class for scrollbar styling if not on index.php
    if (!document.documentElement.classList.contains('index-page')) {
        // Apply scrollbar styling for non-index pages
        document.body.classList.add('with-scrollbar');
    }
    
    // Initialize any components that need JavaScript functionality
    initializeComponents();
    
    // Add smooth scrolling for anchor links
    setupSmoothScrolling();
});

/**
 * Initialize various components that require JavaScript
 */
function initializeComponents() {
    // Add any component initializations here
    initializeDropdowns();
    initializeModals();
    initializeNotifications();
}

/**
 * Initialize dropdown menus
 */
function initializeDropdowns() {
    // Find all dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the target dropdown
            const targetId = this.getAttribute('data-dropdown-target');
            const dropdown = document.getElementById(targetId);
            
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('show');
                
                // Close when clicking outside
                document.addEventListener('click', function closeDropdown(event) {
                    if (!dropdown.contains(event.target) && !toggle.contains(event.target)) {
                        dropdown.classList.remove('show');
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }
        });
    });
}

/**
 * Initialize modal dialogs
 */
function initializeModals() {
    // Find all modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the target modal
            const targetId = this.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            
            if (modal) {
                // Show modal
                modal.classList.add('show');
                
                // Find close buttons within modal
                const closeButtons = modal.querySelectorAll('.close-modal, .cancel-btn, .modal-close');
                closeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        modal.classList.remove('show');
                    });
                });
                
                // Close when clicking outside modal content
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            }
        });
    });
}

/**
 * Initialize notification system
 */
function initializeNotifications() {
    // Find notification elements if they exist
    const notificationContainer = document.querySelector('.notifications-container');
    
    if (!notificationContainer) return;
    
    // Remove notifications after they've been displayed
    const notifications = notificationContainer.querySelectorAll('.notification');
    notifications.forEach(notification => {
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000); // 5 seconds display time
    });
}

/**
 * Set up smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    // Find all internal anchor links
    const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target element
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * ENHANCED: Global function to update profile pictures across the site with cache busting
 * @param {string} newUrl - The new image URL (should include cache buster)
 */
window.updateGlobalProfilePicture = function(newUrl) {
    console.log('🖼️ Updating global profile picture to:', newUrl);
    
    // Update all profile picture elements
    const selectors = [
        '.user-avatar img',           // Header
        '.profile-picture',          // General profile pictures
        '.user-profile img',         // User profile sections
        '#profile-picture-preview',  // Settings page
        '.current-profile-picture img', // Settings page current picture
        '.profile-avatar img'        // Any other profile avatars
    ];
    
    let updatedCount = 0;
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && element.src !== newUrl) {
                // Force browser to reload image by clearing src first
                element.src = '';
                setTimeout(() => {
                    element.src = newUrl;
                    updatedCount++;
                    console.log(`✅ Updated profile picture: ${selector}`);
                }, 25);
            }
        });
    });
    
    console.log(`🖼️ Total profile pictures updated: ${updatedCount}`);
    
    // Store the current URL for future use
    window.currentProfilePictureUrl = newUrl;
};

/**
 * Create unique cache buster for images
 * @param {string} baseUrl - Base image URL
 * @returns {string} URL with cache buster
 */
window.createCacheBustedUrl = function(baseUrl, cacheBuster = null) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const timestamp = cacheBuster || Date.now();
    return `${baseUrl}${separator}v=${timestamp}`;
};