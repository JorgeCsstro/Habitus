// tasks.js - JavaScript functionality for the tasks page

// Global variables to store task being modified
let currentTaskId = 0;
let currentTaskType = '';
let deleteTaskId = 0;
let deleteTaskType = '';

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize task form
    initializeTaskForm();
    
    // Check if we need to open a specific tab based on URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('tab')) {
        changeTab(urlParams.get('tab'));
    }
    
    // Check if we need to open the create form with a specific type
    if (urlParams.has('add')) {
        openTaskModal(urlParams.get('add'));
    }
    
    // Create notification container if it doesn't exist
    if (!document.querySelector('.notification-container')) {
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Create task button
    const createTaskBtn = document.getElementById('create-task-button');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', function() {
            openTaskModal('daily');
        });
    }
    
    // Task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTask();
        });
    }
    
    // Listen for task type changes
    const taskTypeInput = document.getElementById('task-type');
    if (taskTypeInput) {
        taskTypeInput.addEventListener('change', function() {
            updateTaskTypeFields();
        });
    }
    
    // Reward calculation listeners
    const difficultySelect = document.getElementById('difficulty');
    const durationInput = document.getElementById('duration');
    
    if (difficultySelect && durationInput) {
        difficultySelect.addEventListener('change', updateRewardCalculation);
        durationInput.addEventListener('input', updateRewardCalculation);
    }
    
    // Delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteTask);
    }
}

/**
 * Initialize task form with default values
 */
function initializeTaskForm() {
    // Set default dates for goals and challenges
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedNextWeek = nextWeek.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    
    if (startDateInput) startDateInput.value = formattedToday;
    if (endDateInput) endDateInput.value = formattedNextWeek;
    
    // Calculate initial reward
    updateRewardCalculation();
}

/**
 * Change tab and update URL
 * @param {string} tabName - Name of the tab to show
 */
function changeTab(tabName) {
    // Validate tab name
    if (!['dailies', 'goals', 'challenges'].includes(tabName)) {
        tabName = 'dailies';
    }
    
    // Hide all tabs and show the selected one
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`.tab[onclick="changeTab('${tabName}')"]`).classList.add('active');
    
    // Update URL without reloading page
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.pushState({}, '', url);
}

/**
 * Open modal to create or edit a task
 * @param {string} taskType - Type of task (daily, goal, or challenge)
 * @param {number} taskId - ID of the task to edit (0 for new task)
 */
function openTaskModal(taskType, taskId = 0) {
    // Reset form
    document.getElementById('task-form').reset();
    
    // Set task type and ID
    currentTaskId = taskId;
    currentTaskType = taskType;
    document.getElementById('task-id').value = taskId;
    document.getElementById('task-type').value = taskType;
    
    // Update modal title
    const isNew = taskId === 0;
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = isNew 
        ? `Create New ${capitalizeFirstLetter(taskType)}` 
        : `Edit ${capitalizeFirstLetter(taskType)}`;
    
    // Show appropriate fields based on task type
    updateTaskTypeFields();
    
    // If editing, load task data
    if (!isNew) {
        loadTaskData(taskId, taskType);
    } else {
        // Set default dates for new tasks
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedNextWeek = nextWeek.toISOString().split('T')[0];
        
        // Set default values based on task type
        if (taskType === 'challenge') {
            document.getElementById('start_date').value = formattedToday;
            document.getElementById('end_date').value = formattedNextWeek;
        }
    }
    
    // Show modal
    const modal = document.getElementById('task-modal');
    modal.classList.add('show');
    
    // Focus on the title field
    setTimeout(() => {
        document.getElementById('title').focus();
    }, 300);
}

/**
 * Close the task modal
 */
function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('show');
}

/**
 * Update visible fields based on task type
 */
