// js/settings.js - FIXED theme toggle handling

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing settings page...');
    
    // Wait for theme manager to be ready
    waitForThemeManager();
    
    // Set up other form listeners
    setupFormListeners();
    
    // Load saved preferences
    loadSavedPreferences();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('✅ Settings page initialized');
});

/**
 * Wait for theme manager to be ready and then setup theme controls
 */
function waitForThemeManager() {
    if (window.themeManager && window.themeManager.isReady()) {
        console.log('🎨 Theme manager already ready, setting up controls...');
        setupThemeControls();
    } else {
        console.log('🎨 Waiting for theme manager...');
        
        // Listen for theme manager ready event
        window.addEventListener('themeManagerReady', function(e) {
            console.log('🎨 Theme manager ready event received');
            setupThemeControls();
        });
        
        // Fallback polling in case event is missed
        let attempts = 0;
        const checkThemeManager = setInterval(() => {
            attempts++;
            
            if (window.themeManager && window.themeManager.isReady()) {
                console.log('🎨 Theme manager found via polling');
                clearInterval(checkThemeManager);
                setupThemeControls();
            } else if (attempts > 50) { // Stop after 5 seconds
                console.error('❌ Theme manager not ready after 5 seconds');
                clearInterval(checkThemeManager);
                setupFallbackThemeControls();
            }
        }, 100);
    }
}

/**
 * Set up theme-related controls
 */
function setupThemeControls() {
    console.log('🎨 Setting up theme controls...');
    
    try {
        // Theme radio buttons - more specific event handling
        const themeRadios = document.querySelectorAll('.theme-option input[type="radio"]');
        console.log(`Found ${themeRadios.length} theme radio buttons`);
        
        themeRadios.forEach((input, index) => {
            console.log(`Setting up radio ${index}: ${input.value}`);
            
            input.addEventListener('change', function(e) {
                console.log(`Radio change event: ${this.value}, checked: ${this.checked}`);
                
                if (this.checked && window.themeManager) {
                    handleThemeChange(this.value);
                }
            });
        });
        
        // Theme option cards (clickable) - enhanced with better debugging
        const themeOptions = document.querySelectorAll('.theme-option');
        console.log(`Found ${themeOptions.length} theme option cards`);
        
        themeOptions.forEach((option, index) => {
            const themeName = option.getAttribute('data-theme') || option.querySelector('input')?.value;
            console.log(`Setting up theme option ${index}: ${themeName}`);
            
            option.addEventListener('click', function(e) {
                console.log(`Theme option clicked: ${themeName}`);
                console.log('Click target:', e.target);
                
                // Don't handle if clicking on the radio button directly
                if (e.target.type === 'radio') {
                    console.log('Clicked on radio button directly, letting it handle');
                    return;
                }
                
                const input = this.querySelector('input[type="radio"]');
                console.log('Found input:', input);
                
                if (input && !input.checked) {
                    console.log(`Activating theme: ${input.value}`);
                    input.checked = true;
                    
                    // Trigger change event manually
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    console.log('Input already checked or not found');
                }
            });
            
            // Add visual feedback
            option.style.cursor = 'pointer';
        });
        
        // Update UI to match current theme
        if (window.themeManager) {
            const currentTheme = window.themeManager.getTheme();
            console.log(`Updating UI for current theme: ${currentTheme}`);
            updateThemeUI(currentTheme);
        }
        
        console.log('✅ Theme controls setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up theme controls:', error);
        setupFallbackThemeControls();
    }
}

/**
 * Fallback theme controls if theme manager fails
 */
function setupFallbackThemeControls() {
    console.log('🔧 Setting up fallback theme controls...');
    
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const input = this.querySelector('input[type="radio"]');
            if (input) {
                input.checked = true;
                const theme = input.value;
                
                // Direct theme application
                fallbackThemeChange(theme);
            }
        });
    });
}

/**
 * Fallback theme change function
 */
