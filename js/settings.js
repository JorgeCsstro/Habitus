// settings.js - Enhanced Settings page functionality with Theme System

// Theme management class
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.transitionDuration = 300;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme, false);
        this.setupTransitions();
        this.watchSystemTheme();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme, animate = true) {
        if (theme === this.currentTheme) return;
        
        console.log(`🎨 Switching theme from ${this.currentTheme} to ${theme}`);
        
        if (animate) {
            this.animateThemeChange(() => {
                this.applyTheme(theme, true);
            });
        } else {
            this.applyTheme(theme, false);
        }
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.updateThemeUI();
        this.saveThemeToServer(theme);
    }

    applyTheme(theme, animated = false) {
        const body = document.body;
        const html = document.documentElement;
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark');
        html.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        body.classList.add(`theme-${theme}`);
        html.classList.add(`theme-${theme}`);
        
        // Set data attribute for CSS targeting
        html.setAttribute('data-theme', theme);
        
        // Update theme stylesheet
        this.updateThemeStylesheet(theme);
        
        // Update meta theme-color for browser chrome
        this.updateMetaThemeColor(theme);
        
        if (animated) {
            // Add transition class temporarily
            body.classList.add('theme-transitioning');
            setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, this.transitionDuration);
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, animated }
        }));
        
        console.log(`✅ Theme applied: ${theme}`);
    }

    animateThemeChange(callback) {
        const body = document.body;
        
        // Add fade effect
        body.style.transition = `filter ${this.transitionDuration}ms ease`;
        body.style.filter = 'brightness(0.8) blur(2px)';
        
        setTimeout(() => {
            callback();
            
            setTimeout(() => {
                body.style.filter = 'brightness(1) blur(0px)';
                
                setTimeout(() => {
                    body.style.transition = '';
                    body.style.filter = '';
                }, this.transitionDuration);
            }, 50);
        }, this.transitionDuration / 2);
    }

    updateThemeStylesheet(theme) {
        let themeStylesheet = document.getElementById('theme-stylesheet');
        
        if (!themeStylesheet) {
            themeStylesheet = document.createElement('link');
            themeStylesheet.id = 'theme-stylesheet';
            themeStylesheet.rel = 'stylesheet';
            document.head.appendChild(themeStylesheet);
        }
        
        themeStylesheet.href = `../css/themes/${theme}.css`;
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#f9f5f0',
            dark: '#1a1a1a'
        };
        
        metaThemeColor.content = colors[theme] || colors.light;
    }

    setupTransitions() {
        // Add CSS for smooth transitions
        if (!document.getElementById('theme-transitions')) {
            const style = document.createElement('style');
            style.id = 'theme-transitions';
            style.textContent = `
                .theme-transitioning * {
                    transition: background-color 0.3s ease, 
                                color 0.3s ease, 
                                border-color 0.3s ease,
                                box-shadow 0.3s ease !important;
                }
                
                .theme-transition-disabled * {
                    transition: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                // Only follow system if no user preference is stored
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    updateThemeUI() {
        // Update theme selector in settings
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const input = option.querySelector('input[type="radio"]');
            option.classList.toggle('active', input.value === this.currentTheme);
            input.checked = input.value === this.currentTheme;
        });
    }

    async saveThemeToServer(theme) {
        try {
            const response = await fetch('../php/api/user/update_settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    setting: 'theme',
                    value: theme
                })
            });
            
            const data = await response.json();
            if (!data.success) {
                console.warn('Failed to save theme to server:', data.message);
            }
        } catch (error) {
            console.error('Error saving theme to server:', error);
        }
    }

    getTheme() {
        return this.currentTheme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Global theme manager instance
let themeManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing theme system...');
    
    // Initialize theme manager
    themeManager = new ThemeManager();
    
    // Set up form listeners
    setupFormListeners();
    
    // Load saved preferences
    loadSavedPreferences();
    
    // Setup theme change listeners
    setupThemeListeners();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('✅ Settings page initialized');
});

/**
 * Set up theme-related event listeners
 */
function setupThemeListeners() {
    // Theme radio buttons
    document.querySelectorAll('.theme-option input[type="radio"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                changeTheme(this.value);
            }
        });
    });
    
    // Theme option cards (clickable)
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const input = this.querySelector('input[type="radio"]');
            if (input && !input.checked) {
                input.checked = true;
                changeTheme(input.value);
            }
        });
    });
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Shift + T to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            themeManager.toggleTheme();
            showNotification('Theme toggled!', 'info');
        }
    });
}

/**
 * Change theme with enhanced feedback
 * @param {string} theme - Theme name (light/dark)
 */
function changeTheme(theme) {
    if (!themeManager) {
        console.error('Theme manager not initialized');
        return;
    }
    
    // Show loading state
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.7';
    });
    
    // Apply theme
    themeManager.setTheme(theme);
    
    // Show success notification
    setTimeout(() => {
        showNotification(`Switched to ${theme} theme`, 'success');
        
        // Re-enable theme options
        themeOptions.forEach(option => {
            option.style.pointerEvents = '';
            option.style.opacity = '';
        });
    }, themeManager.transitionDuration);
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
    // Load notification preferences from localStorage or API
    const emailNotifications = localStorage.getItem('emailNotifications') !== 'false';
    const taskReminders = localStorage.getItem('taskReminders') !== 'false';
    
    const emailToggle = document.getElementById('email-notifications');
    const taskToggle = document.getElementById('task-reminders');
    
    if (emailToggle) emailToggle.checked = emailNotifications;
    if (taskToggle) taskToggle.checked = taskReminders;
}

/**
 * Handle profile picture change with enhanced preview
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
        
        // Create FormData
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        // Show loading state
        const overlay = preview.parentElement.querySelector('.profile-picture-overlay');
        if (overlay) {
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            overlay.style.opacity = '1';
        }
        
        // Upload image
        fetch('../php/api/user/upload_profile_picture.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.innerHTML = `
                        <label for="profile-picture-upload" class="change-picture-btn">
                            <img src="../images/icons/camera.webp" alt="Change">
                            <span>Change Photo</span>
                        </label>
                    `;
                }, 300);
            }
            
            if (data.success) {
                // Update preview
                preview.src = data.image_url;
                
                // Update profile picture in header if exists
                const headerAvatar = document.querySelector('.user-avatar img');
                if (headerAvatar) {
                    headerAvatar.src = data.image_url;
                }
                
                showNotification('Profile picture updated successfully', 'success');
            } else {
                showNotification(data.message || 'Error uploading image', 'error');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            if (overlay) overlay.style.opacity = '0';
            showNotification('Error uploading image', 'error');
        });
    }
}

/**
 * Change language with enhanced feedback
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
            // Reload page to apply language change
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
 * Show change password modal
 */
function showChangePasswordModal() {
    const modal = document.getElementById('password-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

/**
 * Show delete account modal
 */
function showDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

/**
 * Close modal with animation
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Reset form
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }, 300);
    }
}

/**
 * Handle password change with enhanced validation
 * @param {Event} e - Form submit event
 */
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Enhanced validation
    const errors = [];
    
    if (!currentPassword) {
        errors.push('Current password is required');
    }
    
    if (newPassword.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        errors.push('Password must contain uppercase, lowercase, and numbers');
    }
    
    if (newPassword !== confirmPassword) {
        errors.push('New passwords do not match');
    }
    
    if (newPassword === currentPassword) {
        errors.push('New password must be different from current password');
    }
    
    if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Updating...';
    
    // Send request
    fetch('../php/api/user/change_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (data.success) {
            showNotification('Password updated successfully', 'success');
            closeModal('password-modal');
        } else {
            showNotification(data.message || 'Error updating password', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        showNotification('Error updating password', 'error');
    });
}

/**
 * Handle email change
 * @param {Event} e - Form submit event
 */
function handleEmailChange(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('new-email').value;
    const password = document.getElementById('email-password').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Updating...';
    
    // Send request
    fetch('../php/api/user/change_email.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            new_email: newEmail,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (data.success) {
            showNotification('Email updated successfully', 'success');
            closeModal('email-modal');
            
            // Update displayed email
            const emailDisplay = document.querySelector('.profile-info p');
            if (emailDisplay) {
                emailDisplay.textContent = newEmail;
            }
        } else {
            showNotification(data.message || 'Error updating email', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        showNotification('Error updating email', 'error');
    });
}

/**
 * Handle account deletion with confirmation
 * @param {Event} e - Form submit event
 */
function handleAccountDelete(e) {
    e.preventDefault();
    
    const password = document.getElementById('delete-password').value;
    const confirmation = document.getElementById('delete-confirm').value;
    
    // Validate confirmation
    if (confirmation !== 'DELETE') {
        showNotification('Please type DELETE to confirm', 'error');
        return;
    }
    
    // Show final confirmation
    if (!confirm('This action cannot be undone. Are you absolutely sure you want to delete your account?')) {
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.delete-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Deleting...';
    
    // Send request
    fetch('../php/api/user/delete_account.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Account deleted. Redirecting...', 'success');
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 2000);
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showNotification(data.message || 'Error deleting account', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        showNotification('Error deleting account', 'error');
    });
}

/**
 * Toggle email notifications
 * @param {boolean} enabled - Whether notifications are enabled
 */
function toggleEmailNotifications(enabled) {
    localStorage.setItem('emailNotifications', enabled);
    updateNotificationPreference('email_notifications', enabled);
}

/**
 * Toggle task reminders
 * @param {boolean} enabled - Whether reminders are enabled
 */
function toggleTaskReminders(enabled) {
    localStorage.setItem('taskReminders', enabled);
    updateNotificationPreference('task_reminders', enabled);
}

/**
 * Update notification preference on server
 * @param {string} type - Notification type
 * @param {boolean} enabled - Whether enabled
 */
function updateNotificationPreference(type, enabled) {
    fetch('../php/api/user/update_notifications.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: type,
            enabled: enabled
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Notification preferences updated', 'success');
        } else {
            showNotification('Error updating notification preferences', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating notification preferences', 'error');
    });
}

/**
 * Enhanced notification system
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Display duration in ms (default: 4000)
 */
function showNotification(message, type = 'success', duration = 4000) {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification with enhanced styling
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
    
    // Make notification clickable to dismiss
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    });
}

/**
 * Open customer portal for subscription management
 */
async function openCustomerPortal() {
    try {
        showNotification('Opening subscription management...', 'info');
        
        const response = await fetch('../php/api/subscription/create-portal-session.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.message || 'Failed to create portal session');
        }
        
    } catch (error) {
        console.error('Error opening customer portal:', error);
        showNotification('Unable to open subscription management. Please try again.', 'error');
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Export theme manager for global access
window.themeManager = themeManager;