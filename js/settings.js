// settings.js - Settings page functionality

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form listeners
    setupFormListeners();
    
    // Load saved preferences
    loadSavedPreferences();
});

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
    
    document.getElementById('email-notifications').checked = emailNotifications;
    document.getElementById('task-reminders').checked = taskReminders;
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
        
        // Create FormData
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        // Show loading state
        const preview = document.getElementById('profile-picture-preview');
        preview.style.opacity = '0.5';
        
        // Upload image
        fetch('../php/api/user/upload_profile_picture.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            preview.style.opacity = '1';
            
            if (data.success) {
                // Update preview
                preview.src = data.image_url;
                
                // Update profile picture in header if exists
                const headerAvatar = document.querySelector('.user-avatar img');
                if (headerAvatar) {
                    headerAvatar.src = data.image_url;
                }
                
                showNotification('Profile picture updated successfully');
            } else {
                showNotification(data.message || 'Error uploading image', 'error');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            preview.style.opacity = '1';
            showNotification('Error uploading image', 'error');
        });
    }
}

/**
 * Change language
 * @param {string} language - Language code
 */
function changeLanguage(language) {
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
        if (data.success) {
            showNotification('Language updated. Page will reload...');
            // Reload page to apply language change
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Error updating language', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating language', 'error');
    });
}

/**
 * Change theme
 * @param {string} theme - Theme name (light/dark)
 */
function changeTheme(theme) {
    // Update theme immediately
    document.body.className = 'theme-' + theme;
    
    // Update theme stylesheet
    const themeStylesheet = document.getElementById('theme-stylesheet');
    if (themeStylesheet) {
        themeStylesheet.href = `../css/themes/${theme}.css`;
    }
    
    // Update active theme option
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.theme-option input[value="${theme}"]`).parentElement.classList.add('active');
    
    // Save theme preference
    fetch('../php/api/user/update_settings.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            setting: 'theme',
            value: theme
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Theme updated successfully');
        } else {
            showNotification(data.message || 'Error updating theme', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating theme', 'error');
    });
}

/**
 * Show change password modal
 */
function showChangePasswordModal() {
    document.getElementById('password-modal').style.display = 'flex';
}

/**
 * Show change email modal
 */
function showChangeEmailModal() {
    document.getElementById('email-modal').style.display = 'flex';
}

/**
 * Show delete account modal
 */
function showDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'flex';
}

/**
 * Close modal
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset form
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
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
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    // Validate password length
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.save-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
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
        submitBtn.textContent = 'Update Password';
        
        if (data.success) {
            showNotification('Password updated successfully');
            closeModal('password-modal');
        } else {
            showNotification(data.message || 'Error updating password', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
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
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
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
        submitBtn.textContent = 'Update Email';
        
        if (data.success) {
            showNotification('Email updated successfully');
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
        submitBtn.textContent = 'Update Email';
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
    
    // Validate confirmation
    if (confirmation !== 'DELETE') {
        showNotification('Please type DELETE to confirm', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.delete-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Deleting...';
    
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
            showNotification('Account deleted. Redirecting...');
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 2000);
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Delete My Account';
            showNotification(data.message || 'Error deleting account', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Delete My Account';
        showNotification('Error deleting account', 'error');
    });
}

/**
 * Toggle email notifications
 * @param {boolean} enabled - Whether notifications are enabled
 */
function toggleEmailNotifications(enabled) {
    localStorage.setItem('emailNotifications', enabled);
    
    // Update server preference
    updateNotificationPreference('email_notifications', enabled);
}

/**
 * Toggle task reminders
 * @param {boolean} enabled - Whether reminders are enabled
 */
function toggleTaskReminders(enabled) {
    localStorage.setItem('taskReminders', enabled);
    
    // Update server preference
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
        if (!data.success) {
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
    showNotification('Preparing your data export...');
    
    fetch('../php/api/user/export_data.php')
        .then(response => response.blob())
        .then(blob => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habitus_zone_data_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            showNotification('Data exported successfully');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error exporting data', 'error');
        });
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'success') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});