function fallbackThemeChange(theme) {
    console.log(`🔧 Fallback theme change to: ${theme}`);
    
    // Update CSS file
    let themeStylesheet = document.getElementById('theme-stylesheet');
    if (!themeStylesheet) {
        themeStylesheet = document.createElement('link');
        themeStylesheet.id = 'theme-stylesheet';
        themeStylesheet.rel = 'stylesheet';
        document.head.appendChild(themeStylesheet);
    }
    
    const isInSubdirectory = window.location.pathname.includes('/pages/');
    const basePath = isInSubdirectory ? '../css/themes/' : 'css/themes/';
    themeStylesheet.href = `${basePath}${theme}.css`;
    
    // Update classes
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    // Update UI
    updateThemeUI(theme);
    
    // Save to localStorage
    localStorage.setItem('habitus-theme', theme);
    
    showNotification(`Theme changed to ${theme}`, 'success');
}

/**
 * Handle theme change with enhanced feedback
 * @param {string} theme - Theme name (light/dark)
 */
function handleThemeChange(theme) {
    console.log(`🎨 Handling theme change to: ${theme}`);
    
    if (!window.themeManager) {
        console.error('❌ Theme manager not available, using fallback');
        fallbackThemeChange(theme);
        return;
    }
    
    // Show loading state
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.7';
    });
    
    try {
        // Apply theme
        const success = window.themeManager.setTheme(theme, true, true);
        
        if (success) {
            // Mark as manual preference
            localStorage.setItem('habitus-theme-manual', 'true');
            
            // Show success notification
            setTimeout(() => {
                showNotification(`Switched to ${theme} theme`, 'success');
                
                // Re-enable options
                themeOptions.forEach(option => {
                    option.style.pointerEvents = '';
                    option.style.opacity = '';
                });
            }, 200);
        } else {
            throw new Error('Theme manager returned false');
        }
    } catch (error) {
        console.error('❌ Error in handleThemeChange:', error);
        
        // Re-enable options immediately on error
        themeOptions.forEach(option => {
            option.style.pointerEvents = '';
            option.style.opacity = '';
        });
        
        showNotification('Error changing theme', 'error');
        
        // Try fallback
        fallbackThemeChange(theme);
    }
}

/**
 * Update theme UI elements
 * @param {string} currentTheme - Current theme
 */
function updateThemeUI(currentTheme) {
    console.log(`🎨 Updating theme UI for: ${currentTheme}`);
    
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        if (input) {
            const isActive = input.value === currentTheme;
            option.classList.toggle('active', isActive);
            input.checked = isActive;
            
            console.log(`Theme option ${input.value}: active=${isActive}`);
        }
    });
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    // Theme toggle shortcut info
    console.log('💡 Theme toggle shortcut: Ctrl+Shift+T');
}

/**
 * Set up form event listeners
 */
function setupFormListeners() {
    // Change password form
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Change email form
    const emailForm = document.getElementById('change-email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailChange);
    }
    
    // Delete account form
    const deleteForm = document.getElementById('delete-account-form');
    if (deleteForm) {
        deleteForm.addEventListener('submit', handleAccountDelete);
    }
}

/**
 * Load saved user preferences
 */
function loadSavedPreferences() {
    // Load notification preferences
    const emailNotifications = localStorage.getItem('emailNotifications') !== 'false';
    const taskReminders = localStorage.getItem('taskReminders') !== 'false';
    const autoTheme = localStorage.getItem('autoTheme') === 'true';
    
    const emailToggle = document.getElementById('email-notifications');
    const taskToggle = document.getElementById('task-reminders');
    const autoThemeToggle = document.getElementById('auto-theme');
    
    if (emailToggle) emailToggle.checked = emailNotifications;
    if (taskToggle) taskToggle.checked = taskReminders;
    if (autoThemeToggle) autoThemeToggle.checked = autoTheme;
}

/**
 * Handle profile picture change
 * @param {HTMLInputElement} input - File input element
 */
function handleProfilePictureChange(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size must be less than 5MB', 'error');
            return;
        }
        
        // Show preview immediately
        const preview = document.getElementById('profile-picture-preview');
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        showNotification('Profile picture updated', 'success');
    }
}

/**
 * Change language
 * @param {string} language - Language code
 */
