// php/api/tasks/complete.php
<?php
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
$conn->begin_transaction();

try {
    // Get task details
    $taskQuery = "SELECT t.*, tt.hcoin_multiplier 
                 FROM tasks t 
                 JOIN task_types tt ON t.type_id = tt.id 
                 WHERE t.id = ? AND t.user_id = ?";
    $stmt = $conn->prepare($taskQuery);
    $stmt->bind_param("ii", $taskId, $userId);
    $stmt->execute();
    $taskResult = $stmt->get_result();
    
    if ($taskResult->num_rows === 0) {
        throw new Exception("Task not found or does not belong to you");
    }
    
    $taskData = $taskResult->fetch_assoc();
    $hcoinsEarned = $taskData['hcoin_reward'] * $taskData['hcoin_multiplier'];
    
    // Update based on task type
    if ($taskType === 'daily') {
        // Check if daily is already completed today
        $dailyQuery = "SELECT * FROM dailies WHERE task_id = ?";
        $stmt = $conn->prepare($dailyQuery);
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        $dailyResult = $stmt->get_result();
        $dailyData = $dailyResult->fetch_assoc();
        
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
        $stmt->bind_param("iisi", $currentStreak, $highestStreak, $today, $taskId);
        $stmt->execute();
        
        $streak = $currentStreak;
    } elseif ($taskType === 'goal') {
        // Get goal info
        $goalQuery = "SELECT * FROM goals WHERE task_id = ?";
        $stmt = $conn->prepare($goalQuery);
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        $goalResult = $stmt->get_result();
        $goalData = $goalResult->fetch_assoc();
        
        // Increment progress
        $progress = $goalData['progress'] + 1;
        $totalSteps = $goalData['total_steps'];
        
        // Calculate hcoins based on progress
        if ($progress < $totalSteps) {
            $hcoinsEarned = $hcoinsEarned / $totalSteps;
        }
        
        // Update goal
        $updateGoal = "UPDATE goals SET progress = ? WHERE task_id = ?";
        $stmt = $conn->prepare($updateGoal);
        $stmt->bind_param("ii", $progress, $taskId);
        $stmt->execute();
        
        $completed = ($progress >= $totalSteps);
    } elseif ($taskType === 'challenge') {
        // Complete challenge
        $updateChallenge = "UPDATE challenges SET is_completed = 1 WHERE task_id = ?";
        $stmt = $conn->prepare($updateChallenge);
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        
        $completed = true;
    }
    
    // Add HCoins to user
    $hcoinsEarned = round($hcoinsEarned);
    $updateUser = "UPDATE users SET hcoin = hcoin + ? WHERE id = ?";
    $stmt = $conn->prepare($updateUser);
    $stmt->bind_param("ii", $hcoinsEarned, $userId);
    $stmt->execute();
    
    // Record transaction
    $transactionDesc = "Completed " . ucfirst($taskType) . ": " . $taskData['title'];
    $insertTransaction = "INSERT INTO transactions (user_id, amount, description, 
                         transaction_type, reference_id, reference_type) 
                         VALUES (?, ?, ?, 'earn', ?, 'task')";
    $stmt = $conn->prepare($insertTransaction);
    $stmt->bind_param("iisi", $userId, $hcoinsEarned, $transactionDesc, $taskId);
    $stmt->execute();
    
    // Get updated balance
    $balanceQuery = "SELECT hcoin FROM users WHERE id = ?";
    $stmt = $conn->prepare($balanceQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $balanceResult = $stmt->get_result();
    $newBalance = $balanceResult->fetch_assoc()['hcoin'];
    
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
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>