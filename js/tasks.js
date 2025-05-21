// tasks.js - JavaScript functionality for the tasks page

// Global variables to store task being modified
let currentTaskId = 0;
let currentTaskType = '';
let deleteTaskId = 0;
let deleteTaskType = '';
let currentSubtasks = [];

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
 * Update task counter for a specific tab
 * @param {string} tabType - Type of tab (dailies, goals, challenges)
 * @param {number} change - Change amount (+1, -1)
 */
function updateTaskCounter(tabType, change) {
    // Map task types to tab types
    const tabMapping = {
        'daily': 'dailies',
        'goal': 'goals', 
        'challenge': 'challenges'
    };
    
    const actualTabType = tabMapping[tabType] || tabType;
    
    // Find the tab element - try multiple selectors to be safe
    let tabElement = document.querySelector(`.tab[onclick*="${actualTabType}"]`);
    
    if (!tabElement) {
        // Alternative selector approach
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const onclick = tab.getAttribute('onclick');
            if (onclick && onclick.includes(actualTabType)) {
                tabElement = tab;
            }
        });
    }
    
    if (tabElement) {
        const countElement = tabElement.querySelector('.task-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            const newCount = Math.max(0, currentCount + change);
            countElement.textContent = newCount;
            
            console.log(`Updated ${actualTabType} counter: ${currentCount} -> ${newCount}`);
        } else {
            console.warn(`Count element not found for tab: ${actualTabType}`);
        }
    } else {
        console.warn(`Tab element not found for: ${actualTabType}`);
    }
}

/**
 * Update subtask counter for a specific task
 * @param {number} taskId - ID of the parent task
 * @param {number} change - Change amount (+1, -1)
 */
