<?php
// pages/tasks.php

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

$currentLanguage = $userData['language'] ?? 'en';
$currentTheme = $userData['theme'] ?? 'light';

// Get tab selection from URL parameter
$activeTab = isset($_GET['tab']) ? $_GET['tab'] : 'dailies';

// Get tasks data
$dailies = getUserDailies($_SESSION['user_id']);
$goals = getUserGoals($_SESSION['user_id']);
$challenges = getUserChallenges($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tasks - <?php echo SITE_NAME; ?></title>
    
        <!-- REQUIRED: Theme CSS - Add this to ALL pages -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Your existing CSS files AFTER theme CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/tasks.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
</head>
<body class="theme-<?php echo $currentTheme; ?>">
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
                    <button class="create-task-btn" id="create-task-button">+ New Task</button>
                </div>

                <div class="tasks-tabs">
                    <div class="tab <?php echo $activeTab === 'dailies' ? 'active' : ''; ?>" 
                         onclick="changeTab('dailies')">
                        <span>Dailies</span>
                        <span class="task-count"><?php echo count($dailies); ?></span>
                    </div>
                    <div class="tab <?php echo $activeTab === 'goals' ? 'active' : ''; ?>" 
                         onclick="changeTab('goals')">
                        <span>Goals</span>
                        <span class="task-count"><?php echo count($goals); ?></span>
                    </div>
                    <div class="tab <?php echo $activeTab === 'challenges' ? 'active' : ''; ?>" 
                         onclick="changeTab('challenges')">
                        <span>Challenges</span>
                        <span class="task-count"><?php echo count($challenges); ?></span>
                    </div>
                </div>

                <!-- Dailies Tab -->
                <div class="tab-content <?php echo $activeTab === 'dailies' ? 'active' : ''; ?>" id="dailies-tab">
                    <?php if (empty($dailies)): ?>
                        <div class="empty-tasks">
                            <p>You don't have any daily tasks yet.</p>
                            <button class="add-task-btn" onclick="openTaskModal('daily')">Add Your First Daily</button>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list dailies-list">
                            <?php foreach ($dailies as $daily): ?>
                                <div class="task-item <?php echo $daily['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($daily['title']); ?></h3>
                                            <?php if (!empty($daily['description'])): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($daily['description']); ?></p>
                                             <?php endif; ?>
                                             <div class="task-meta">
                                                <span class="difficulty <?php echo $daily['difficulty']; ?>">
                                                    <?php echo ucfirst($daily['difficulty']); ?>
                                                <span class="difficulty <?php echo isset($daily['difficulty']) ? $daily['difficulty'] : 'medium'; ?>">
                                                    <?php echo ucfirst(isset($daily['difficulty']) ? $daily['difficulty'] : 'medium'); ?>
                                                 </span>
                                                 <span class="reward">
                                                     <img src="../images/icons/hcoin-icon.webp" alt="HCoin">
                                                    <?php echo $daily['hcoin_reward']; ?>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="task-stats">
                                            <div class="streak">
                                                <img src="../images/icons/streak.webp" alt="Streak">
                                                <span><?php echo $daily['current_streak']; ?></span>
                                                <span class="label">Current Streak</span>
                                            </div>
                                            <div class="best-streak">
                                                <img src="../images/icons/best-streak.webp" alt="Best">
                                                <span><?php echo $daily['highest_streak']; ?></span>
                                                <span class="label">Best Streak</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <?php if ($daily['completed']): ?>
                                            <button class="complete-btn done" disabled>
                                                <img src="../images/icons/check.webp" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="complete-btn" onclick="completeTask(<?php echo $daily['id']; ?>, 'daily')">
                                                <img src="../images/icons/check.webp" alt="Complete">
                                                Complete
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="openTaskModal('daily', <?php echo $daily['id']; ?>)">
                                            <img src="../images/icons/edit-icon.webp" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $daily['id']; ?>, 'daily')">
                                            <img src="../images/icons/trash.webp" alt="Delete">
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
                            <button class="add-task-btn" onclick="openTaskModal('goal')">Add Your First Goal</button>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list goals-list">
                            <?php foreach ($goals as $goal): ?>
                                <div class="task-item <?php echo $goal['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($goal['title']); ?></h3>
                                            <?php if (!empty($goal['description'])): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($goal['description']); ?></p>
                                            <?php endif; ?>
                                            <div class="task-meta">
                                                <span class="difficulty <?php echo isset($goal['difficulty']) ? $goal['difficulty'] : 'medium'; ?>">
                                                    <?php echo ucfirst(isset($goal['difficulty']) ? $goal['difficulty'] : 'medium'); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-icon.webp" alt="HCoin">
                                                    <?php echo $goal['hcoin_reward']; ?>
                                                </span>
                                                <?php if (!empty($goal['deadline'])): ?>
                                                    <span class="deadline">
                                                        <img src="../images/icons/calendar.webp" alt="Deadline">
                                                        <?php echo date('M j, Y', strtotime($goal['deadline'])); ?>
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            <?php 
                                                $total = countSubtasks($goal['id']);
                                                $completed = countCompletedSubtasks($goal['id']);
                                                if ($total > 0): 
                                            ?>
                                            <div class="subtask-progress">
                                                <div class="progress-bar">
                                                    <div class="progress" style="width: <?php echo ($completed / $total) * 100; ?>%"></div>
                                                </div>
                                                <div class="progress-text">
                                                    <span><?php echo $completed; ?> / <?php echo $total; ?> subtasks</span>
                                                    <span class="percentage"><?php echo round(($completed / $total) * 100); ?>%</span>
                                                </div>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                        <!-- Remove task-progress section completely -->
                                    </div>
                                    <div class="task-actions">
                                        <?php if ($goal['completed']): ?>
                                            <button class="complete-btn done" disabled>
                                                <img src="../images/icons/check.webp" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="manage-subtasks-btn" onclick="showSubtasks(<?php echo $goal['id']; ?>, 'goal')">
                                                <img src="../images/icons/subtasks.webp" alt="Subtasks">
                                                Subtasks
                                                <span class="subtask-count"><?php echo countSubtasks($goal['id']); ?></span>
                                            </button>
                                            <!-- Change button text from "Complete Step" to "Complete" -->
                                            <button class="complete-btn" onclick="completeTask(<?php echo $goal['id']; ?>, 'goal')">
                                                <img src="../images/icons/check.webp" alt="Complete">
                                                Complete
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="openTaskModal('goal', <?php echo $goal['id']; ?>)">
                                            <img src="../images/icons/edit-icon.webp" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $goal['id']; ?>, 'goal')">
                                            <img src="../images/icons/trash.webp" alt="Delete">
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
                            <p>You don't have any challenges yet.</p>
                            <button class="add-task-btn" onclick="openTaskModal('challenge')">Add Your First Challenge</button>
                        </div>
                    <?php else: ?>
                        <div class="tasks-list challenges-list">
                            <?php foreach ($challenges as $challenge): ?>
                                <div class="task-item <?php echo $challenge['completed'] ? 'completed' : ''; ?>">
                                    <div class="task-content">
                                        <div class="task-info">
                                            <h3><?php echo htmlspecialchars($challenge['title']); ?></h3>
                                            <?php if (!empty($challenge['description'])): ?>
                                                <p class="task-description"><?php echo htmlspecialchars($challenge['description']); ?></p>
                                            <?php endif; ?>
                                            <div class="task-meta">
                                                <span class="difficulty <?php echo isset($challenge['difficulty']) ? $challenge['difficulty'] : 'medium'; ?>">
                                                    <?php echo ucfirst(isset($challenge['difficulty']) ? $challenge['difficulty'] : 'medium'); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-icon.webp" alt="HCoin">
                                                    <?php echo $challenge['hcoin_reward']; ?>
                                                </span>
                                            </div>
                                            <?php 
                                                $total = countSubtasks($challenge['id']);
                                                $completed = countCompletedSubtasks($challenge['id']);
                                                if ($total > 0): 
                                            ?>
                                            <div class="subtask-progress">
                                                <div class="progress-bar">
                                                    <div class="progress" style="width: <?php echo ($completed / $total) * 100; ?>%"></div>
                                                </div>
                                                <div class="progress-text">
                                                    <span><?php echo $completed; ?> / <?php echo $total; ?> subtasks</span>
                                                    <span class="percentage"><?php echo round(($completed / $total) * 100); ?>%</span>
                                                </div>
                                            </div>
                                            <?php endif; ?>
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
                                                <img src="../images/icons/check.webp" alt="Done">
                                                Completed
                                            </button>
                                        <?php else: ?>
                                            <button class="manage-subtasks-btn" onclick="showSubtasks(<?php echo $challenge['id']; ?>, 'challenge')">
                                                <img src="../images/icons/subtasks.webp" alt="Subtasks">
                                                Subtasks
                                                <span class="subtask-count"><?php echo countSubtasks($challenge['id']); ?></span>
                                            </button>
                                            <button class="complete-btn" onclick="completeTask(<?php echo $challenge['id']; ?>, 'challenge')">
                                                <img src="../images/icons/check.webp" alt="Complete">
                                                Complete
                                            </button>
                                        <?php endif; ?>
                                        <button class="edit-btn" onclick="openTaskModal('challenge', <?php echo $challenge['id']; ?>)">
                                            <img src="../images/icons/edit-icon.webp" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $challenge['id']; ?>, 'challenge')">
                                            <img src="../images/icons/trash.webp" alt="Delete">
                                        </button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Task Creation/Edit Modal -->
            <div id="task-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title">Create New Task</h2>
                        <button class="close-modal" onclick="closeTaskModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="task-form">
                            <input type="hidden" id="task-id" name="task_id" value="0">
                            <input type="hidden" id="task-type" name="task_type" value="daily">
                                                    
                            <div class="form-group">
                                <label for="title">Task Title</label>
                                <input type="text" id="title" name="title" placeholder="Enter task title" required>
                            </div>
                                                    
                            <div class="form-group">
                                <label for="description">Description (optional)</label>
                                <textarea id="description" name="description" rows="3" placeholder="Add details about your task"></textarea>
                            </div>
                                                    
                            <div class="form-group">
                                <label for="difficulty">Difficulty</label>
                                <select id="difficulty" name="difficulty" onchange="updateRewardCalculation()">
                                    <option value="easy">Easy (10 HCoins)</option>
                                    <option value="medium" selected>Medium (20 HCoins)</option>
                                    <option value="hard">Hard (35 HCoins)</option>
                                    <option value="expert">Expert (50 HCoins)</option>
                                </select>
                            </div>
                                                    
                            <!-- Duration field - only shown for dailies -->
                            <div class="form-group" id="duration-group">
                                <label for="duration">Estimated Duration (minutes)</label>
                                <input type="number" id="duration" name="duration" min="1" value="15" oninput="updateRewardCalculation()">
                                <span class="hint">Longer tasks earn more HCoins</span>
                            </div>
                                                    
                            <!-- Daily-specific fields -->
                            <div id="daily-fields" class="type-specific-fields">
                                <div class="form-group">
                                    <label for="reset_time">Reset Time</label>
                                    <input type="time" id="reset_time" name="reset_time" value="00:00">
                                    <span class="hint">When should this daily reset?</span>
                                </div>
                            </div>
                                                    
                            <!-- Goal-specific fields -->
                            <div id="goal-fields" class="type-specific-fields" style="display: none;">
                                <div class="form-group">
                                    <label for="deadline">Deadline (optional)</label>
                                    <input type="date" id="deadline" name="deadline">
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="use_subtasks" name="use_subtasks" checked>
                                        Break this task into subtasks
                                    </label>
                                    <span class="hint">Split your task into smaller, manageable steps</span>
                                </div>
                            </div>
                                                    
                            <!-- Challenge-specific fields -->
                            <div id="challenge-fields" class="type-specific-fields" style="display: none;">
                                <div class="form-group">
                                    <label for="start_date">Start Date</label>
                                    <input type="date" id="start_date" name="start_date">
                                </div>
                                <div class="form-group">
                                    <label for="end_date">End Date</label>
                                    <input type="date" id="end_date" name="end_date">
                                    <span class="hint">Challenge will expire after this date</span>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="use_subtasks" name="use_subtasks" checked>
                                        Break this task into subtasks
                                    </label>
                                    <span class="hint">Split your task into smaller, manageable steps</span>
                                </div>
                            </div>
                                                    
                            <div class="form-group reward-preview">
                                <label>Reward Preview</label>
                                <div class="reward-display">
                                    <span id="reward-amount">20</span> HCoins
                                    <div class="reward-calculation">
                                        Base: <span id="base-reward">20</span> × 
                                        Duration: <span id="duration-multiplier">1</span> × 
                                        Type: <span id="type-multiplier">1</span>
                                    </div>
                                </div>
                            </div>
                                                    
                            <div class="form-actions">
                                <button type="button" class="cancel-btn" onclick="closeTaskModal()">Cancel</button>
                                <button type="submit" class="save-btn" id="save-task-btn">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div id="delete-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Delete Task</h2>
                        <button class="close-modal" onclick="closeDeleteModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                        <div class="form-actions">
                            <button class="cancel-btn" onclick="closeDeleteModal()">Cancel</button>
                            <button class="delete-btn" id="confirm-delete-btn">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Completion Success Modal -->
            <div id="completion-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Task Completed!</h2>
                        <button class="close-modal" onclick="closeCompletionModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="completion-animation">
                            <img src="../images/icons/success.webp" alt="Success">
                        </div>
                        <p id="completion-message">You earned <span id="earned-hcoins">0</span> HCoins!</p>
                        
                        <div id="streak-bonus" style="display: none;">
                            <p>
                                <span class="streak-icon">🔥</span>
                                Current streak: <span id="current-streak">0</span> days
                            </p>
                        </div>
                        
                        <div class="form-actions">
                            <button class="primary-btn" onclick="closeCompletionModal()">Continue</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Add this to tasks.php, after the other modals -->

        <!-- Subtasks Modal -->
        <div id="subtasks-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="subtasks-modal-title">Manage Subtasks</h2>
                    <button class="close-modal" onclick="closeSubtasksModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="subtasks-container">
                        <h3>Current Subtasks</h3>
                        <div class="subtasks-list">
                            <!-- Subtasks will be loaded here -->
                            <div class="empty-subtasks">No subtasks yet. Add some to break down this task!</div>
                        </div>
                                                
                        <div class="subtask-form">
                            <h3>Add New Subtask</h3>
                            <input type="hidden" id="subtask-id" value="0">
                            <div class="form-group">
                                <label for="subtask-title">Title</label>
                                <input type="text" id="subtask-title" placeholder="Enter subtask title">
                            </div>
                            <div class="form-group">
                                <label for="subtask-description">Description (optional)</label>
                                <textarea id="subtask-description" rows="2" placeholder="Add details about this subtask"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-btn" onclick="resetSubtaskForm()">Reset</button>
                                <button type="button" class="save-btn" id="add-subtask-btn" onclick="createSubtask()">Add Subtask</button>
                            </div>
                            </div>
                        </div>
                        <div class="form-actions modal-footer">
                            <button type="button" class="primary-btn" onclick="closeSubtasksModal()">Done</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main JavaScript -->
    <script src="../js/main.js"></script>
    
    <script>
    // REQUIRED: Theme initialization for ALL pages
    window.initialTheme = '<?php echo $currentTheme; ?>';
    document.documentElement.setAttribute('data-theme', window.initialTheme);
    document.body.classList.add('theme-' + window.initialTheme);
    </script>

    <!-- Load theme manager on ALL pages -->
    <script src="../js/theme-manager.js"></script>

    <!-- Tasks-specific JavaScript -->
    <script src="../js/tasks.js"></script>

    <!-- Load translation manager -->
    <script src="../js/translation-manager.js"></script>
    <script>
        // Wait for the document to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Get a reference to the create task button
            const createTaskBtn = document.getElementById('create-task-button');
        
            // Add click event listener directly
            if (createTaskBtn) {
                createTaskBtn.addEventListener('click', function() {
                    // Determine which tab is active
                    const activeTab = document.querySelector('.tab-content.active');
                    let taskType = 'daily'; // Default
                
                    if (activeTab) {
                        if (activeTab.id === 'goals-tab') {
                            taskType = 'goal';
                        } else if (activeTab.id === 'challenges-tab') {
                            taskType = 'challenge';
                        }
                    }
                
                    // Manual implementation of what openTaskModal should do:
                
                    // 1. Reset the form
                    const taskForm = document.getElementById('task-form');
                    if (taskForm) taskForm.reset();
                
                    // 2. Set task type in the hidden input field
                    const taskTypeInput = document.getElementById('task-type');
                    if (taskTypeInput) taskTypeInput.value = taskType;
                
                    // 3. Set task ID to 0 (for new task)
                    const taskIdInput = document.getElementById('task-id');
                    if (taskIdInput) taskIdInput.value = '0';
                
                    // 4. Update modal title
                    const modalTitle = document.getElementById('modal-title');
                    if (modalTitle) {
                        const capitalizedType = taskType.charAt(0).toUpperCase() + taskType.slice(1);
                        modalTitle.textContent = `Create New ${capitalizedType}`;
                    }
                
                    // 5. Show appropriate fields based on task type
                    const typeSpecificFields = document.querySelectorAll('.type-specific-fields');
                    typeSpecificFields.forEach(field => {
                        field.style.display = 'none';
                    });
                
                    const specificField = document.getElementById(`${taskType}-fields`);
                    if (specificField) specificField.style.display = 'block';
                
                    // 6. Update reward calculation
                    try {
                        updateRewardCalculation();
                    } catch(e) {
                        console.error('Could not update reward calculation:', e);
                    }
                
                    // 7. Show the modal
                    const modal = document.getElementById('task-modal');
                    if (modal) {
                        modal.classList.add('show');
                        console.log('Modal should be visible now');
                    } else {
                        console.error('Modal element not found!');
                    }
                });
            } else {
                console.error('Create task button not found!');
            }
        });
    </script>
</body>
</html>