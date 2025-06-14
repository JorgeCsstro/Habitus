// js/settings.js - COMPLETE Theme System and Profile Picture Upload

// FIXED: Use global theme manager - NO redeclaration
function getThemeManager() {
    return window.themeManager || window.getThemeManager();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing settings page theme integration...');
    
    // Wait for theme manager to be ready
    if (window.themeManager) {
        setupSettingsAfterThemeManager();
    } else {
        // Wait for theme manager ready event
        window.addEventListener('themeManagerReady', setupSettingsAfterThemeManager);
        
        // Fallback timeout
        setTimeout(() => {
            if (window.themeManager) {
                setupSettingsAfterThemeManager();
            } else {
                console.warn('Theme manager not available after timeout');
                // Initialize basic functionality without theme manager
                setupBasicSettings();
            }
        }, 1000);
    }
});

function setupSettingsAfterThemeManager() {
    console.log('✅ Setting up settings page with theme manager');
    
    setupThemeListeners();
    setupBasicSettings();
    
    console.log('✅ Settings page initialized');
}

function setupBasicSettings() {
    // Set up form listeners
    setupFormListeners();
    
    // Load saved preferences
    loadSavedPreferences();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
}

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
        option.addEventListener('click', function(e) {
            // Prevent double-firing if clicking on the radio button directly
            if (e.target.type === 'radio') return;
            
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
            const manager = getThemeManager();
            if (manager) {
                const newTheme = manager.toggleTheme();
                showNotification(`Theme toggled to ${newTheme}!`, 'info');
            }
        }
    });
}

/**
 * Change theme with enhanced feedback
 * @param {string} theme - Theme name (light/dark)
 */
function changeTheme(theme) {
    console.log(`🎨 Settings: Changing theme to ${theme}`);
    
    // Show loading state
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.7';
    });
    
    // Apply theme immediately to DOM
    applyThemeToDOM(theme);
    
    // Save theme to database
    saveThemeToDatabase(theme).then(success => {
        // Re-enable options
        themeOptions.forEach(option => {
            option.style.pointerEvents = '';
            option.style.opacity = '';
        });
        
        if (success) {
            showNotification(`✨ Switched to ${theme} theme`, 'success');
            // Update UI to show current theme
            updateThemeUI(theme);
        } else {
            showNotification('Failed to save theme preference', 'error');
        }
    });
}

function updateThemeUI(selectedTheme) {
    // Update radio buttons and active states
    document.querySelectorAll('.theme-option').forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        if (input) {
            const isActive = input.value === selectedTheme;
            option.classList.toggle('active', isActive);
            input.checked = isActive;
            
            // Update current badge
            const currentBadge = option.querySelector('.current-badge');
            const indicator = option.querySelector('.theme-indicator');
            
            if (isActive && !currentBadge && indicator) {
                indicator.innerHTML = '<span class="current-badge">Current</span>';
            } else if (!isActive && currentBadge) {
                currentBadge.remove();
            }
        }
    });
}

function applyThemeToDOM(theme) {
    const html = document.documentElement;
    const body = document.body;
    
    html.setAttribute('data-theme', theme);
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
    
    updateThemeCSS(theme);
    console.log(`✅ Applied theme ${theme} to DOM`);
}

function updateThemeCSS(theme) {
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
}

async function saveThemeToDatabase(theme) {
    try {
        const isInSubdirectory = window.location.pathname.includes('/pages/');
        const apiPath = isInSubdirectory ? '../php/api/user/update_settings.php' : 'php/api/user/update_settings.php';
        
        console.log(`🎨 Saving theme ${theme} to database via ${apiPath}`);
        
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                setting: 'theme',
                value: theme
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Theme saved to database successfully');
            localStorage.setItem('habitus-theme', theme);
            return true;
        } else {
            console.error('❌ API returned error:', data.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error saving theme to database:', error);
        return false;
    }
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
    
    // Language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            changeLanguage(this.value);
        });
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
 * Handle profile picture change with enhanced preview and caching fix
 * @param {HTMLInputElement} input - File input element
 */
function handleProfilePictureChange(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Basic validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('Please select a valid image (JPEG, PNG, or WebP)', 'error');
            return;
        }
        
        // Size validation (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size must be less than 5MB', 'error');
            return;
        }
        
        // Upload to server
        uploadProfilePicture(file);
    }
}

/**
 * FIXED: Upload profile picture with better error handling and debugging
 * @param {File} file - The file to upload
 */