function updateSubtaskCounter(taskId, change) {
    // Find all subtask count elements for this task
    const subtaskButtons = document.querySelectorAll(`.manage-subtasks-btn[onclick*="${taskId}"]`);
    
    subtaskButtons.forEach(button => {
        const countElement = button.querySelector('.subtask-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            const newCount = Math.max(0, currentCount + change);
            countElement.textContent = newCount;
            
            console.log(`Updated subtask counter for task ${taskId}: ${currentCount} -> ${newCount}`);
        }
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Create task button
    const createTaskBtn = document.getElementById('create-task-button');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', function() {
            // Check which tab-content is currently active
            const activeTabContent = document.querySelector('.tab-content.active');
            let taskType = 'daily'; // Default to daily
            
            if (activeTabContent) {
                // Extract the task type from the tab-content id
                // The format is dailies-tab, goals-tab, challenges-tab
                const tabId = activeTabContent.id;
                if (tabId) {
                    // Extract the tab name and convert to singular
                    const tabName = tabId.replace('-tab', '');
                    if (tabName === 'dailies') taskType = 'daily';
                    else if (tabName === 'goals') taskType = 'goal';
                    else if (tabName === 'challenges') taskType = 'challenge';
                }
            }
            
            // Open the modal with the appropriate task type
            openTaskModal(taskType);
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
    
    // Show/hide duration field based on task type
    const durationGroup = document.querySelector('.form-group:has(#duration)');
    if (durationGroup) {
        if (taskType === 'daily') {
            durationGroup.style.display = 'block';
        } else {
            durationGroup.style.display = 'none';
        }
    }
    
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
        showNotification('Please enter a task title', 'error');
        return;
    }
    
    if (duration <= 0) {
        showNotification('Duration must be greater than 0', 'error');
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
            break;
        case 'challenge':
            typeSpecificData.start_date = document.getElementById('start_date').value;
            typeSpecificData.end_date = document.getElementById('end_date').value;
            
            if (new Date(typeSpecificData.end_date) <= new Date(typeSpecificData.start_date)) {
                showNotification('End date must be after start date', 'error');
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
    
    // Check if this is a new task
    const isNewTask = taskId === 0;
    
    // Send API request
    fetch('../php/api/tasks/save_task.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        saveBtn.textContent = 'Save Task';
        saveBtn.disabled = false;
        
        if (data.success) {
            // Close modal
            closeTaskModal();
            
            // Show success message
            const successMessage = isNewTask 
                ? `New ${taskType} created successfully!` 
                : `${capitalizeFirstLetter(taskType)} updated successfully!`;
            
            showNotification(successMessage);
            
            // Update counter only for new tasks
            if (isNewTask) {
                updateTaskCounter(taskType, 1);
                console.log(`Task created: incrementing ${taskType} counter`);
            }
            
            // For production, you might want to refresh the page or update the task list dynamically
            // For now, we'll refresh to show the new/updated task
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            // Show error
            showNotification(data.message || 'An error occurred while saving the task', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving task:', error);
        showNotification('An error occurred while saving the task', 'error');
        
        // Reset button state
        saveBtn.textContent = 'Save Task';
        saveBtn.disabled = false;
    });
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
    
    // Prepare form data
    const formData = new FormData();
    formData.append('task_id', deleteTaskId);
    formData.append('task_type', deleteTaskType);
    
    // Send API request
    fetch('../php/api/tasks/delete.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        deleteBtn.textContent = 'Delete';
        deleteBtn.disabled = false;
        
        // Close modal
        closeDeleteModal();
        
        if (data.success) {
            // Show success message
            showNotification(`${capitalizeFirstLetter(deleteTaskType)} deleted successfully`);
            
            // Update counter immediately
            updateTaskCounter(deleteTaskType, -1);
            console.log(`Task deleted: decrementing ${deleteTaskType} counter`);
            
            // Find and remove the task element with animation
            const taskElement = document.querySelector(`.delete-btn[onclick*="${deleteTaskId}"]`);
            const taskItem = taskElement ? taskElement.closest('.task-item') : null;
            
            if (taskItem) {
                // Fade out task
                taskItem.style.opacity = '0';
                taskItem.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    // Remove task element
                    taskItem.remove();
                    
                    // Check if list is now empty - fix the selector logic
                    let tabContentId;
                    let tasksListClass;
                    
                    // Map deleteTaskType to correct tab and list identifiers
                    switch(deleteTaskType) {
                        case 'daily':
                            tabContentId = 'dailies-tab';
                            tasksListClass = 'dailies-list';
                            break;
                        case 'goal':
                            tabContentId = 'goals-tab';
                            tasksListClass = 'goals-list';
                            break;
                        case 'challenge':
                            tabContentId = 'challenges-tab';
                            tasksListClass = 'challenges-list';
                            break;
                        default:
                            console.error('Unknown task type:', deleteTaskType);
                            return;
                    }
                    
                    const tabContent = document.getElementById(tabContentId);
                    const tasksList = tabContent ? tabContent.querySelector(`.${tasksListClass}`) : null;
                    
                    if (tasksList && tasksList.children.length === 0) {
                        // Show empty state
                        const emptyTasks = document.createElement('div');
                        emptyTasks.className = 'empty-tasks';
                        emptyTasks.innerHTML = `
                            <p>You don't have any ${deleteTaskType === 'daily' ? 'daily tasks' : deleteTaskType + ' tasks'} yet.</p>
                            <button class="add-task-btn" onclick="openTaskModal('${deleteTaskType}')">Add Your First ${capitalizeFirstLetter(deleteTaskType)}</button>
                        `;
                        
                        // Replace the tasks list with empty state
                        tasksList.parentNode.replaceChild(emptyTasks, tasksList);
                    }
                }, 300);
            } else {
                // If we can't find the task element, just refresh the page
                location.reload();
            }
        } else {
            // Show error message
            showNotification(data.message || 'Error deleting task', 'error');
        }
        
        // Reset delete data
        deleteTaskId = 0;
        deleteTaskType = '';
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        showNotification('An error occurred while deleting the task', 'error');
        
        // Reset button state
        deleteBtn.textContent = 'Delete';
        deleteBtn.disabled = false;
        
        // Close modal
        closeDeleteModal();
        
        // Reset delete data
        deleteTaskId = 0;
        deleteTaskType = '';
    });
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
    
    // For goals and challenges, check if all subtasks are completed first
    if ((taskType === 'goal' || taskType === 'challenge')) {
        // Check if all subtasks are completed
        fetch(`../php/api/tasks/subtasks.php?task_id=${taskId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const subtasks = data.subtasks;
                    
                    // If no subtasks, proceed with completion
                    if (subtasks.length === 0) {
                        proceedWithCompletion(button, taskId, taskType);
                        return;
                    }
                    
                    // Check if all subtasks are completed
                    const allCompleted = subtasks.every(subtask => subtask.is_completed == 1);
                    
                    if (allCompleted) {
                        proceedWithCompletion(button, taskId, taskType);
                    } else {
                        // Show subtasks modal with message
                        showNotification('Complete all subtasks before completing the main task', 'warning');
                        showSubtasks(taskId, taskType);
                    }
                } else {
                    // If error fetching subtasks, proceed anyway
                    proceedWithCompletion(button, taskId, taskType);
                }
            })
            .catch(error => {
                console.error('Error checking subtasks:', error);
                // If error, proceed anyway
                proceedWithCompletion(button, taskId, taskType);
            });
    } else {
        // For dailies or if already ready, proceed directly
        proceedWithCompletion(button, taskId, taskType);
    }
}

function proceedWithCompletion(button, taskId, taskType) {
    // Show loading state
    button.innerHTML = '<img src="../images/icons/loading.svg" alt="Loading" class="loading-icon"> Processing...';
    button.disabled = true;
    
    // Prepare form data
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
            // Update UI
            const taskItem = button.closest('.task-item');
            taskItem.classList.add('completed');
            button.innerHTML = '<img src="../images/icons/check.svg" alt="Done"> Completed';
            button.classList.add('done');
            button.disabled = true;
            
            // Update HCoin balance in header (if it exists)
            if (data.new_balance) {
                const hcoinBalanceElement = document.querySelector('.hcoin-balance span');
                if (hcoinBalanceElement) {
                    hcoinBalanceElement.textContent = new Intl.NumberFormat().format(data.new_balance);
                }
            }
            
            // Show completion modal
            showCompletionModal(data.hcoins_earned || 0, taskType);
            
            // Refresh subtasks list if relevant
            if (currentTaskId === taskId) {
                loadSubtasks(taskId);
            }
        } else {
            // Show error
            showNotification(data.message || 'Error completing task', 'error');
            
            // Reset button
            button.innerHTML = '<img src="../images/icons/check.svg" alt="Complete"> Complete';
            button.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error completing task:', error);
        showNotification('An error occurred while completing the task', 'error');
        
        // Reset button
        button.innerHTML = '<img src="../images/icons/check.svg" alt="Complete"> Complete';
        button.disabled = false;
    });
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

/**
 * Load subtasks for a task
 * @param {number} taskId - ID of the task to load subtasks for
 */
function loadSubtasks(taskId) {
    if (!taskId) return;
    
    // Clear current subtasks
    currentSubtasks = [];
    
    // Show loading state
    const subtasksList = document.querySelector('.subtasks-list');
    if (subtasksList) {
        subtasksList.innerHTML = '<div class="loading-subtasks">Loading subtasks...</div>';
    }
    
    // Fetch subtasks from API
    fetch(`../php/api/tasks/subtasks.php?task_id=${taskId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentSubtasks = data.subtasks;
                updateSubtasksList();
            } else {
                console.error('Error loading subtasks:', data.message);
                if (subtasksList) {
                    subtasksList.innerHTML = `<div class="error-message">Error loading subtasks: ${data.message}</div>`;
                }
            }
        })
        .catch(error => {
            console.error('API request failed:', error);
            if (subtasksList) {
                subtasksList.innerHTML = '<div class="error-message">Failed to load subtasks</div>';
            }
        });
}

/**
 * Update subtasks list in UI
 */
function updateSubtasksList() {
    const subtasksList = document.querySelector('.subtasks-list');
    if (!subtasksList) return;
    
    if (currentSubtasks.length === 0) {
        subtasksList.innerHTML = '<div class="empty-subtasks">No subtasks yet. Add some to break down this task!</div>';
        return;
    }
    
    // Build subtasks list
    let html = '';
    currentSubtasks.forEach(subtask => {
        html += `
            <div class="subtask-item ${subtask.is_completed ? 'completed' : ''}">
                <div class="subtask-checkbox">
                    <input type="checkbox" 
                           id="subtask-${subtask.id}" 
                           ${subtask.is_completed ? 'checked' : ''} 
                           onchange="toggleSubtask(${subtask.id}, this.checked)">
                    <label for="subtask-${subtask.id}"></label>
                </div>
                <div class="subtask-content">
                    <div class="subtask-title">${escapeHtml(subtask.title)}</div>
                    ${subtask.description ? `<div class="subtask-description">${escapeHtml(subtask.description)}</div>` : ''}
                </div>
                <div class="subtask-actions">
                    <button class="subtask-edit-btn" onclick="editSubtask(${subtask.id})">
                        <img src="../images/icons/edit-icon-light.webp" alt="Edit">
                    </button>
                    <button class="subtask-delete-btn" onclick="deleteSubtask(${subtask.id})">
                        <img src="../images/icons/trash.webp" alt="Delete">
                    </button>
                </div>
            </div>
        `;
    });
    
    subtasksList.innerHTML = html;
}

/**
 * Create a new subtask (UPDATED VERSION)
 */
function createSubtask() {
    const taskId = currentTaskId;
    const title = document.getElementById('subtask-title').value.trim();
    const description = document.getElementById('subtask-description').value.trim();
    
    if (!taskId) {
        showNotification('Please save the task first before adding subtasks', 'error');
        return;
    }
    
    if (!title) {
        showNotification('Please enter a subtask title', 'error');
        return;
    }
    
    // Show loading state
    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    addSubtaskBtn.textContent = 'Adding...';
    addSubtaskBtn.disabled = true;
    
    // Send API request
    fetch('../php/api/tasks/subtasks.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'create',
            task_id: taskId,
            title: title,
            description: description
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        addSubtaskBtn.textContent = 'Add Subtask';
        addSubtaskBtn.disabled = false;
        
        if (data.success) {
            // Clear input fields
            document.getElementById('subtask-title').value = '';
            document.getElementById('subtask-description').value = '';
            
            // Update subtask counter
            updateSubtaskCounter(taskId, 1);
            console.log(`Subtask created: incrementing counter for task ${taskId}`);
            
            // Add new subtask to local array immediately (optimistic update)
            const newSubtask = {
                id: data.subtask_id,
                title: title,
                description: description,
                is_completed: 0,
                parent_task_id: taskId
            };
            currentSubtasks.push(newSubtask);
            
            // Update the UI immediately
            updateSubtasksList();
            
            // Update progress bar immediately after adding the subtask
            const totalSubtasks = currentSubtasks.length;
            const completedSubtasks = currentSubtasks.filter(subtask => subtask.is_completed == 1).length;
            
            // Call updateTaskProgress directly with the updated counts
            updateTaskProgress(taskId, completedSubtasks, totalSubtasks);
            
            // Also update the main tasks list to reflect the new subtask
            updateMainTaskProgress(taskId, completedSubtasks, totalSubtasks);
            
            console.log(`Progress updated after creating subtask: ${completedSubtasks}/${totalSubtasks}`);
            
            // Show success message
            showNotification('Subtask added successfully');
        } else {
            // Show error
            showNotification(data.message || 'Error adding subtask', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding subtask:', error);
        showNotification('An error occurred while adding the subtask', 'error');
        
        // Reset button state
        addSubtaskBtn.textContent = 'Add Subtask';
        addSubtaskBtn.disabled = false;
    });
}

/**
 * Update the main task progress bars
 * @param {number} taskId - Task ID to update
 * @param {number} completed - Number of completed subtasks
 * @param {number} total - Total number of subtasks
 */
function updateMainTaskProgress(taskId, completed, total) {
    // Find the task item in the main task list
    const taskItems = document.querySelectorAll(`.task-item`);
    
    taskItems.forEach(taskItem => {
        // Check if this task item contains buttons with the current task ID
        const taskButtons = taskItem.querySelectorAll(`[onclick*="${taskId}"]`);
        if (taskButtons.length === 0) return;
        
        // Find or create the subtask progress section
        let subtaskProgress = taskItem.querySelector('.subtask-progress');
        
        // If there are no subtasks, hide the progress bar
        if (total === 0) {
            if (subtaskProgress) {
                subtaskProgress.style.display = 'none';
            }
            return;
        }
        
        // If progress container doesn't exist, create it
        if (!subtaskProgress) {
            const taskInfo = taskItem.querySelector('.task-info');
            if (!taskInfo) return;
            
            subtaskProgress = document.createElement('div');
            subtaskProgress.className = 'subtask-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progress = document.createElement('div');
            progress.className = 'progress';
            progress.style.width = `${Math.round((completed / total) * 100)}%`;
            
            progressBar.appendChild(progress);
            subtaskProgress.appendChild(progressBar);
            
            const progressText = document.createElement('div');
            progressText.className = 'progress-text';
            progressText.innerHTML = `
                <span>${completed} / ${total} subtasks</span>
                <span class="percentage">${Math.round((completed / total) * 100)}%</span>
            `;
            
            subtaskProgress.appendChild(progressText);
            taskInfo.appendChild(subtaskProgress);
        } 
        else {
            // Show the progress section if it was hidden
            subtaskProgress.style.display = 'block';
            
            // Update existing progress bar
            let progressBar = subtaskProgress.querySelector('.progress-bar');
            let progressElement = progressBar ? progressBar.querySelector('.progress') : null;
            let progressText = subtaskProgress.querySelector('.progress-text');
            
            // Calculate percentage
            const progressPercent = Math.round((completed / total) * 100);
            
            // Update progress bar width
            if (progressElement) {
                progressElement.style.width = progressPercent + '%';
            }
            
            // Update progress text
            if (progressText) {
                const progressSpan = progressText.querySelector('span:first-child');
                const percentageSpan = progressText.querySelector('.percentage');
                
                if (progressSpan) {
                    progressSpan.textContent = `${completed} / ${total} subtasks`;
                }
                
                if (percentageSpan) {
                    percentageSpan.textContent = `${progressPercent}%`;
                }
            }
        }
    });
}


/**
 * Toggle subtask completion status (UPDATED VERSION)
 * @param {number} subtaskId - ID of the subtask to toggle
 * @param {boolean} completed - New completion status
 */
function toggleSubtask(subtaskId, completed) {
    // Find subtask element
    const subtaskElement = document.querySelector(`.subtask-item input[id="subtask-${subtaskId}"]`).closest('.subtask-item');
    
    // Apply visual change immediately (optimistic UI update)
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
            // Update the subtask in our local array
            const index = currentSubtasks.findIndex(subtask => subtask.id === subtaskId);
            if (index !== -1) {
                currentSubtasks[index].is_completed = completed;
            }
            
            // Calculate new progress counts
            const totalSubtasks = currentSubtasks.length;
            const completedSubtasks = currentSubtasks.filter(subtask => subtask.is_completed == 1).length;
            
            // Update progress bar in real-time if we're in the subtasks modal
            updateTaskProgress(currentTaskId, completedSubtasks, totalSubtasks);
            
            // If all subtasks completed, show notification
            if (data.all_completed && completed) {
                showNotification('All subtasks completed! You can now complete the main task.');
                
                // Update the main task's complete button in the modal
                const completeBtn = document.querySelector(`.complete-btn[data-task-id="${currentTaskId}"]`);
                if (completeBtn) {
                    completeBtn.classList.add('ready');
                }
            }
            
            console.log(`Subtask ${subtaskId} ${completed ? 'completed' : 'uncompleted'}. Progress: ${completedSubtasks}/${totalSubtasks}`);
        } else {
            // Revert visual change if update failed
            if (completed) {
                subtaskElement.classList.remove('completed');
                // Uncheck the checkbox
                const checkbox = subtaskElement.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
            } else {
                subtaskElement.classList.add('completed');
                // Check the checkbox
                const checkbox = subtaskElement.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = true;
            }
            
            // Show error
            showNotification(data.message || 'Error updating subtask', 'error');
        }
    })
    .catch(error => {
        console.error('Error toggling subtask:', error);
        showNotification('An error occurred while updating the subtask', 'error');
        
        // Revert visual change if update failed
        if (completed) {
            subtaskElement.classList.remove('completed');
            const checkbox = subtaskElement.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        } else {
            subtaskElement.classList.add('completed');
            const checkbox = subtaskElement.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = true;
        }
    });
}

