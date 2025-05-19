<?php
// php/api/tasks/complete.php
require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$taskId = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$taskType = isset($_POST['task_type']) ? $_POST['task_type'] : '';

// Validate data
if ($taskId <= 0 || !in_array($taskType, ['daily', 'goal', 'challenge'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid task data']);
    exit;
}

// Get user ID
$userId = $_SESSION['user_id'];

// Begin transaction
try {
    $conn->beginTransaction();

    // Get task details
    $taskQuery = "SELECT t.*, tt.hcoin_multiplier 
                 FROM tasks t 
                 JOIN task_types tt ON t.type_id = tt.id 
                 WHERE t.id = ? AND t.user_id = ?";
    $stmt = $conn->prepare($taskQuery);
    $stmt->execute([$taskId, $userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Task not found or does not belong to you");
    }
    
    $taskData = $stmt->fetch();
    $hcoinsEarned = $taskData['hcoin_reward'] * $taskData['hcoin_multiplier'];
    
    // Update based on task type
    if ($taskType === 'daily') {
        // Check if daily is already completed today
        $dailyQuery = "SELECT * FROM dailies WHERE task_id = ?";
        $stmt = $conn->prepare($dailyQuery);
        $stmt->execute([$taskId]);
        $dailyData = $stmt->fetch();
        
        $today = date('Y-m-d');
        if ($dailyData['last_completed'] === $today) {
            throw new Exception("Task already completed today");
        }
        
        // Calculate streak
        $currentStreak = $dailyData['current_streak'];
        $highestStreak = $dailyData['highest_streak'];
        
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        if ($dailyData['last_completed'] === $yesterday) {
            // Continue streak
            $currentStreak++;
        } else {
            // Streak broken
            $currentStreak = 1;
        }
        
        if ($currentStreak > $highestStreak) {
            $highestStreak = $currentStreak;
        }
        
        // Streak bonus (5% per day, max 50%)
        $streakBonus = min(0.5, ($currentStreak - 1) * 0.05);
        $hcoinsEarned *= (1 + $streakBonus);
        
        // Update daily
        $updateDaily = "UPDATE dailies SET current_streak = ?, highest_streak = ?, 
                       last_completed = ? WHERE task_id = ?";
        $stmt = $conn->prepare($updateDaily);
        $stmt->execute([$currentStreak, $highestStreak, $today, $taskId]);
        
        $streak = $currentStreak;
    } elseif ($taskType === 'goal') {
        // Get goal info
        $goalQuery = "SELECT * FROM goals WHERE task_id = ?";
        $stmt = $conn->prepare($goalQuery);
        $stmt->execute([$taskId]);
        $goalData = $stmt->fetch();
        
        // Check if task uses subtasks
        $useSubtasks = $goalData['use_subtasks'];
        
        if ($useSubtasks) {
            // Check if all subtasks are completed
            $subtasksQuery = "SELECT COUNT(*) as total, SUM(is_completed) as completed 
                             FROM subtasks WHERE parent_task_id = ?";
            $stmt = $conn->prepare($subtasksQuery);
            $stmt->execute([$taskId]);
            $subtasksData = $stmt->fetch();
            
            // If there are subtasks and not all are completed, return error
            if ($subtasksData['total'] > 0 && $subtasksData['total'] != $subtasksData['completed']) {
                throw new Exception("Please complete all subtasks before completing this goal");
            }
        }
        
        // Mark goal as completed
        $updateGoal = "UPDATE goals SET completed = 1 WHERE task_id = ?";
        $stmt = $conn->prepare($updateGoal);
        $stmt->execute([$taskId]);
        
        $completed = true;
    } elseif ($taskType === 'challenge') {
        // THIS IS WHERE TO ADD THE CHALLENGE SUBTASKS CHECK
        // Check if task uses subtasks
        $challengeQuery = "SELECT use_subtasks FROM challenges WHERE task_id = ?";
        $stmt = $conn->prepare($challengeQuery);
        $stmt->execute([$taskId]);
        $useSubtasks = $stmt->fetch()['use_subtasks'];
        
        if ($useSubtasks) {
            // Check if all subtasks are completed
            $subtasksQuery = "SELECT COUNT(*) as total, SUM(is_completed) as completed 
                             FROM subtasks WHERE parent_task_id = ?";
            $stmt = $conn->prepare($subtasksQuery);
            $stmt->execute([$taskId]);
            $subtasksData = $stmt->fetch();
            
            // If there are subtasks and not all are completed, return error
            if ($subtasksData['total'] > 0 && $subtasksData['total'] != $subtasksData['completed']) {
                throw new Exception("Please complete all subtasks before completing this challenge");
            }
        }
        
        // Complete challenge (keep your existing challenge logic here)
        $updateChallenge = "UPDATE challenges SET is_completed = 1 WHERE task_id = ?";
        $stmt = $conn->prepare($updateChallenge);
        $stmt->execute([$taskId]);
        
        $completed = true;
    }
    
    // Add HCoins to user
    $hcoinsEarned = round($hcoinsEarned);
    $updateUser = "UPDATE users SET hcoin = hcoin + ? WHERE id = ?";
    $stmt = $conn->prepare($updateUser);
    $stmt->execute([$hcoinsEarned, $userId]);
    
    // Record transaction
    $transactionDesc = "Completed " . ucfirst($taskType) . ": " . $taskData['title'];
    $insertTransaction = "INSERT INTO transactions (user_id, amount, description, 
                         transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'earn', ?, 'task')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->execute([$userId, $hcoinsEarned, $transactionDesc, $taskId]);
    
    // Get updated balance
    $balanceQuery = "SELECT hcoin FROM users WHERE id = ?";
    $stmt = $conn->prepare($balanceQuery);
    $stmt->execute([$userId]);
    $newBalance = $stmt->fetch()['hcoin'];
    
    // Commit transaction
    $conn->commit();
    
    // Return success response
    $response = [
        'success' => true,
        'hcoins_earned' => $hcoinsEarned,
        'new_balance' => $newBalance,
        'message' => 'Task completed successfully'
    ];
    
    // Add task-specific data
    if ($taskType === 'daily') {
        $response['streak'] = $streak;
    } elseif ($taskType === 'goal') {
        $response['progress'] = $progress;
        $response['total'] = $totalSteps;
        $response['completed'] = $completed;
    } elseif ($taskType === 'challenge') {
        $response['completed'] = $completed;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>