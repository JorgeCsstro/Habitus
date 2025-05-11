// pages/task_create.php
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

// Get task types for dropdown
$taskTypesQuery = "SELECT * FROM task_types";
$taskTypesResult = $conn->query($taskTypesQuery);
$taskTypes = [];
while ($row = $taskTypesResult->fetch_assoc()) {
    $taskTypes[] = $row;
}

// Initialize variables
$taskType = isset($_GET['type']) ? $_GET['type'] : 'daily';
$success = $error = '';

// Check if form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $title = trim($_POST['title']);
    $description = trim($_POST['description']);
    $difficulty = $_POST['difficulty'];
    $typeId = intval($_POST['type_id']);
    $duration = intval($_POST['duration']);
    
    // Validate form data
    if (empty($title)) {
        $error = "Task title is required";
    } else {
        // Calculate HCoin reward based on difficulty and duration
        $baseReward = 0;
        switch ($difficulty) {
            case 'easy':
                $baseReward = 10;
                break;
            case 'medium':
                $baseReward = 20;
                break;
            case 'hard':
                $baseReward = 35;
                break;
            case 'expert':
                $baseReward = 50;
                break;
        }
        
        // Duration multiplier (in minutes)
        $durationMultiplier = 1;
        if ($duration >= 60) { // More than an hour
            $durationMultiplier = 1.5;
        } elseif ($duration >= 30) { // More than 30 minutes
            $durationMultiplier = 1.25;
        }
        
        $hcoinReward = round($baseReward * $durationMultiplier);
        
        // Begin transaction
        $conn->begin_transaction();
        
        try {
            // Insert into tasks table
            $insertTask = "INSERT INTO tasks (user_id, type_id, title, description, difficulty, 
                          duration, hcoin_reward, is_custom, created_at) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())";
            $stmt = $conn->prepare($insertTask);
            $stmt->bind_param("iisssii", $_SESSION['user_id'], $typeId, $title, $description, 
                             $difficulty, $duration, $hcoinReward);
            $stmt->execute();
            
            $taskId = $conn->insert_id;
            
            // Get task type name
            $typeQuery = "SELECT name FROM task_types WHERE id = ?";
            $stmt = $conn->prepare($typeQuery);
            $stmt->bind_param("i", $typeId);
            $stmt->execute();
            $typeResult = $stmt->get_result();
            $typeName = $typeResult->fetch_assoc()['name'];
            
            // Insert into specific task type table
            if ($typeName === 'Daily') {
                $insertDaily = "INSERT INTO dailies (task_id, current_streak, highest_streak, reset_time) 
                               VALUES (?, 0, 0, '00:00:00')";
                $stmt = $conn->prepare($insertDaily);
                $stmt->bind_param("i", $taskId);
                $stmt->execute();
            } elseif ($typeName === 'Goal') {
                // Get deadline if specified
                $deadline = !empty($_POST['deadline']) ? $_POST['deadline'] : null;
                $totalSteps = isset($_POST['total_steps']) ? intval($_POST['total_steps']) : 1;
                
                $insertGoal = "INSERT INTO goals (task_id, deadline, progress, total_steps) 
                              VALUES (?, ?, 0, ?)";
                $stmt = $conn->prepare($insertGoal);
                $stmt->bind_param("isi", $taskId, $deadline, $totalSteps);
                $stmt->execute();
            } elseif ($typeName === 'Challenge') {
                // Get challenge dates
                $startDate = !empty($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d');
                $endDate = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
                
                $insertChallenge = "INSERT INTO challenges (task_id, start_date, end_date, is_completed) 
                                   VALUES (?, ?, ?, 0)";
                $stmt = $conn->prepare($insertChallenge);
                $stmt->bind_param("iss", $taskId, $startDate, $endDate);
                $stmt->execute();
            }
            
            // Commit transaction
            $conn->commit();
            
            $success = "Task created successfully!";
            
            // Reset form data
            $title = $description = '';
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            $error = "Error creating task: " . $e->getMessage();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Task - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../css/main.css">
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

            <!-- Task Creation Content -->
            <div class="tasks-content">
                <div class="content-header">
                    <h2>Create New Task</h2>
                    <a href="tasks.php" class="back-button">← Back to Tasks</a>
                </div>

                <?php if ($success): ?>
                    <div class="alert alert-success">
                        <?php echo $success; ?>
                    </div>
                <?php endif; ?>

                <?php if ($error): ?>
                    <div class="alert alert-error">
                        <?php echo $error; ?>
                    </div>
                <?php endif; ?>

                <div class="task-form-container">
                    <form method="POST" class="task-form">
                        <div class="form-group">
                            <label for="title">Task Title</label>
                            <input type="text" id="title" name="title" value="<?php echo isset($title) ? htmlspecialchars($title) : ''; ?>" required>
                        </div>

                        <div class="form-group">
                            <label for="description">Description (optional)</label>
                            <textarea id="description" name="description" rows="3"><?php echo isset($description) ? htmlspecialchars($description) : ''; ?></textarea>
                        </div>

                        <div class="form-group">
                            <label for="type_id">Task Type</label>
                            <select id="type_id" name="type_id" onchange="showAdditionalFields()">
                                <?php foreach ($taskTypes as $type): ?>
                                    <option value="<?php echo $type['id']; ?>" 
                                            <?php echo (strtolower($type['name']) === $taskType) ? 'selected' : ''; ?>
                                            data-name="<?php echo strtolower($type['name']); ?>">
                                        <?php echo $type['name']; ?> (<?php echo $type['hcoin_multiplier']; ?>x multiplier)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="difficulty">Difficulty</label>
                            <select id="difficulty" name="difficulty">
                                <option value="easy">Easy (10 HCoins)</option>
                                <option value="medium" selected>Medium (20 HCoins)</option>
                                <option value="hard">Hard (35 HCoins)</option>
                                <option value="expert">Expert (50 HCoins)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="duration">Estimated Duration (minutes)</label>
                            <input type="number" id="duration" name="duration" min="1" value="15">
                            <span class="hint">Longer tasks earn more HCoins</span>
                        </div>

                        <!-- Additional fields for specific task types -->
                        <div id="daily-fields" class="type-specific-fields">
                            <div class="form-group">
                                <label for="reset_time">Reset Time</label>
                                <input type="time" id="reset_time" name="reset_time" value="00:00">
                                <span class="hint">When should this daily reset?</span>
                            </div>
                        </div>

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

                        <div id="challenge-fields" class="type-specific-fields" style="display: none;">
                            <div class="form-group">
                                <label for="start_date">Start Date</label>
                                <input type="date" id="start_date" name="start_date" value="<?php echo date('Y-m-d'); ?>">
                            </div>
                            <div class="form-group">
                                <label for="end_date">End Date</label>
                                <input type="date" id="end_date" name="end_date" value="<?php echo date('Y-m-d', strtotime('+7 days')); ?>">
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
                            <button type="submit" class="create-button">Create Task</button>
                            <a href="tasks.php" class="cancel-button">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showAdditionalFields() {
            const typeSelect = document.getElementById('type_id');
            const typeName = typeSelect.options[typeSelect.selectedIndex].dataset.name;
            
            // Hide all specific fields
            document.querySelectorAll('.type-specific-fields').forEach(field => {
                field.style.display = 'none';
            });
            
            // Show fields for selected type
            document.getElementById(typeName + '-fields').style.display = 'block';
            
            // Update reward calculation
            updateRewardCalculation();
        }
        
        function updateRewardCalculation() {
            const difficulty = document.getElementById('difficulty').value;
            const duration = parseInt(document.getElementById('duration').value);
            const typeSelect = document.getElementById('type_id');
            const typeMultiplier = parseFloat(typeSelect.options[typeSelect.selectedIndex].textContent.match(/\(([^)]+)x/)[1]);
            
            // Base reward based on difficulty
            let baseReward = 0;
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
            
            // Calculate final reward
            const reward = Math.round(baseReward * durationMultiplier * typeMultiplier);
            
            // Update display
            document.getElementById('base-reward').textContent = baseReward;
            document.getElementById('duration-multiplier').textContent = durationMultiplier.toFixed(2);
            document.getElementById('type-multiplier').textContent = typeMultiplier.toFixed(2);
            document.getElementById('reward-amount').textContent = reward;
        }
        
        // Set up event listeners
        document.addEventListener('DOMContentLoaded', function() {
            showAdditionalFields();
            
            document.getElementById('difficulty').addEventListener('change', updateRewardCalculation);
            document.getElementById('duration').addEventListener('input', updateRewardCalculation);
            document.getElementById('type_id').addEventListener('change', updateRewardCalculation);
        });
    </script>
</body>
</html>