function updateTaskTypeFields() {
    const taskType = document.getElementById('task-type').value;
    
    // Hide all type-specific fields
    document.querySelectorAll('.type-specific-fields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Show fields for the selected type
    document.getElementById(taskType + '-fields').style.display = 'block';
    
    // Update reward calculation with appropriate multiplier
    updateRewardCalculation();
}

/**
 * Update reward calculation based on form values
 */
function updateRewardCalculation() {
    const difficulty = document.getElementById('difficulty').value;
    const duration = parseInt(document.getElementById('duration').value);
    const taskType = document.getElementById('task-type').value;
    
    // Base reward based on difficulty
    let baseReward = 10; // Default
    switch (difficulty) {
        case 'easy': baseReward = 10; break;
        case 'medium': baseReward = 20; break;
        case 'hard': baseReward = 35; break;
        case 'expert': baseReward = 50; break;
    }
    
    // Duration multiplier
    let durationMultiplier = 1;
    if (duration >= 60) {
        durationMultiplier = 1.5;
    } else if (duration >= 30) {
        durationMultiplier = 1.25;
    }
    
    // Type multiplier
    let typeMultiplier = 1;
    switch (taskType) {
        case 'daily': typeMultiplier = 1; break;
        case 'goal': typeMultiplier = 1.5; break;
        case 'challenge': typeMultiplier = 2; break;
    }
    
    // Calculate final reward
    const finalReward = Math.round(baseReward * durationMultiplier * typeMultiplier);
    
    // Update display
    document.getElementById('base-reward').textContent = baseReward;
    document.getElementById('duration-multiplier').textContent = durationMultiplier.toFixed(2);
    document.getElementById('type-multiplier').textContent = typeMultiplier.toFixed(2);
    document.getElementById('reward-amount').textContent = finalReward;
}

/**
 * Load task data for editing
 * @param {number} taskId - ID of the task to load
 * @param {string} taskType - Type of task (daily, goal, or challenge)
 */
function loadTaskData(taskId, taskType) {
    // In a real implementation, this would fetch data from the server
    // For this example, we're simulating loading data
    
    // Show loading state
    const saveBtn = document.getElementById('save-task-btn');
    saveBtn.textContent = 'Loading...';
    saveBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // This is where you would normally make an AJAX request to get task data
        // For this example, we'll use dummy data
        let taskData = {
            id: taskId,
            title: `Sample ${taskType} ${taskId}`,
            description: `This is a sample ${taskType} description.`,
            difficulty: 'medium',
            duration: 30,
            hcoin_reward: 45,
        };
        
        // Add type-specific data
        switch (taskType) {
            case 'daily':
                taskData.reset_time = '09:00';
                break;
            case 'goal':
                taskData.deadline = new Date().toISOString().split('T')[0]; // Today
                taskData.total_steps = 5;
                break;
            case 'challenge':
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                
                taskData.start_date = today.toISOString().split('T')[0];
                taskData.end_date = nextWeek.toISOString().split('T')[0];
                break;
        }
        
        // Fill form with task data
        document.getElementById('title').value = taskData.title;
        document.getElementById('description').value = taskData.description;
        document.getElementById('difficulty').value = taskData.difficulty;
        document.getElementById('duration').value = taskData.duration;
        
        // Fill type-specific fields
        switch (taskType) {
            case 'daily':
                document.getElementById('reset_time').value = taskData.reset_time;
                break;
            case 'goal':
                document.getElementById('deadline').value = taskData.deadline;
                document.getElementById('total_steps').value = taskData.total_steps;
                break;
            case 'challenge':
                document.getElementById('start_date').value = taskData.start_date;
                document.getElementById('end_date').value = taskData.end_date;
                break;
        }
        
        // Update reward calculation
        updateRewardCalculation();
        
        // Reset button state
        saveBtn.textContent = 'Save Task';
        saveBtn.disabled = false;
    }, 500);
}

/**
 * Save task (create or update)
 */
