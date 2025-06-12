// js/header.js - Updated theme toggle function

document.addEventListener('DOMContentLoaded', function() {
    // Toggle notifications dropdown
    const messagesToggle = document.getElementById('messages-toggle');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const closeNotifications = document.getElementById('close-notifications');
    
    if (messagesToggle && notificationsDropdown) {
        messagesToggle.addEventListener('click', function(e) {
            e.preventDefault();
            notificationsDropdown.classList.toggle('show');
            
            // If showing dropdown, mark notifications as read
            if (notificationsDropdown.classList.contains('show')) {
                markNotificationsAsRead();
            }
        });
        
        // Close when clicking the X button
        if (closeNotifications) {
            closeNotifications.addEventListener('click', function() {
                notificationsDropdown.classList.remove('show');
            });
        }
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!messagesToggle.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.remove('show');
            }
        });
    }
    
    // Handle notification clicks
    const notificationItems = document.querySelectorAll('.notification-item');
    const updateModal = document.getElementById('update-modal');
    
    notificationItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking the delete button
            if (e.target.closest('.delete-notification')) {
                return;
            }
            
            const action = this.getAttribute('data-action');
            
            if (action === 'popup') {
                // Show update modal
                if (updateModal) {
                    const title = this.querySelector('.notification-title').textContent;
                    const message = this.querySelector('.notification-message').textContent;
                    
                    document.getElementById('update-title').textContent = title;
                    document.getElementById('update-message').textContent = message;
                    
                    // Get full update details via AJAX
                    const updateId = this.getAttribute('data-id');
                    fetchUpdateDetails(updateId);
                    
                    updateModal.classList.add('show');
                }
            } else if (action === 'redirect') {
                // Redirect to task page
                const redirectUrl = this.getAttribute('data-redirect');
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            }
        });
    });
    
    // Close update modal
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-button');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (updateModal) {
                updateModal.classList.remove('show');
            }
        });
    });
    
    // Delete notification
    const deleteButtons = document.querySelectorAll('.delete-notification');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const notificationId = this.getAttribute('data-id');
            const notificationItem = this.closest('.notification-item');
            
            // Delete via AJAX
            deleteNotification(notificationId, notificationItem);
        });
    });
});

/**
 * Mark notifications as read via AJAX
 */
function markNotificationsAsRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    if (unreadItems.length === 0) return;
    
    const notificationIds = Array.from(unreadItems).map(item => item.getAttribute('data-id'));
    
    fetch('../php/api/user/mark_notifications_read.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            notification_ids: notificationIds
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove unread class and notification badge
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('Error marking notifications as read:', error);
    });
}

/**
 * Fetch update details for modal
 */
function fetchUpdateDetails(updateId) {
    fetch(`../php/api/user/get_update_details.php?id=${updateId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.details) {
                document.getElementById('update-details').innerHTML = data.details;
            }
        })
        .catch(error => {
            console.error('Error fetching update details:', error);
        });
}

/**
 * Delete notification
 */
function deleteNotification(notificationId, notificationItem) {
    fetch('../php/api/user/delete_notification.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            notification_id: notificationId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove notification from DOM with animation
            notificationItem.style.opacity = '0';
            notificationItem.style.height = '0';
            setTimeout(() => {
                notificationItem.remove();
                
                // Check if list is now empty
                const notificationsList = document.querySelector('.notifications-list');
                if (notificationsList && notificationsList.children.length === 0) {
                    notificationsList.innerHTML = '<div class="empty-notifications">No notifications to display</div>';
                }
                
                // Update badge count
                updateNotificationBadge();
            }, 300);
        }
    })
    .catch(error => {
        console.error('Error deleting notification:', error);
    });
}

/**
 * Update notification badge count
 */
function updateNotificationBadge() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadItems.length > 0) {
            badge.textContent = unreadItems.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * FIXED: Enhanced theme toggle function with proper persistence
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    console.log(`🎨 Toggling theme from ${currentTheme} to ${newTheme}`);
    
    // Show loading state
    const button = document.querySelector('.theme-toggle-button');
    if (button) {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.7';
    }
    
    // Apply theme immediately to DOM for instant feedback
    applyThemeToDOM(newTheme);
    
    // Save theme to database
    saveThemeToDatabase(newTheme).then(success => {
        if (button) {
            button.style.pointerEvents = '';
            button.style.opacity = '';
        }
        
        if (success) {
            console.log(`✅ Theme ${newTheme} saved successfully`);
            // Update localStorage as backup
            localStorage.setItem('habitus-theme', newTheme);
            
            // Dispatch custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: newTheme }
            }));
        } else {
            console.error('❌ Failed to save theme to database');
            // Revert theme if save failed
            applyThemeToDOM(currentTheme);
        }
    });
}

/**
 * Apply theme to DOM immediately
 */
function applyThemeToDOM(theme) {
    const html = document.documentElement;
    const body = document.body;
    
    // Update data attribute
    html.setAttribute('data-theme', theme);
    
    // Update body classes
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
    
    // Update theme CSS file
    updateThemeCSS(theme);
    
    console.log(`✅ Applied theme ${theme} to DOM`);
}

/**
 * Update theme CSS file
 */
function updateThemeCSS(theme) {
    let themeStylesheet = document.getElementById('theme-stylesheet');
    
    if (!themeStylesheet) {
        themeStylesheet = document.createElement('link');
        themeStylesheet.id = 'theme-stylesheet';
        themeStylesheet.rel = 'stylesheet';
        document.head.appendChild(themeStylesheet);
    }
    
    // Determine correct path
    const isInSubdirectory = window.location.pathname.includes('/pages/');
    const basePath = isInSubdirectory ? '../css/themes/' : 'css/themes/';
    themeStylesheet.href = `${basePath}${theme}.css`;
}

/**
 * Save theme to database via API
 */
async function saveThemeToDatabase(theme) {
    try {
        // Determine correct API path
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

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme toggle ready with current theme:', window.initialTheme);
    
    // Ensure theme is properly applied
    if (window.initialTheme) {
        applyThemeToDOM(window.initialTheme);
    }
});

// Listen for theme changes from other components
window.addEventListener('themeChanged', function(e) {
    console.log('Theme changed to:', e.detail.theme);
});