async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    // Show loading state
    const overlay = document.querySelector('.profile-picture-overlay');
    const originalOverlayContent = overlay.innerHTML;
    overlay.innerHTML = '<div class="loading-spinner">Uploading...</div>';
    
    try {
        console.log('Starting upload for file:', file.name);
        
        const response = await fetch('../php/api/user/upload_profile_picture.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Upload response:', result);
        
        if (result.success) {
            console.log('Upload successful:', result);
            
            // Debug the paths
            if (result.debug_info) {
                console.log('Debug info:', result.debug_info);
            }
            
            // Build the complete image URL with cache busting
            const baseUrl = '../' + result.profile_picture_url;
            const cacheBuster = result.cache_buster || Date.now();
            const imageUrl = `${baseUrl}?v=${cacheBuster}`;
            
            console.log('New image URL:', imageUrl);
            
            // Test if the image URL is accessible before updating UI
            const testImage = new Image();
            testImage.onload = function() {
                console.log('✅ Image is accessible, updating UI');
                updateAllProfilePictures(imageUrl);
                showNotification('Profile picture updated successfully!', 'success');
            };
            
            testImage.onerror = function() {
                console.error('❌ Image not accessible at URL:', imageUrl);
                showNotification('Upload succeeded but image not accessible. Please refresh the page.', 'warning');
                
                // Try alternative URL constructions
                const altUrl1 = '/' + result.profile_picture_url + '?v=' + cacheBuster;
                const altUrl2 = result.profile_picture_url + '?v=' + cacheBuster;
                
                console.log('Trying alternative URL 1:', altUrl1);
                const testImage2 = new Image();
                testImage2.onload = function() {
                    console.log('✅ Alternative URL 1 works');
                    updateAllProfilePictures(altUrl1);
                };
                testImage2.onerror = function() {
                    console.log('Trying alternative URL 2:', altUrl2);
                    const testImage3 = new Image();
                    testImage3.onload = function() {
                        console.log('✅ Alternative URL 2 works');
                        updateAllProfilePictures(altUrl2);
                    };
                    testImage3.onerror = function() {
                        console.error('❌ All URL alternatives failed');
                        showNotification('Image uploaded but cannot be displayed. Please contact support.', 'error');
                    };
                    testImage3.src = altUrl2;
                };
                testImage2.src = altUrl1;
            };
            
            testImage.src = imageUrl;
            
            // Clear the file input
            const fileInput = document.getElementById('profile-picture-upload');
            if (fileInput) {
                fileInput.value = '';
            }
            
        } else {
            console.error('Upload failed:', result);
            showNotification(result.message || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Error uploading image: ' + error.message, 'error');
    } finally {
        // Restore overlay
        overlay.innerHTML = originalOverlayContent;
    }
}

/**
 * FIXED: Update all profile pictures across the site with proper cache busting
 * @param {string} newUrl - The new image URL with cache buster
 */
function updateAllProfilePictures(newUrl) {
    console.log('Updating all profile pictures to:', newUrl);
    
    // Define all possible profile picture selectors
    const selectors = [
        '.user-avatar img',              // Header profile picture
        '#profile-picture-preview',      // Settings page preview
        '.current-profile-picture img',  // Settings page current picture
        '.profile-picture',              // General profile pictures
        '.user-profile img',             // User profile sections
        '.profile-avatar img'            // Any other profile avatars
    ];
    
    let updatedCount = 0;
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                // Force reload by changing src
                element.src = '';
                setTimeout(() => {
                    element.src = newUrl;
                    updatedCount++;
                    console.log(`Updated profile picture: ${selector}`);
                }, 50);
            }
        });
    });
    
    console.log(`Total profile pictures updated: ${updatedCount}`);
    
    // Also update any profile pictures that might be loaded later
    window.currentProfilePictureUrl = newUrl;
}

/**
 * Change language with enhanced feedback
 * @param {string} language - Language code
 */
async function changeLanguage(languageCode) {
    const select = document.getElementById('language-selector');
    if (select) {
        select.disabled = true;
        select.style.opacity = '0.7';
    }
    
    try {
        // API call to update database
        const response = await fetch('../php/api/user/update_settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                setting: 'language',
                value: languageCode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            // Update local storage
            localStorage.setItem('userLanguage', languageCode);
            
            // Update translation manager (without duplicate API call)
            if (window.habitusTranslator) {
                await window.habitusTranslator.changeLanguage(languageCode);
            }
            
            // Show SINGLE notification
            showNotification(`🌐 Language changed to ${getLanguageName(languageCode)}`, 'success');
            
            // Reload page after delay to apply server-side language changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to update language preference');
        }
        
    } catch (error) {
        console.error('Language change error:', error);
        showNotification('❌ Failed to change language: ' + error.message, 'error');
        
        // Reset selector to previous value
        if (select) {
            const savedLanguage = localStorage.getItem('userLanguage') || 'en';
            select.value = savedLanguage;
        }
    } finally {
        if (select) {
            select.disabled = false;
            select.style.opacity = '1';
        }
    }
}