/**
 * Delete a subtask - Fixed to directly match the createSubtask pattern
 * @param {number} subtaskId - ID of the subtask to delete
 */
function deleteSubtask(subtaskId) {
    if (!confirm('Are you sure you want to delete this subtask?')) {
        return;
    }
    
    // Find subtask element
    const subtaskElement = document.querySelector(`.subtask-item input[id="subtask-${subtaskId}"]`).closest('.subtask-item');
    if (!subtaskElement) {
        console.error(`Subtask element not found for ID: ${subtaskId}`);
        return;
    }
    
    // Apply visual change immediately (optimistic UI update)
    subtaskElement.style.opacity = '0.5';
    
    // Send API request
    fetch('../php/api/tasks/subtasks.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'delete',
            subtask_id: subtaskId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Record whether this subtask was completed before removal
            // (This is important for correct progress calculation)
            const subtask = currentSubtasks.find(s => s.id === subtaskId);
            const wasCompleted = subtask && subtask.is_completed == 1;
            
            // Update subtask counter
            updateSubtaskCounter(currentTaskId, -1);
            
            // Remove from our local array
            currentSubtasks = currentSubtasks.filter(subtask => subtask.id !== subtaskId);
            
            // Calculate new progress values right after removing from array
            const totalSubtasks = currentSubtasks.length;
            const completedSubtasks = currentSubtasks.filter(subtask => subtask.is_completed == 1).length;
            
            console.log('After removing subtask:');
            console.log(`- Total subtasks: ${totalSubtasks}`);
            console.log(`- Completed subtasks: ${completedSubtasks}`);
            
            // Update progress in the subtasks modal
            updateTaskProgress(currentTaskId, completedSubtasks, totalSubtasks);
            
            // Update progress in the main task list
            updateMainTaskProgress(currentTaskId, completedSubtasks, totalSubtasks);
            
            // Remove subtask from UI with animation
            subtaskElement.style.height = '0';
            subtaskElement.style.margin = '0';
            subtaskElement.style.padding = '0';
            
            setTimeout(() => {
                subtaskElement.remove();
                
                // If no subtasks left, show empty message
                if (currentSubtasks.length === 0) {
                    updateSubtasksList();
                }
            }, 300);
            
            // Show success message
            showNotification('Subtask deleted successfully');
        } else {
            // Revert visual change if delete failed
            subtaskElement.style.opacity = '1';
            
            // Show error
            showNotification(data.message || 'Error deleting subtask', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting subtask:', error);
        showNotification('An error occurred while deleting the subtask', 'error');
        
        // Revert visual change if delete failed
        subtaskElement.style.opacity = '1';
    });
}

