// pages/tasks.php
<?php
// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';
require_once '../php/include/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('Location: login.php');
    exit;
}

// Get user data
$userData = getUserData($_SESSION['user_id']);
$userHCoins = $userData['hcoin'];
$userHabitusName = $userData['username'] . "'s Habitus";

// Get tab selection
$activeTab = isset($_GET['tab']) ? $_GET['tab'] : 'dailies';

// Get dailies
$dailies = getUserDailies($_SESSION['user_id']);

// Get goals
$goals = getUserGoals($_SESSION['user_id']);

// Get challenges
$challenges = getUserChallenges($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
<!-- Update the head section of tasks.php -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tasks - <?php echo SITE_NAME; ?></title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/tasks.css">
</head>
<body>
    <div class="main-container">
        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Tasks Content -->
            <div class="tasks-content">
                <div class="tasks-header">
                    <h1>Your Tasks</h1>
                    <a href="task_create.php" class="create-task-btn">+ New Task</a>
                </div>

                <div class="tasks-tabs">
                    <div class="tab <?php echo $activeTab === 'dailies' ? 'active' : ''; ?>" 
                         onclick="changeTab('dailies')">
                        Dailies
                        <span class="task-count"><?php echo count($dailies); ?></span>
                    </div>
                    <div class="tab <?php echo $activeTab === 'goals' ? 'active' : ''; ?>" 
                         onclick="changeTab('goals')">
                        Goals
                        <span class="task-count"><?php echo count($goals); ?></span>
                    </div>
                    <div class="tab <?php echo $activeTab === 'challenges' ? 'active' : ''; ?>" 
                         onclick="changeTab('challenges')">
                        Challenges
                        <span class="task-count"><?php echo count($challenges); ?></span>
                    </div>
                </div>

                <!-- Dailies Tab -->
                <div class="tab-content <?php echo $activeTab === 'dailies' ? 'active' : ''; ?>" id="dailies-tab">
                    <?php if (empty($dailies)): ?>
                        <div class="empty-tasks">
                            <p>You don't have any daily tasks yet.</p>
                            <a href="task_create.php?type=daily" class="add-task-btn">Add Your First Daily</a>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list dailies-list">
                            <?php foreach ($dailies as $daily): ?>
                                <div class="task-item <?php echo $daily['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($daily['title']); ?></h3>
                                            <?php if ($daily['description']): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($daily['description']); ?></p>
                                            <?php endif; ?>
                                            <div class="task-meta">
                                                <span class="difficulty <?php echo $daily['difficulty']; ?>">
                                                    <?php echo ucfirst($daily['difficulty']); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-small.svg" alt="HCoin">
                                                    <?php echo $daily['hcoin_reward']; ?>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="task-stats">
                                            <div class="streak">
                                                <img src="../images/icons/flame.svg" alt="Streak">
                                                <span><?php echo $daily['current_streak']; ?></span>
                                                <span class="label">Current Streak</span>
                                            </div>
                                            <div class="best-streak">
                                                <img src="../images/icons/trophy.svg" alt="Best">
                                                <span><?php echo $daily['highest_streak']; ?></span>
                                                <span class="label">Best Streak</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <?php if ($daily['completed']): ?>
                                            <button class="complete-btn done" disabled>
                                                <img src="../images/icons/check.svg" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="complete-btn" onclick="completeTask(<?php echo $daily['id']; ?>, 'daily')">
                                                <img src="../images/icons/check.svg" alt="Complete">
                                                Complete
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="editTask(<?php echo $daily['id']; ?>, 'daily')">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="deleteTask(<?php echo $daily['id']; ?>, 'daily')">
                                            <img src="../images/icons/trash.svg" alt="Delete">
                                        </button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Goals Tab -->
                <div class="tab-content <?php echo $activeTab === 'goals' ? 'active' : ''; ?>" id="goals-tab">
                    <?php if (empty($goals)): ?>
                        <div class="empty-tasks">
                            <p>You don't have any goals yet.</p>
                            <a href="task_create.php?type=goal" class="add-task-btn">Add Your First Goal</a>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list goals-list">
                            <?php foreach ($goals as $goal): ?>
                                <div class="task-item <?php echo $goal['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($goal['title']); ?></h3>
                                            <?php if ($goal['description']): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($goal['description']); ?></p>
                                            <?php endif; ?>
                                            <div class="task-meta">
                                                <span class="difficulty <?php echo $goal['difficulty']; ?>">
                                                    <?php echo ucfirst($goal['difficulty']); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-small.svg" alt="HCoin">
                                                    <?php echo $goal['hcoin_reward']; ?>
                                                </span>
                                                <?php if ($goal['deadline']): ?>
                                                    <span class="deadline">
                                                        <img src="../images/icons/calendar.svg" alt="Deadline">
                                                        <?php echo date('M j, Y', strtotime($goal['deadline'])); ?>
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        <div class="task-progress">
                                            <div class="progress-bar">
                                                <div class="progress" style="width: <?php echo ($goal['progress'] / $goal['total_steps']) * 100; ?>%"></div>
                                            </div>
                                            <div class="progress-text">
                                                <span><?php echo $goal['progress']; ?> / <?php echo $goal['total_steps']; ?> steps</span>
                                                <span class="percentage"><?php echo round(($goal['progress'] / $goal['total_steps']) * 100); ?>%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <?php if ($goal['completed']): ?>
                                            <button class="complete-btn done" disabled>
                                                <img src="../images/icons/check.svg" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="complete-btn" onclick="completeTask(<?php echo $goal['id']; ?>, 'goal')">
                                                <img src="../images/icons/check.svg" alt="Step">
                                                Complete Step
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="editTask(<?php echo $goal['id']; ?>, 'goal')">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="deleteTask(<?php echo $goal['id']; ?>, 'goal')">
                                            <img src="../images/icons/trash.svg" alt="Delete">
                                        </button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Challenges Tab -->
                <div class="tab-content <?php echo $activeTab === 'challenges' ? 'active' : ''; ?>" id="challenges-tab">
                    <?php if (empty($challenges)): ?>
                        <div class="empty-tasks">
                            <p>You don't have any active challenges.</p>
                            <a href="task_create.php?type=challenge" class="add-task-btn">Create a Challenge</a>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list challenges-list">
                            <?php foreach ($challenges as $challenge): ?>
                                <div class="task-item <?php echo $challenge['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($challenge['title']); ?></h3>
                                            <?php if ($challenge['description']): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($challenge['description']); ?></p>
                                            <?php endif; ?>
                                            <div class="task-meta">
                                                <span class="difficulty <?php echo $challenge['difficulty']; ?>">
                                                    <?php echo ucfirst($challenge['difficulty']); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-small.svg" alt="HCoin">
                                                    <?php echo $challenge['hcoin_reward']; ?>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="task-timeframe">
                                            <div class="dates">
                                                <div class="start-date">
                                                    <span class="label">Started:</span>
                                                    <span><?php echo date('M j, Y', strtotime($challenge['start_date'])); ?></span>
                                                </div>
                                                <div class="end-date">
                                                    <span class="label">Ends:</span>
                                                    <span><?php echo date('M j, Y', strtotime($challenge['end_date'])); ?></span>
                                                </div>
                                            </div>
                                            <?php
                                                $now = new DateTime();
                                                $end = new DateTime($challenge['end_date']);
                                                $interval = $now->diff($end);
                                                $daysLeft = $interval->days;
                                                if ($now > $end) $daysLeft = 0;
                                            ?>
                                            <div class="time-left">
                                                <span class="days"><?php echo $daysLeft; ?></span>
                                                <span class="label">Days Left</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <?php if ($challenge['completed']): ?>
                                            <button class="complete-btn done" disabled>
                                                <img src="../images/icons/check.svg" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="complete-btn" onclick="completeTask(<?php echo $challenge['id']; ?>, 'challenge')">
                                                <img src="../images/icons/check.svg" alt="Complete">
                                                Complete
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="editTask(<?php echo $challenge['id']; ?>, 'challenge')">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="deleteTask(<?php echo $challenge['id']; ?>, 'challenge')">
                                            <img src="../images/icons/trash.svg" alt="Delete">
                                        </button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Reward Modal -->
    <div id="reward-modal" class="modal" style="display: none;">
        <div class="modal-content reward">
            <div class="reward-animation">
                <img src="../images/icons/reward.svg" alt="Reward" class="reward-icon">
                <div class="hcoin-bubble">
                    <img src="../images/icons/hcoin.svg" alt="HCoin">
                    <span id="earned-amount">0</span>
                </div>
            </div>
            <h2>Task Completed!</h2>
            <p id="reward-message">You've earned HCoins for completing this task.</p>
            <?php if ($activeTab === 'dailies'): ?>
                <div id="streak-bonus" style="display: none;">
                    <p class="streak-info">
                        <img src="../images/icons/flame.svg" alt="Streak">
                        <span>Streak Bonus: <span id="streak-count">0</span> days</span>
                    </p>
                </div>
            <?php endif; ?>
            <div class="modal-actions">
                <button class="continue-btn" onclick="closeRewardModal()">Continue</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="delete-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h2>Delete Task</h2>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="cancel-btn" onclick="closeDeleteModal()">Cancel</button>
                <button class="delete-confirm-btn" onclick="confirmDelete()">Delete</button>
            </div>
        </div>
    </div>

    <script>
        let deleteTaskId = 0;
        let deleteTaskType = '';
        
        function changeTab(tab) {
            window.location.href = `tasks.php?tab=${tab}`;
        }
        
        function completeTask(taskId, taskType) {
            // Disable the button to prevent multiple clicks
            const button = event.currentTarget;
            button.disabled = true;
            button.innerHTML = '<img src="../images/icons/loading.svg" alt="Loading" class="loading-icon"> Processing...';
            
            // Send completion request
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('task_type', taskType);
            
            fetch('../php/api/tasks/complete.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update HCoin balance in header
                    const balanceElement = document.querySelector('.hcoin-balance span');
                    if (balanceElement) {
                        balanceElement.textContent = data.new_balance;
                    }
                    
                    // Show reward animation
                    document.getElementById('earned-amount').textContent = data.hcoins_earned;
                    
                    // For dailies, show streak if applicable
                    if (taskType === 'daily' && data.streak && data.streak > 1) {
                        document.getElementById('streak-count').textContent = data.streak;
                        document.getElementById('streak-bonus').style.display = 'block';
                    } else {
                        document.getElementById('streak-bonus').style.display = 'none';
                    }
                    
                    // Show reward modal
                    document.getElementById('reward-modal').style.display = 'flex';
                    
                    // Mark task as completed in UI
                    const taskItem = button.closest('.task-item');
                    taskItem.classList.add('completed');
                    
                    // Update button
                    button.innerHTML = '<img src="../images/icons/check.svg" alt="Done"> Completed';
                    button.classList.add('done');
                    button.disabled = true;
                    
                    // For goals, update progress bar if not fully completed
                    if (taskType === 'goal' && !data.completed) {
                        const progressElement = taskItem.querySelector('.progress');
                        const progressTextElement = taskItem.querySelector('.progress-text .percentage');
                        const stepsElement = taskItem.querySelector('.progress-text span:first-child');
                        
                        if (progressElement && progressTextElement && stepsElement && data.progress && data.total) {
                            const percentage = (data.progress / data.total) * 100;
                            progressElement.style.width = percentage + '%';
                            progressTextElement.textContent = Math.round(percentage) + '%';
                            stepsElement.textContent = data.progress + ' / ' + data.total + ' steps';
                        }
                    }
                } else {
                    // Reset button on error
                    button.disabled = false;
                    button.innerHTML = '<img src="../images/icons/check.svg" alt="Complete"> Complete';
                    
                    // Show error
                    alert('Error completing task: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Reset button
                button.disabled = false;
                button.innerHTML = '<img src="../images/icons/check.svg" alt="Complete"> Complete';
                
                alert('An error occurred while completing the task');
            });
        }
        
        function editTask(taskId, taskType) {
            window.location.href = `task_edit.php?id=${taskId}&type=${taskType}`;
        }
        
        function deleteTask(taskId, taskType) {
            deleteTaskId = taskId;
            deleteTaskType = taskType;
            
            // Show confirmation modal
            document.getElementById('delete-modal').style.display = 'flex';
        }
        
        function closeDeleteModal() {
            document.getElementById('delete-modal').style.display = 'none';
            deleteTaskId = 0;
            deleteTaskType = '';
        }
        
        function confirmDelete() {
            if (deleteTaskId === 0 || !deleteTaskType) return;
            
            // Send delete request
            const formData = new FormData();
            formData.append('task_id', deleteTaskId);
            formData.append('task_type', deleteTaskType);
            
            fetch('../php/api/tasks/delete.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close modal
                    closeDeleteModal();
                    
                    // Remove task from UI
                    const selector = `.task-item .task-actions .delete-btn[onclick="deleteTask(${deleteTaskId}, '${deleteTaskType}')"]`;
                    const deleteButton = document.querySelector(selector);
                    
                    if (deleteButton) {
                        const taskItem = deleteButton.closest('.task-item');
                        taskItem.classList.add('fade-out');
                        
                        setTimeout(() => {
                            taskItem.remove();
                            
                            // Check if list is now empty
                            const tabId = deleteTaskType + 's-tab';
                            const tasksContainer = document.querySelector(`#${tabId} .tasks-list`);
                            if (tasksContainer && tasksContainer.children.length === 0) {
                                // Show empty state
                                const emptyTasks = document.createElement('div');
                                emptyTasks.className = 'empty-tasks';
                                emptyTasks.innerHTML = `
                                    <p>You don't have any ${deleteTaskType} tasks yet.</p>
                                    <a href="task_create.php?type=${deleteTaskType}" class="add-task-btn">Add Your First ${deleteTaskType.charAt(0).toUpperCase() + deleteTaskType.slice(1)}</a>
                                `;
                                
                                document.querySelector(`#${tabId}`).innerHTML = '';
                                document.querySelector(`#${tabId}`).appendChild(emptyTasks);
                            }
                            
                            // Update task count
                            const tabCount = document.querySelector(`.tab[onclick="changeTab('${deleteTaskType}s')"] .task-count`);
                            if (tabCount) {
                                tabCount.textContent = parseInt(tabCount.textContent) - 1;
                            }
                        }, 300);
                    }
                } else {
                    // Close modal and show error
                    closeDeleteModal();
                    alert('Error deleting task: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                closeDeleteModal();
                alert('An error occurred while deleting the task');
            });
        }
        
        function closeRewardModal() {
            document.getElementById('reward-modal').style.display = 'none';
        }
    </script>
</body>
</html>