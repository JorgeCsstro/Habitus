// dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any necessary dashboard components
    initializeDashboard();
    
    // Set up event listeners for task completion and other interactions
    setupEventListeners();
});

/**
 * Initialize the dashboard components
 */
function initializeDashboard() {
    // Create dotted lines for task items
    createDottedLines();
    
    // Initialize any other dashboard components as needed
}

/**
 * Create dotted lines for daily, goal, and challenge items
 */
function createDottedLines() {
    const dotElements = document.querySelectorAll('.daily-dots, .goal-dots, .challenge-dots');
    dotElements.forEach(dotElement => {
        // Ensure proper dotted line width based on available space
        updateDottedLine(dotElement);
    });
    
    // Update dotted lines when window is resized
    window.addEventListener('resize', function() {
        dotElements.forEach(dotElement => {
            updateDottedLine(dotElement);
        });
    });
}

/**
 * Update a dotted line element's width
 * @param {HTMLElement} dotElement - The dot element to update
 */
function updateDottedLine(dotElement) {
    // The dotted line will adjust its width based on container
    const itemWidth = dotElement.parentNode.offsetWidth;
    const titleWidth = dotElement.previousElementSibling.offsetWidth;
    const buttonWidth = dotElement.nextElementSibling.offsetWidth;
    
    // Leave some space for the dot element
    dotElement.style.width = (itemWidth - titleWidth - buttonWidth - 40) + 'px';
}

/**
 * Set up event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Task completion buttons
    const completeButtons = document.querySelectorAll('.complete-button');
    completeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default form submission
            const taskId = this.getAttribute('data-id');
            const taskType = this.closest('li').className.includes('daily') ? 'daily' : 
                             this.closest('li').className.includes('goal') ? 'goal' : 'challenge';
            
            // Toggle completion visual state (will be updated from server response)
            this.classList.toggle('completed');
            this.closest('li').classList.toggle('completed');
            
            // Make API call to update task completion
            updateTaskCompletion(taskId, taskType);
        });
    });
    
    // Room switching functionality
    const roomThumbnails = document.querySelectorAll('.room-thumbnail');
    roomThumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const roomId = this.getAttribute('data-id');
            switchRoom(roomId);
        });
    });
}

/**
 * Update task completion status via API (Enhanced with subtask checking)
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task (daily, goal, or challenge)
 */
