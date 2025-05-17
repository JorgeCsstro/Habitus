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

// Get tab selection from URL parameter
$activeTab = isset($_GET['tab']) ? $_GET['tab'] : 'dailies';

// Get tasks data
$dailies = getUserDailies($_SESSION['user_id']);
$goals = getUserGoals($_SESSION['user_id']);
$challenges = getUserChallenges($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
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
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
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
                                        <button class="edit-btn" onclick="openTaskModal('daily', <?php echo $daily['id']; ?>)">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $daily['id']; ?>, 'daily')">
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
                                                <span class="difficulty <?php echo $goal['difficulty']; ?>">
                                                    <?php echo ucfirst($goal['difficulty']); ?>
                                                </span>
                                                <span class="reward">
                                                    <img src="../images/icons/hcoin-small.svg" alt="HCoin">
                                                    <?php echo $goal['hcoin_reward']; ?>
                                                </span>
                                                <?php if (!empty($goal['deadline'])): ?>
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
                                        <button class="edit-btn" onclick="openTaskModal('goal', <?php echo $goal['id']; ?>)">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $goal['id']; ?>, 'goal')">
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
                                        <button class="edit-btn" onclick="openTaskModal('challenge', <?php echo $challenge['id']; ?>)">
                                            <img src="../images/icons/edit.svg" alt="Edit">
                                        </button>
                                        <button class="delete-btn" onclick="showDeleteConfirmation(<?php echo $challenge['id']; ?>, 'challenge')">
                                            <img src="../images/icons/trash.svg" alt="Delete">
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
                            
                            <div class="form-group">
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
                                    <label for="total_steps">Total Steps</label>
                                    <input type="number" id="total_steps" name="total_steps" min="1" value="1">
                                    <span class="hint">Break down your goal into steps</span>
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
        </div>
    </div>

    <!-- Main JavaScript -->
    <script src="../js/main.js"></script>
    <!-- Tasks-specific JavaScript -->
    <script src="../js/tasks.js"></script>
</body>
</html>