/**
 * Handle user logout
 */
function logoutUser() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        // Show loading notification
        showNotification('Logging out...', 'info');
        
        // Redirect to logout page
        window.location.href = '../pages/logout.php';
    }
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
 * Show change email modal
 */
function showChangeEmailModal() {
    const modal = document.getElementById('email-modal');
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
    
    if (newPassword.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (!/(?=.*[a-z])/.test(newPassword)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(newPassword)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(newPassword)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/.test(newPassword)) {
        errors.push('Password must contain at least one special character');
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
 * Export user data
 */
function exportUserData() {
    showNotification('Preparing your data export...', 'info');
    
    fetch('../php/api/user/export_data.php', {
        method: 'POST'
    })
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
        
        // Clear service worker cache if available
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        showNotification('Cache cleared. Refreshing...', 'success');
        setTimeout(() => {
            window.location.reload(true);
        }, 1500);
    }
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
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
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
    
    notification.style.cssText = `
        background: var(--bg-panel);
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px var(--shadow);
        transform: translateX(400px);
        transition: transform 0.3s;
        max-width: 300px;
        border: 1px solid var(--border-primary);
        display: flex;
        align-items: center;
        gap: 10px;
        border-left: 4px solid ${type === 'success' ? 'var(--success)' : 
                                 type === 'error' ? 'var(--error)' : 
                                 type === 'warning' ? 'var(--warning)' : 
                                 'var(--info)'};
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
    
    // Make notification clickable to dismiss
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
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

// Translation-related functions for settings page

// Load translation settings on page load
document.addEventListener('DOMContentLoaded', function() {
    loadTranslationSettings();
    loadUsageStats();
});

function loadTranslationSettings() {
    // Load auto-translation preference
    const autoTranslation = localStorage.getItem('translationEnabled') === 'true';
    const autoTranslationToggle = document.getElementById('auto-translation');
    if (autoTranslationToggle) {
        autoTranslationToggle.checked = autoTranslation;
    }
    
    // Load high-quality translation preference
    const highQuality = localStorage.getItem('highQualityTranslation') === 'true';
    const highQualityToggle = document.getElementById('high-quality-translation');
    if (highQualityToggle) {
        highQualityToggle.checked = highQuality;
    }
}

async function loadUsageStats() {
    try {
        const response = await fetch('../php/api/translation/stats.php');
        const data = await response.json();
        
        if (data.success && data.stats) {
            updateUsageDisplay(data.stats);
        }
    } catch (error) {
        console.error('Failed to load usage stats:', error);
        updateUsageDisplay(null);
    }
}

function updateUsageDisplay(stats) {
    const charactersUsed = document.getElementById('characters-used');
    const apiCalls = document.getElementById('api-calls');
    const freeTierRemaining = document.getElementById('free-tier-remaining');
    
    if (!stats) {
        if (charactersUsed) charactersUsed.textContent = 'N/A';
        if (apiCalls) apiCalls.textContent = 'N/A';
        if (freeTierRemaining) freeTierRemaining.textContent = 'N/A';
        return;
    }
    
    const totalCharacters = stats.total_characters || 0;
    const totalCalls = stats.total_calls || 0;
    const freeLimit = 2000000; // 2M characters for Azure free tier
    const remaining = Math.max(0, freeLimit - totalCharacters);
    
    if (charactersUsed) {
        charactersUsed.textContent = formatNumber(totalCharacters);
    }
    
    if (apiCalls) {
        apiCalls.textContent = formatNumber(totalCalls);
    }
    
    if (freeTierRemaining) {
        freeTierRemaining.textContent = formatNumber(remaining);
        freeTierRemaining.style.color = remaining < 100000 ? 'var(--error-text)' : 'var(--success-text)';
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

function getLanguageName(langCode) {
    const names = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'it': 'Italiano',
        'pt': 'Português',
        'ru': 'Русский',
        'ja': '日本語',
        'ko': '한국어',
        'zh': '中文'
    };
    return names[langCode] || langCode.toUpperCase();
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// FIXED: Export theme manager access for global use - no redeclaration
window.getSettingsThemeManager = getThemeManager;

// Initialize profile picture system when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load auto-translation state
    const autoTranslationCheckbox = document.getElementById('auto-translation');
    if (autoTranslationCheckbox) {
        const isEnabled = localStorage.getItem('translationEnabled') === 'true';
        autoTranslationCheckbox.checked = isEnabled;
    }
    
    // Load language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        const savedLanguage = localStorage.getItem('userLanguage') || 'en';
        languageSelector.value = savedLanguage;
        
        languageSelector.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
});

console.log('✅ Settings script loaded with all functionality');