function updateTaskCompletion(taskId, taskType) {
    const button = document.querySelector(`.complete-button[data-id="${taskId}"]`);
    
    // Check for subtasks first (for goals and challenges)
    if (taskType === 'goal' || taskType === 'challenge') {
        // Check if task has subtasks
        fetch(`../php/api/tasks/subtasks.php?task_id=${taskId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const subtasks = data.subtasks;
                    
                    // If no subtasks, proceed with completion
                    if (subtasks.length === 0) {
                        proceedWithDashboardCompletion(button, taskId, taskType);
                        return;
                    }
                    
                    // Check if all subtasks are completed
                    const allCompleted = subtasks.every(subtask => subtask.is_completed == 1);
                    
                    if (allCompleted) {
                        proceedWithDashboardCompletion(button, taskId, taskType);
                    } else {
                        // Show subtasks modal - need to open tasks page or show modal
                        showDashboardSubtasksModal(taskId, taskType, subtasks);
                    }
                } else {
                    // If error fetching subtasks, proceed anyway
                    proceedWithDashboardCompletion(button, taskId, taskType);
                }
            })
            .catch(error => {
                console.error('Error checking subtasks:', error);
                // If error, proceed anyway
                proceedWithDashboardCompletion(button, taskId, taskType);
            });
    } else {
        // For dailies, proceed directly
        proceedWithDashboardCompletion(button, taskId, taskType);
    }
}

/**
 * Proceed with actual task completion
 * @param {HTMLElement} button - The completion button
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task
 */
function proceedWithDashboardCompletion(button, taskId, taskType) {
    // Show loading state
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="loading">Processing...</span>';
    button.disabled = true;
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('task_type', taskType);
    
    // Send API request
    fetch('../php/api/tasks/complete.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI immediately
            button.classList.add('completed');
            button.closest('li').classList.add('completed');
            button.innerHTML = '✓ Completed';
            button.disabled = true;
            
            // Update HCoin balance if available
            if (data.new_balance) {
                const hcoinElement = document.querySelector('.hcoin-balance span');
                if (hcoinElement) {
                    hcoinElement.textContent = new Intl.NumberFormat().format(data.new_balance);
                }
            }
            
            // Show HCoin notification
            if (data.hcoins_earned && data.hcoins_earned > 0) {
                showHCoinEarnedNotification(data.hcoins_earned);
            }
        } else {
            // Handle error - revert UI changes
            console.error('Error updating task completion:', data.message);
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('completed');
            button.closest('li').classList.remove('completed');
            
            // Show error notification
            showNotification('Error completing task: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('API request failed:', error);
        // Revert UI changes
        button.innerHTML = originalText;
        button.disabled = false;
        button.classList.remove('completed');
        button.closest('li').classList.remove('completed');
        
        showNotification('Network error. Please try again.', 'error');
    });
}

/**
 * Show subtasks modal for dashboard
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task
 * @param {Array} subtasks - Array of subtasks
 */
function showDashboardSubtasksModal(taskId, taskType, subtasks) {
    // Show notification
    showNotification('Complete all subtasks before completing the main task', 'warning');
    
    // If subtasks modal exists on dashboard, show it
    const modal = document.getElementById('subtasks-modal');
    if (modal) {
        // Load subtasks into modal
        loadSubtasksInModal(taskId, taskType, subtasks);
        modal.classList.add('show');
    } else {
        // Redirect to tasks page with modal open
        window.location.href = `tasks.php?show_subtasks=${taskId}&type=${taskType}`;
    }
}

/**
 * Load subtasks into the dashboard modal
 * @param {number} taskId - ID of the parent task
 * @param {string} taskType - Type of task
 * @param {Array} subtasks - Array of subtasks
 */
function loadSubtasksInModal(taskId, taskType, subtasks) {
    const subtasksList = document.getElementById('dashboard-subtasks-list');
    const modalTitle = document.getElementById('subtasks-modal-title');
    
    // Update modal title
    modalTitle.textContent = `Manage Subtasks (${taskType.charAt(0).toUpperCase() + taskType.slice(1)})`;
    
    // Clear existing content
    subtasksList.innerHTML = '';
    
    if (subtasks.length === 0) {
        subtasksList.innerHTML = '<div class="empty-subtasks">No subtasks yet.</div>';
        updateDashboardSubtaskProgress(0, 0);
        return;
    }
    
    // Add each subtask
    subtasks.forEach(subtask => {
        const subtaskItem = document.createElement('div');
        subtaskItem.className = `subtask-item ${subtask.is_completed == 1 ? 'completed' : ''}`;
        
        subtaskItem.innerHTML = `
            <div class="subtask-content">
                <input type="checkbox" 
                       id="dashboard-subtask-${subtask.id}" 
                       ${subtask.is_completed == 1 ? 'checked' : ''}
                       onchange="toggleDashboardSubtask(${subtask.id}, this.checked)">
                <label for="dashboard-subtask-${subtask.id}" class="subtask-label">
                    <span class="subtask-title">${escapeHtml(subtask.title)}</span>
                    ${subtask.description ? `<span class="subtask-description">${escapeHtml(subtask.description)}</span>` : ''}
                </label>
            </div>
        `;
        
        subtasksList.appendChild(subtaskItem);
    });
    
    // Update progress
    const completed = subtasks.filter(s => s.is_completed == 1).length;
    updateDashboardSubtaskProgress(completed, subtasks.length);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


/**
 * Toggle subtask completion in dashboard
 * @param {number} subtaskId - ID of the subtask
 * @param {boolean} completed - New completion status
 */
function toggleDashboardSubtask(subtaskId, completed) {
    const subtaskElement = document.querySelector(`#dashboard-subtask-${subtaskId}`).closest('.subtask-item');
    
    // Apply visual change immediately
    if (completed) {
        subtaskElement.classList.add('completed');
    } else {
        subtaskElement.classList.remove('completed');
    }
    
    // Send API request
    fetch('../php/api/tasks/subtasks.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'update',
            subtask_id: subtaskId,
            completed: completed
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update progress
            const checkboxes = document.querySelectorAll('#dashboard-subtasks-list input[type="checkbox"]');
            const total = checkboxes.length;
            const completedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            updateDashboardSubtaskProgress(completedCount, total);
            
            // If all completed, show notification
            if (data.all_completed && completed) {
                showNotification('All subtasks completed! You can now complete the main task.', 'success');
            }
        } else {
            // Revert change
            const checkbox = document.querySelector(`#dashboard-subtask-${subtaskId}`);
            checkbox.checked = !completed;
            if (completed) {
                subtaskElement.classList.remove('completed');
            } else {
                subtaskElement.classList.add('completed');
            }
            showNotification('Error updating subtask', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Revert change
        const checkbox = document.querySelector(`#dashboard-subtask-${subtaskId}`);
        checkbox.checked = !completed;
        showNotification('Network error', 'error');
    });
}

/**
 * Update subtask progress display
 * @param {number} completed - Number of completed subtasks
 * @param {number} total - Total number of subtasks
 */
function updateDashboardSubtaskProgress(completed, total) {
    const progressBar = document.querySelector('#subtasks-modal .progress');
    const progressText = document.querySelector('#subtasks-modal .progress-text');
    
    if (!progressBar || !progressText) return;
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    progressBar.style.width = percentage + '%';
    progressText.innerHTML = `
        <span>${completed} / ${total} subtasks</span>
        <span class="percentage">${percentage}%</span>
    `;
}

/**
 * Close dashboard subtasks modal
 */
function closeDashboardSubtasksModal() {
    const modal = document.getElementById('subtasks-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 */
function showNotification(message, type = 'success') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        // Create container if it doesn't exist
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#f44336'};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transform: translateX(300px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(300px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

/**
 * Update UI elements after task completion
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task
 * @param {Object} data - Response data from server
 */
function updateUIAfterCompletion(taskId, taskType, data) {
    // Update HCoin balance if provided
    if (data.new_balance) {
        const hcoinBalance = document.querySelector('.hcoin-balance span');
        if (hcoinBalance) {
            hcoinBalance.textContent = new Intl.NumberFormat().format(data.new_balance);
        }
    }
    
    // Update streak information for dailies if provided
    if (taskType === 'daily' && data.streak) {
        // Optionally update streak visualization if implemented
        console.log(`Daily streak: ${data.streak}`);
    }
    
    // If task was removed after completion, remove from UI
    if (data.removed) {
        const taskItem = document.querySelector(`.complete-button[data-id="${taskId}"]`).closest('li');
        if (taskItem) {
            // Fade out and remove
            taskItem.style.opacity = '0';
            setTimeout(() => {
                taskItem.remove();
                // Check if list is now empty and show empty message if needed
                checkEmptyList(taskType);
            }, 300);
        }
    }
}

/**
 * Check if a task list is empty and show appropriate message
 * @param {string} taskType - Type of task list to check
 */
function checkEmptyList(taskType) {
    const listSelector = taskType === 'daily' ? '.dailies-list' : 
                         taskType === 'goal' ? '.goals-list' : '.challenges-list';
    const list = document.querySelector(listSelector);
    
    if (list && list.children.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        
        if (taskType === 'daily') {
            emptyMessage.textContent = 'No dailies found. Add some to get started!';
        } else if (taskType === 'goal') {
            emptyMessage.textContent = 'No goals found. Add some to track your progress!';
        } else {
            emptyMessage.textContent = 'No challenges found. Try something new!';
        }
        
        // Replace list with empty message
        list.parentNode.insertBefore(emptyMessage, list);
        list.style.display = 'none';
    }
}

/**
 * Show notification when HCoins are earned
 * @param {number} amount - Amount of HCoins earned
 */
function showHCoinEarnedNotification(amount) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'hcoin-notification';
    notification.innerHTML = `
        <img src="../images/icons/hcoin.svg" alt="HCoin">
        <span>+${amount} HCoins earned!</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

/**
 * Switch to a different room in the habitus preview
 * @param {number} roomId - ID of the room to switch to
 */
function switchRoom(roomId) {
    // Update active room thumbnail
    const roomThumbnails = document.querySelectorAll('.room-thumbnail');
    roomThumbnails.forEach(thumbnail => {
        thumbnail.classList.remove('active');
        if (thumbnail.getAttribute('data-id') == roomId) {
            thumbnail.classList.add('active');
        }
    });
    
    // Make API request to get room data
    fetch(`../php/api/habitus/room_data.php?room_id=${roomId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update room preview
            updateRoomPreview(data.room);
        } else {
            console.error('Error fetching room data:', data.message);
        }
    })
    .catch(error => {
        console.error('API request failed:', error);
    });
}

/**
 * Update the room preview with new room data
 * @param {Object} roomData - Data for the room to display
 */
function updateRoomPreview(roomData) {
    const preview = document.querySelector('.habitus-preview');
    
    if (roomData.preview_image) {
        // If there's a pre-rendered preview image, use it
        if (preview.querySelector('img')) {
            preview.querySelector('img').src = roomData.preview_image;
        } else {
            // Clear any existing content and add image
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = roomData.preview_image;
            img.alt = roomData.name;
            preview.appendChild(img);
        }
    } else {
        // Otherwise render the room with CSS
        preview.innerHTML = `
            <div class="default-room">
                <div class="room-isometric">
                    <div class="room-floor" style="background-color: ${roomData.floor_color || '#FFD700'}"></div>
                    <div class="room-wall-left" style="background-color: ${roomData.wall_color || '#E0E0E0'}"></div>
                    <div class="room-wall-right" style="background-color: ${roomData.wall_color_alt || '#D0D0D0'}"></div>
                    <div class="room-window"></div>
                    <div class="room-door"></div>
                </div>
            </div>
        `;
        
        // Render placed items if available
        if (roomData.items && roomData.items.length > 0) {
            renderRoomItems(roomData.items);
        }
    }
}

/**
 * Render items placed in a room
 * @param {Array} items - Array of item data to render
 */
function renderRoomItems(items) {
    const roomElement = document.querySelector('.room-isometric');
    if (!roomElement) return;
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'room-item';
        itemElement.style.cssText = `
            position: absolute;
            left: ${item.position_x}%;
            top: ${item.position_y}%;
            width: ${item.width || 10}%;
            height: ${item.height || 10}%;
            background-image: url('${item.image_path}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            transform: rotate(${item.rotation || 0}deg) scale(${item.scale || 1});
            z-index: ${item.z_index || 1};
        `;
        
        roomElement.appendChild(itemElement);
    });
}

/**
 * Complete a daily task
 * @param {number} taskId - ID of the daily task
 */
function completeDaily(taskId) {
    const button = document.querySelector(`.complete-button[data-id="${taskId}"]`);
    if (button && !button.classList.contains('completing')) {
        button.classList.add('completing');
        updateTaskCompletion(taskId, 'daily');
    }
}

/**
 * Complete a goal task
 * @param {number} taskId - ID of the goal task
 */
function completeGoal(taskId) {
    const button = document.querySelector(`.complete-button[data-id="${taskId}"]`);
    if (button && !button.classList.contains('completing')) {
        button.classList.add('completing');
        updateTaskCompletion(taskId, 'goal');
    }
}

/**
 * Complete a challenge task
 * @param {number} taskId - ID of the challenge task
 */
function completeChallenge(taskId) {
    const button = document.querySelector(`.complete-button[data-id="${taskId}"]`);
    if (button && !button.classList.contains('completing')) {
        button.classList.add('completing');
        updateTaskCompletion(taskId, 'challenge');
    }
}