function changeLanguage(language) {
    const select = document.getElementById('language-select');
    if (select) {
        select.disabled = true;
        select.style.opacity = '0.7';
    }
    
    // Save language preference
    fetch('../php/api/user/update_settings.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            setting: 'language',
            value: language
        })
    })
    .then(response => response.json())
    .then(data => {
        if (select) {
            select.disabled = false;
            select.style.opacity = '1';
        }
        
        if (data.success) {
            showNotification('Language updated. Page will reload in 2 seconds...', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(data.message || 'Error updating language', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (select) {
            select.disabled = false;
            select.style.opacity = '1';
        }
        showNotification('Error updating language', 'error');
    });
}

/**
 * Toggle auto theme
 * @param {boolean} enabled - Whether auto theme is enabled
 */
function toggleAutoTheme(enabled) {
    localStorage.setItem('autoTheme', enabled);
    
    if (enabled) {
        // Remove manual preference flag to allow auto-switching
        localStorage.removeItem('habitus-theme-manual');
        
        // Implement auto theme switching based on time
        const hour = new Date().getHours();
        const isDaytime = hour >= 6 && hour < 18;
        const newTheme = isDaytime ? 'light' : 'dark';
        
        if (window.themeManager && window.themeManager.getTheme() !== newTheme) {
            window.themeManager.setTheme(newTheme, true, true);
            showNotification(`Auto-switched to ${newTheme} theme`, 'info');
        }
        
        showNotification('Auto theme enabled', 'success');
    } else {
        // Mark current theme as manual preference
        localStorage.setItem('habitus-theme-manual', 'true');
        showNotification('Auto theme disabled', 'info');
    }
}

/**
 * Show modal
 * @param {string} modalId - Modal ID
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

/**
 * Close modal
 * @param {string} modalId - Modal ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            
            const form = modal.querySelector('form');
            if (form) form.reset();
        }, 300);
    }
}

/**
 * Show change password modal
 */
function showChangePasswordModal() {
    showModal('password-modal');
}

/**
 * Show change email modal
 */
function showChangeEmailModal() {
    showModal('email-modal');
}

/**
 * Show delete account modal
 */
function showDeleteAccountModal() {
    showModal('delete-account-modal');
}

/**
 * Handle password change
 */
function handlePasswordChange(e) {
    e.preventDefault();
    showNotification('Password change functionality coming soon', 'info');
}

/**
 * Handle email change
 */
function handleEmailChange(e) {
    e.preventDefault();
    showNotification('Email change functionality coming soon', 'info');
}

/**
 * Handle account deletion
 */
function handleAccountDelete(e) {
    e.preventDefault();
    showNotification('Account deletion functionality coming soon', 'info');
}

/**
 * Toggle email notifications
 * @param {boolean} enabled - Whether enabled
 */
function toggleEmailNotifications(enabled) {
    localStorage.setItem('emailNotifications', enabled);
    showNotification(`Email notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

/**
 * Toggle task reminders
 * @param {boolean} enabled - Whether enabled
 */
function toggleTaskReminders(enabled) {
    localStorage.setItem('taskReminders', enabled);
    showNotification(`Task reminders ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

/**
 * Enhanced notification system
 */
function showNotification(message, type = 'success', duration = 4000) {
    console.log(`📢 Notification: ${message} (${type})`);
    
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s;
        max-width: 300px;
        border-left: 4px solid ${getNotificationColor(type)};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; cursor: pointer; margin-left: auto; font-size: 18px;">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

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
 * Export user data
 */
function exportUserData() {
    showNotification('Export functionality coming soon', 'info');
}

/**
 * Clear cache
 */
function clearCache() {
    if (confirm('This will clear all cached data and refresh the page. Continue?')) {
        localStorage.clear();
        sessionStorage.clear();
        
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        showNotification('Cache cleared. Refreshing...', 'success');
        setTimeout(() => window.location.reload(true), 1500);
    }
}

/**
 * Open customer portal
 */
async function openCustomerPortal() {
    showNotification('Subscription management coming soon', 'info');
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Listen for theme changes from other sources
window.addEventListener('themeChanged', function(e) {
    console.log(`🎨 Theme changed event received: ${e.detail.theme}`);
    updateThemeUI(e.detail.theme);
});

// Debug function to test theme switching
window.debugThemeSwitch = function(theme) {
    console.log(`🔧 Debug theme switch to: ${theme}`);
    if (window.themeManager) {
        window.themeManager.setTheme(theme, true, true);
    } else {
        fallbackThemeChange(theme);
    }
};