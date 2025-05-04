// Dashboard.js - Functionality for the home dashboard

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
 * Update task completion status via API
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task (daily, goal, or challenge)
 */
function updateTaskCompletion(taskId, taskType) {
    // Create form data for the API request
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('task_type', taskType);
    
    // Determine the appropriate API endpoint
    let apiEndpoint = '';
    if (taskType === 'daily') {
        apiEndpoint = 'php/api/tasks/dailies.php';
    } else if (taskType === 'goal') {
        apiEndpoint = 'php/api/tasks/goals.php';
    } else {
        apiEndpoint = 'php/api/tasks/challenges.php';
    }
    
    // Send API request
    fetch(apiEndpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI based on server response
            updateUIAfterCompletion(taskId, taskType, data);
            
            // If HCoins were earned, show notification
            if (data.hcoins_earned && data.hcoins_earned > 0) {
                showHCoinEarnedNotification(data.hcoins_earned);
            }
        } else {
            // Handle error
            console.error('Error updating task completion:', data.message);
            // Revert UI changes if needed
            const button = document.querySelector(`.complete-button[data-id="${taskId}"]`);
            if (button) {
                button.classList.toggle('completed');
                button.closest('li').classList.toggle('completed');
            }
        }
    })
    .catch(error => {
        console.error('API request failed:', error);
    });
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
        const taskItem = document.querySelector(`[data-id="${taskId}"]`).closest('li');
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
        <img src="images/icons/hcoin.svg" alt="HCoin">
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
    fetch(`php/api/habitus/room_data.php?room_id=${roomId}`)
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