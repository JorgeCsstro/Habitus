// js/header.js

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

function toggleTheme() {
    if (window.themeManager) {
        const currentTheme = window.themeManager.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Add loading state
        const button = document.querySelector('.theme-toggle-button');
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.7';
        
        // Change theme
        window.themeManager.setTheme(newTheme);
        
        // Re-enable button after animation
        setTimeout(() => {
            button.style.pointerEvents = '';
            button.style.opacity = '';
        }, 500);
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Switched to ${newTheme} theme`, 'success');
        }
    } else {
        console.error('Theme manager not available');
    }
}

// The enhanced version doesn't need manual icon updates since CSS handles it
document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme toggle ready with current theme:', window.initialTheme);
});

// Listen for theme changes
window.addEventListener('themeChanged', function(e) {
    console.log('Theme changed to:', e.detail.theme);
});