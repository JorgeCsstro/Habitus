// js/settings.js - Updated to work with new theme manager

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing settings page...');
    
    // Wait for theme manager to be ready
    if (window.themeManager) {
        setupThemeControls();
    } else {
        // Wait for theme manager to initialize
        const checkThemeManager = setInterval(() => {
            if (window.themeManager) {
                clearInterval(checkThemeManager);
                setupThemeControls();
            }
        }, 100);
    }
    
    // Set up other form listeners
    setupFormListeners();
    
    // Load saved preferences
    loadSavedPreferences();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('✅ Settings page initialized');
});

/**
 * Set up theme-related controls
 */
function setupThemeControls() {
    console.log('🎨 Setting up theme controls...');
    
    // Theme radio buttons
    document.querySelectorAll('.theme-option input[type="radio"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked && window.themeManager) {
                handleThemeChange(this.value);
            }
        });
    });
    
    // Theme option cards (clickable)
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function(e) {
            // Prevent double-firing if clicking on the radio button directly
            if (e.target.type === 'radio') return;
            
            const input = this.querySelector('input[type="radio"]');
            if (input && !input.checked && window.themeManager) {
                input.checked = true;
                handleThemeChange(input.value);
            }
        });
    });
    
    // Update UI to match current theme
    if (window.themeManager) {
        updateThemeUI(window.themeManager.getTheme());
    }
}

/**
 * Handle theme change with enhanced feedback
 * @param {string} theme - Theme name (light/dark)
 */
function handleThemeChange(theme) {
    if (!window.themeManager) {
        console.error('Theme manager not available');
        showNotification('Theme system not ready', 'error');
        return;
    }
    
    console.log(`🎨 Handling theme change to: ${theme}`);
    
    // Show loading state
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.7';
    });
    
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
        // Re-enable options immediately on error
        themeOptions.forEach(option => {
            option.style.pointerEvents = '';
            option.style.opacity = '';
        });
        
        showNotification('Error changing theme', 'error');
    }
}

/**
 * Update theme UI elements
 * @param {string} currentTheme - Current theme
 */
function updateThemeUI(currentTheme) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        if (input) {
            const isActive = input.value === currentTheme;
            option.classList.toggle('active', isActive);
            input.checked = isActive;
        }
    });
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    // Additional settings-specific shortcuts can go here
    // The global theme toggle (Ctrl+Shift+T) is handled by the theme manager
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
        
        // Create FormData
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        // Show loading state
        const overlay = preview.parentElement.querySelector('.profile-picture-overlay');
        if (overlay) {
            overlay.innerHTML = '<div class="loading-spinner">📸</div>';
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
 * @param {Event} e - Form submit event
 */
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    const errors = [];
    
    if (!currentPassword) errors.push('Current password is required');
    if (newPassword.length < 8) errors.push('Password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        errors.push('Password must contain uppercase, lowercase, and numbers');
    }
    if (newPassword !== confirmPassword) errors.push('New passwords do not match');
    if (newPassword === currentPassword) errors.push('New password must be different');
    
    if (errors.length > 0) {
        showNotification(errors.join('. '), 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    // Send request
    fetch('../php/api/user/change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    
    const submitBtn = e.target.querySelector('.save-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    fetch('../php/api/user/change_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail, password: password })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (data.success) {
            showNotification('Email updated successfully', 'success');
            closeModal('email-modal');
            
            const emailDisplay = document.querySelector('.profile-info p');
            if (emailDisplay) emailDisplay.textContent = newEmail;
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
 * Handle account deletion
 * @param {Event} e - Form submit event
 */
function handleAccountDelete(e) {
    e.preventDefault();
    
    const password = document.getElementById('delete-password').value;
    const confirmation = document.getElementById('delete-confirm').value;
    
    if (confirmation !== 'DELETE') {
        showNotification('Please type DELETE to confirm', 'error');
        return;
    }
    
    if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
        return;
    }
    
    const submitBtn = e.target.querySelector('.delete-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Deleting...';
    
    fetch('../php/api/user/delete_account.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Account deleted. Redirecting...', 'success');
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
 * @param {boolean} enabled - Whether enabled
 */
function toggleEmailNotifications(enabled) {
    localStorage.setItem('emailNotifications', enabled);
    updateNotificationPreference('email_notifications', enabled);
}

/**
 * Toggle task reminders
 * @param {boolean} enabled - Whether enabled
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
    fetch('../php/api/user/update_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            setting: type,
            value: enabled
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Notification preferences updated', 'success');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating notification preferences', 'error');
    });
}

/**
 * Enhanced notification system
 */
function showNotification(message, type = 'success', duration = 4000) {
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
    `;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; cursor: pointer; margin-left: auto;">×</button>
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
    showNotification('Preparing your data export...', 'info');
    
    fetch('../php/api/user/export_data.php', { method: 'POST' })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'habitus-zone-data.json';
            a.click();
            window.URL.revokeObjectURL(url);
            showNotification('Data exported successfully', 'success');
        })
        .catch(error => {
            console.error('Export error:', error);
            showNotification('Error exporting data', 'error');
        });
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
    try {
        showNotification('Opening subscription management...', 'info');
        
        const response = await fetch('../php/api/subscription/create-portal-session.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
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
        closeModal(e.target.id);
    }
});

// Listen for theme changes from other sources
window.addEventListener('themeChanged', function(e) {
    updateThemeUI(e.detail.theme);
});