function saveTask() {
    // Get form data
    const taskId = parseInt(document.getElementById('task-id').value);
    const taskType = document.getElementById('task-type').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const difficulty = document.getElementById('difficulty').value;
    const duration = parseInt(document.getElementById('duration').value);
    
    // Validate form data
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    if (duration <= 0) {
        alert('Duration must be greater than 0');
        return;
    }
    
    // Get type-specific data
    let typeSpecificData = {};
    switch (taskType) {
        case 'daily':
            typeSpecificData.reset_time = document.getElementById('reset_time').value;
            break;
        case 'goal':
            typeSpecificData.deadline = document.getElementById('deadline').value;
            typeSpecificData.total_steps = parseInt(document.getElementById('total_steps').value);
            
            if (typeSpecificData.total_steps <= 0) {
                alert('Total steps must be greater than 0');
                return;
            }
            break;
        case 'challenge':
            typeSpecificData.start_date = document.getElementById('start_date').value;
            typeSpecificData.end_date = document.getElementById('end_date').value;
            
            if (new Date(typeSpecificData.end_date) <= new Date(typeSpecificData.start_date)) {
                alert('End date must be after start date');
                return;
            }
            break;
    }
    
    // Get calculated reward
    const hcoinReward = parseInt(document.getElementById('reward-amount').textContent);
    
    // Prepare form data for API
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('task_type', taskType);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('difficulty', difficulty);
    formData.append('duration', duration);
    formData.append('hcoin_reward', hcoinReward);
    
    // Add type-specific data
    Object.keys(typeSpecificData).forEach(key => {
        formData.append(key, typeSpecificData[key]);
    });
    
    // Show saving state
    const saveBtn = document.getElementById('save-task-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // In a real implementation, this would send data to the server
    // For this example, we're simulating a successful save
    setTimeout(() => {
        // Reset form state
        saveBtn.textContent = 'Save Task';
        saveBtn.disabled = false;
        
        // Close modal
        closeTaskModal();
        
        // Show success message
        showNotification(
            taskId === 0 
                ? `New ${taskType} created successfully!` 
                : `${capitalizeFirstLetter(taskType)} updated successfully!`
        );
        
        // Refresh page to show new/updated task
        // In a real application, you would make an API call like this:
        /*
        fetch('../php/api/tasks/save_task.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                closeTaskModal();
                
                // Show success message
                showNotification(
                    taskId === 0 
                        ? `New ${taskType} created successfully!` 
                        : `${capitalizeFirstLetter(taskType)} updated successfully!`
                );
                
                // Refresh page or update UI
                location.reload();
            } else {
                // Show error
                showNotification(data.message, 'error');
                
                // Reset button state
                saveBtn.textContent = 'Save Task';
                saveBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error saving task:', error);
            showNotification('An error occurred while saving the task', 'error');
            
            // Reset button state
            saveBtn.textContent = 'Save Task';
            saveBtn.disabled = false;
        });
        */
        
        location.reload();
    }, 1000);
}

/**
 * Show delete confirmation modal
 * @param {number} taskId - ID of the task to delete
 * @param {string} taskType - Type of task
 */
function showDeleteConfirmation(taskId, taskType) {
    deleteTaskId = taskId;
    deleteTaskType = taskType;
    
    // Show modal
    const modal = document.getElementById('delete-modal');
    modal.classList.add('show');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('show');
}

/**
 * Delete a task
 */
function deleteTask() {
    // Validate that we have a task to delete
    if (!deleteTaskId || !deleteTaskType) {
        closeDeleteModal();
        return;
    }
    
    // Show deleting state
    const deleteBtn = document.getElementById('confirm-delete-btn');
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;
    
    // In a real implementation, this would send a delete request to the server
    // For this example, we're simulating a successful delete
    setTimeout(() => {
        // Close modal
        closeDeleteModal();
        
        // Show success message
        showNotification(`${capitalizeFirstLetter(deleteTaskType)} deleted successfully`);
        
        // Find and remove the task element with animation
        const taskElement = document.querySelector(`.task-item .delete-btn[onclick="showDeleteConfirmation(${deleteTaskId}, '${deleteTaskType}')"]`).closest('.task-item');
        
        if (taskElement) {
            // Fade out task
            taskElement.style.opacity = '0';
            taskElement.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                // Remove task element
                taskElement.remove();
                
                // Check if list is now empty
                const tabContent = document.getElementById(`${deleteTaskType}s-tab`);
                const tasksList = tabContent.querySelector(`.${deleteTaskType}s-list`);
                
                if (tasksList && tasksList.children.length === 0) {
                    // Show empty state
                    const emptyTasks = document.createElement('div');
                    emptyTasks.className = 'empty-tasks';
                    emptyTasks.innerHTML = `
                        <p>You don't have any ${deleteTaskType} tasks yet.</p>
                        <button class="add-task-btn" onclick="openTaskModal('${deleteTaskType}')">Add Your First ${capitalizeFirstLetter(deleteTaskType)}</button>
                    `;
                    
                    tabContent.innerHTML = '';
                    tabContent.appendChild(emptyTasks);
                }
                
                // Update task count
                const tabElement = document.querySelector(`.tab[onclick="changeTab('${deleteTaskType}s')"]`);
                const countElement = tabElement.querySelector('.task-count');
                
                if (countElement) {
                    const currentCount = parseInt(countElement.textContent);
                    countElement.textContent = currentCount > 0 ? currentCount - 1 : 0;
                }
            }, 300);
        }
        
        // Reset delete data
        deleteTaskId = 0;
        deleteTaskType = '';
    }, 1000);
}

