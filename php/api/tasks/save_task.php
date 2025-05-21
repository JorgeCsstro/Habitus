<?php
// This is a modification for php/api/tasks/save_task.php

// php/api/tasks/save_task.php
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

// Get form data
$taskId = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$taskType = isset($_POST['task_type']) ? $_POST['task_type'] : '';
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';
$difficulty = isset($_POST['difficulty']) ? $_POST['difficulty'] : 'medium';

// Duration only applies to Daily tasks now
$duration = null;
if ($taskType === 'daily') {
    $duration = isset($_POST['duration']) ? intval($_POST['duration']) : 15;
}

$hcoinReward = isset($_POST['hcoin_reward']) ? intval($_POST['hcoin_reward']) : 0;
$useSubtasks = isset($_POST['use_subtasks']) ? (bool)$_POST['use_subtasks'] : true;

// Validate data
if (empty($title) || !in_array($taskType, ['daily', 'goal', 'challenge'])) {
    echo json_encode(['success' => false, 'message' => 'Please provide valid task data']);
    exit;
}

// Begin transaction
try {
    $conn->beginTransaction();
    
    // Get the task type ID
    $typeQuery = "SELECT id FROM task_types WHERE name = ?";
    $stmt = $conn->prepare($typeQuery);
    $stmt->execute([ucfirst($taskType)]);
    $typeResult = $stmt->fetch();
    
    if (!$typeResult) {
        throw new Exception("Invalid task type");
    }
    
    $typeId = $typeResult['id'];
    
    if ($taskId > 0) {
        // Update existing task
        $updateTask = "UPDATE tasks SET 
                      title = ?, description = ?, difficulty = ?, 
                      duration = ?, hcoin_reward = ? 
                      WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($updateTask);
        $stmt->execute([
            $title, $description, $difficulty, 
            $duration, $hcoinReward, $taskId, $_SESSION['user_id']
        ]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Task not found or you don't have permission to update it");
        }
    } else {
        // Create new task
        $insertTask = "INSERT INTO tasks (user_id, type_id, title, description, 
                      difficulty, duration, hcoin_reward, is_custom, created_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())";
        $stmt = $conn->prepare($insertTask);
        $stmt->execute([
            $_SESSION['user_id'], $typeId, $title, $description,
            $difficulty, $duration, $hcoinReward
        ]);
        
        $taskId = $conn->lastInsertId();
    }
    
    // Handle task type specific data
    if ($taskType === 'daily') {
        $resetTime = isset($_POST['reset_time']) ? $_POST['reset_time'] : '00:00:00';
        
        if ($taskId > 0 && isset($_POST['task_id']) && intval($_POST['task_id']) > 0) {
            // Update existing daily
            $updateDaily = "UPDATE dailies SET reset_time = ? WHERE task_id = ?";
            $stmt = $conn->prepare($updateDaily);
            $stmt->execute([$resetTime, $taskId]);
        } else {
            // Create new daily
            $insertDaily = "INSERT INTO dailies (task_id, current_streak, highest_streak, reset_time) 
                           VALUES (?, 0, 0, ?)";
            $stmt = $conn->prepare($insertDaily);
            $stmt->execute([$taskId, $resetTime]);
        }
    } elseif ($taskType === 'goal') {
        $deadline = isset($_POST['deadline']) ? $_POST['deadline'] : null;
        
        if ($taskId > 0 && isset($_POST['task_id']) && intval($_POST['task_id']) > 0) {
            // Update existing goal
            $updateGoal = "UPDATE goals SET deadline = ?, use_subtasks = ? WHERE task_id = ?";
            $stmt = $conn->prepare($updateGoal);
            $stmt->execute([$deadline, $useSubtasks ? 1 : 0, $taskId]);
        } else {
            // Create new goal
            $insertGoal = "INSERT INTO goals (task_id, deadline, progress, total_steps, use_subtasks) 
                          VALUES (?, ?, 0, 1, ?)";
            $stmt = $conn->prepare($insertGoal);
            $stmt->execute([$taskId, $deadline, $useSubtasks ? 1 : 0]);
        }
    } elseif ($taskType === 'challenge') {
        $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d');
        $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : null;
        
        if ($taskId > 0 && isset($_POST['task_id']) && intval($_POST['task_id']) > 0) {
            // Update existing challenge
            $updateChallenge = "UPDATE challenges SET start_date = ?, end_date = ?, use_subtasks = ? WHERE task_id = ?";
            $stmt = $conn->prepare($updateChallenge);
            $stmt->execute([$startDate, $endDate, $useSubtasks ? 1 : 0, $taskId]);
        } else {
            // Create new challenge
            $insertChallenge = "INSERT INTO challenges (task_id, start_date, end_date, is_completed, use_subtasks) 
                               VALUES (?, ?, ?, 0, ?)";
            $stmt = $conn->prepare($insertChallenge);
            $stmt->execute([$taskId, $startDate, $endDate, $useSubtasks ? 1 : 0]);
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'task_id' => $taskId,
        'message' => $taskId > 0 && isset($_POST['task_id']) && intval($_POST['task_id']) > 0 
            ? 'Task updated successfully' 
            : 'Task created successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>