/**
 * Edit a subtask (just fills in the form)
 * @param {number} subtaskId - ID of the subtask to edit
 */
function editSubtask(subtaskId) {
    // Find subtask in array
    const subtask = currentSubtasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    
    // Show edit mode
    document.getElementById('subtask-title').value = subtask.title;
    document.getElementById('subtask-description').value = subtask.description || '';
    document.getElementById('subtask-id').value = subtask.id;
    
    // Change button text
    document.getElementById('add-subtask-btn').textContent = 'Update Subtask';
    
    // Focus on title field
    document.getElementById('subtask-title').focus();
    
    // Scroll to form
    document.querySelector('.subtask-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Reset subtask form
 */
function resetSubtaskForm() {
    document.getElementById('subtask-title').value = '';
    document.getElementById('subtask-description').value = '';
    document.getElementById('subtask-id').value = '0';
    document.getElementById('add-subtask-btn').textContent = 'Add Subtask';
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
 * Show subtasks modal and update progress (UPDATED VERSION)
 * @param {number} taskId - ID of the task
 * @param {string} taskType - Type of task
 */
function showSubtasks(taskId, taskType) {
    // Set current task ID
    currentTaskId = taskId;
    currentTaskType = taskType;
    
    // Update modal title
    const modalTitle = document.getElementById('subtasks-modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Manage Subtasks`;
    }
    
    // Reset subtask form
    resetSubtaskForm();
    
    // Load subtasks
    loadSubtasks(taskId);
    
    // Update progress when modal opens
    setTimeout(() => {
        getSubtaskCounts(taskId).then(({completed, total}) => {
            updateTaskProgress(taskId, completed, total);
        });
    }, 500);
    
    // Show modal
    const modal = document.getElementById('subtasks-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Add CSS for the pulse animation (add this to your tasks.css)
const pulseCSS = `
.complete-btn.ready {
    animation: pulse 1.5s infinite alternate !important;
}

@keyframes pulse {
    from { 
        transform: scale(1); 
        box-shadow: 0 2px 5px rgba(106, 141, 127, 0.2);
    }
    to { 
        transform: scale(1.05); 
        box-shadow: 0 4px 15px rgba(106, 141, 127, 0.4);
    }
}
`;

// Inject the CSS if it doesn't exist
if (!document.querySelector('#pulse-animation-css')) {
    const style = document.createElement('style');
    style.id = 'pulse-animation-css';
    style.textContent = pulseCSS;
    document.head.appendChild(style);
}

/**
 * Close subtasks modal
 */
function closeSubtasksModal() {
    const modal = document.getElementById('subtasks-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Update task progress bar for a specific task
 * @param {number} taskId - ID of the parent task
 * @param {number} completed - Number of completed subtasks
 * @param {number} total - Total number of subtasks
 */
function updateTaskProgress(taskId, completed, total) {
    // First update in the subtasks modal
    const subtasksModal = document.getElementById('subtasks-modal');
    if (subtasksModal && subtasksModal.classList.contains('show')) {
        const subtaskProgress = subtasksModal.querySelector('.subtask-progress');
        
        // If there are no subtasks, hide the progress section
        if (total === 0) {
            if (subtaskProgress) {
                subtaskProgress.style.display = 'none';
            }
            return;
        }
        
        if (!subtaskProgress) {
            // Create the progress section if it doesn't exist
            const modalBody = subtasksModal.querySelector('.modal-body');
            if (!modalBody) return;
            
            const newSubtaskProgress = document.createElement('div');
            newSubtaskProgress.className = 'subtask-progress';
            modalBody.insertBefore(newSubtaskProgress, modalBody.firstChild);
            
            // Create progress bar and text
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progress = document.createElement('div');
            progress.className = 'progress';
            progress.style.width = `${Math.round((completed / total) * 100)}%`;
            
            progressBar.appendChild(progress);
            newSubtaskProgress.appendChild(progressBar);
            
            const progressText = document.createElement('div');
            progressText.className = 'progress-text';
            progressText.innerHTML = `
                <span>${completed} / ${total} subtasks</span>
                <span class="percentage">${Math.round((completed / total) * 100)}%</span>
            `;
            
            newSubtaskProgress.appendChild(progressText);
        } 
        else if (total > 0) {
            // Find or create progress bar elements
            let progressBar = subtaskProgress.querySelector('.progress-bar');
            let progressElement = progressBar ? progressBar.querySelector('.progress') : null;
            let progressText = subtaskProgress.querySelector('.progress-text');
            
            // If progress bar doesn't exist, create it
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                
                progressElement = document.createElement('div');
                progressElement.className = 'progress';
                progressBar.appendChild(progressElement);
                
                subtaskProgress.insertBefore(progressBar, subtaskProgress.firstChild);
            }
            
            if (!progressText) {
                progressText = document.createElement('div');
                progressText.className = 'progress-text';
                progressText.innerHTML = `
                    <span>${completed} / ${total} subtasks</span>
                    <span class="percentage">${Math.round((completed / total) * 100)}%</span>
                `;
                subtaskProgress.appendChild(progressText);
            }
            
            // Calculate percentage
            const progressPercent = Math.round((completed / total) * 100);
            
            // Update progress bar width with smooth transition
            if (progressElement) {
                progressElement.style.width = progressPercent + '%';
            }
            
            // Update progress text
            const progressSpan = progressText.querySelector('span:first-child');
            const percentageSpan = progressText.querySelector('.percentage');
            
            if (progressSpan) {
                progressSpan.textContent = `${completed} / ${total} subtasks`;
            }
            
            if (percentageSpan) {
                percentageSpan.textContent = `${progressPercent}%`;
            }
            
            // Make sure the progress section is visible
            subtaskProgress.style.display = 'block';
        }
    }
    
    // Then update in the main task list
    updateMainTaskProgress(taskId, completed, total);
    
    // Check if task is ready to complete (all subtasks done)
    if (completed === total && total > 0) {
        // Find all complete buttons for this task
        const completeButtons = document.querySelectorAll(`.complete-btn[onclick*="${taskId}"]`);
        
        completeButtons.forEach(button => {
            if (!button.classList.contains('done')) {
                button.classList.add('ready');
                button.style.animation = 'pulse 1.5s infinite alternate';
            }
        });
    } else {
        // Remove ready state if not all subtasks are completed
        const completeButtons = document.querySelectorAll(`.complete-btn[onclick*="${taskId}"]`);
        
        completeButtons.forEach(button => {
            button.classList.remove('ready');
            button.style.animation = '';
        });
    }
}



/**
 * Get current subtask counts for a task
 * @param {number} taskId - ID of the parent task
 * @returns {Promise} Promise that resolves with {completed, total}
 */
function getSubtaskCounts(taskId) {
    return fetch(`../php/api/tasks/subtasks.php?task_id=${taskId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const subtasks = data.subtasks;
                const total = subtasks.length;
                const completed = subtasks.filter(subtask => subtask.is_completed == 1).length;
                return { completed, total };
            } else {
                console.error('Error getting subtask counts:', data.message);
                return { completed: 0, total: 0 };
            }
        })
        .catch(error => {
            console.error('Error fetching subtask counts:', error);
            return { completed: 0, total: 0 };
        });
}