/**
 * Complete a task
 * @param {number} taskId - ID of the task to complete
 * @param {string} taskType - Type of task
 */
function completeTask(taskId, taskType) {
    // Find the button
    const button = event.target.closest('.complete-btn');
    
    // Prevent multiple clicks
    if (button.disabled) return;
    
    // Show loading state
    button.innerHTML = '<img src="../images/icons/loading.svg" alt="Loading" class="loading-icon"> Processing...';
    button.disabled = true;
    
    // In a real implementation, this would send data to the server
    // For this example, we're simulating a successful completion
    setTimeout(() => {
        // Get reward amount based on task type
        let hcoinsEarned = 0;
        switch (taskType) {
            case 'daily':
                hcoinsEarned = Math.floor(Math.random() * 30) + 20; // 20-50 hcoins
                break;
            case 'goal':
                hcoinsEarned = Math.floor(Math.random() * 50) + 30; // 30-80 hcoins
                break;
            case 'challenge':
                hcoinsEarned = Math.floor(Math.random() * 100) + 50; // 50-150 hcoins
                break;
        }
        
        // Update UI
        const taskItem = button.closest('.task-item');
        taskItem.classList.add('completed');
        
        button.innerHTML = '<img src="../images/icons/check.svg" alt="Done"> Completed';
        button.classList.add('done');
        button.disabled = true;
        
        // Update HCoin balance in header (if it exists)
        const hcoinBalanceElement = document.querySelector('.hcoin-balance span');
        if (hcoinBalanceElement) {
            const currentBalance = parseInt(hcoinBalanceElement.textContent.replace(/,/g, ''));
            const newBalance = currentBalance + hcoinsEarned;
            hcoinBalanceElement.textContent = newBalance.toLocaleString();
        }
        
        // Show completion modal
        showCompletionModal(hcoinsEarned, taskType);
    }, 1000);
}

/**
 * Show task completion modal with reward
 * @param {number} hcoinsEarned - Amount of HCoins earned
 * @param {string} taskType - Type of completed task
 */
function showCompletionModal(hcoinsEarned, taskType) {
    // Set earned amount
    document.getElementById('earned-hcoins').textContent = hcoinsEarned;
    
    // For dailies, show streak bonus randomly
    if (taskType === 'daily') {
        const showStreak = Math.random() > 0.5;
        const streakElement = document.getElementById('streak-bonus');
        
        if (showStreak) {
            const streakCount = Math.floor(Math.random() * 10) + 2; // 2-12 day streak
            document.getElementById('current-streak').textContent = streakCount;
            streakElement.style.display = 'block';
        } else {
            streakElement.style.display = 'none';
        }
    } else {
        document.getElementById('streak-bonus').style.display = 'none';
    }
    
    // Show modal
    const modal = document.getElementById('completion-modal');
    modal.classList.add('show');
}

/**
 * Close completion modal
 */
function closeCompletionModal() {
    const modal = document.getElementById('completion-modal');
    modal.classList.remove('show');
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error)
 */
function showNotification(message, type = 'success') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        // Create container if it doesn't exist
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Capitalize first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}