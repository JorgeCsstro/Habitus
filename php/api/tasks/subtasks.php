<?php
// php/api/tasks/subtasks.php
require_once '../../include/config.php';
require_once '../../include/db_connect.php';
require_once '../../include/auth.php';
require_once '../../include/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests (retrieve subtasks)
if ($method === 'GET') {
    $taskId = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;
    
    // Validate task ID
    if ($taskId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid task ID']);
        exit;
    }
    
    // Verify task belongs to user
    $taskQuery = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($taskQuery);
    $stmt->execute([$taskId, $_SESSION['user_id']]);
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Task not found or does not belong to you']);
        exit;
    }
    
    // Get subtasks
    $subtasks = getSubtasks($taskId);
    
    echo json_encode(['success' => true, 'subtasks' => $subtasks]);
    exit;
}

// Handle POST requests (create/update subtasks)
if ($method === 'POST') {
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid data format']);
        exit;
    }
    
    // Check action type
    $action = isset($data['action']) ? $data['action'] : '';
    
    switch ($action) {
        case 'create':
            // Create new subtask
            $taskId = isset($data['task_id']) ? intval($data['task_id']) : 0;
            $title = isset($data['title']) ? trim($data['title']) : '';
            $description = isset($data['description']) ? trim($data['description']) : '';
            
            // Validate data
            if ($taskId <= 0 || empty($title)) {
                echo json_encode(['success' => false, 'message' => 'Invalid subtask data']);
                exit;
            }
            
            // Verify task belongs to user
            $taskQuery = "SELECT id, type_id FROM tasks WHERE id = ? AND user_id = ?";
            $stmt = $conn->prepare($taskQuery);
            $stmt->execute([$taskId, $_SESSION['user_id']]);
            
            if ($stmt->rowCount() === 0) {
                echo json_encode(['success' => false, 'message' => 'Task not found or does not belong to you']);
                exit;
            }
            
            $taskData = $stmt->fetch();
            $typeId = $taskData['type_id'];
            
            // Verify task is a goal or challenge
            if ($typeId != 2 && $typeId != 3) { // 2 = Goal, 3 = Challenge
                echo json_encode(['success' => false, 'message' => 'Subtasks can only be added to goals and challenges']);
                exit;
            }
            
            // Create subtask
            $subtaskId = createSubtask($taskId, $title, $description);
            
            // Update goal progress if applicable
            if ($typeId == 2) {
                updateGoalProgress($taskId);
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Subtask created successfully',
                'subtask_id' => $subtaskId
            ]);
            break;
            
        case 'update':
            // Update subtask status
            $subtaskId = isset($data['subtask_id']) ? intval($data['subtask_id']) : 0;
            $completed = isset($data['completed']) ? (bool)$data['completed'] : false;
            
            // Validate data
            if ($subtaskId <= 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid subtask ID']);
                exit;
            }
            
            // Verify subtask exists and get parent task
            $subtaskQuery = "SELECT s.id, s.parent_task_id, t.user_id, t.type_id 
                            FROM subtasks s
                            JOIN tasks t ON s.parent_task_id = t.id
                            WHERE s.id = ?";
            $stmt = $conn->prepare($subtaskQuery);
            $stmt->execute([$subtaskId]);
            
            if ($stmt->rowCount() === 0) {
                echo json_encode(['success' => false, 'message' => 'Subtask not found']);
                exit;
            }
            
            $subtaskData = $stmt->fetch();
            
            // Verify parent task belongs to user
            if ($subtaskData['user_id'] != $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'You do not have permission to update this subtask']);
                exit;
            }
            
            // Update subtask status
            $updated = updateSubtaskStatus($subtaskId, $completed);
            
            // Update goal progress if applicable
            $taskId = $subtaskData['parent_task_id'];
            $typeId = $subtaskData['type_id'];
            
            if ($typeId == 2) {
                updateGoalProgress($taskId);
            }
            
            // Check if all subtasks are completed
            $allCompleted = areAllSubtasksCompleted($taskId);
            
            echo json_encode([
                'success' => $updated, 
                'message' => $updated ? 'Subtask updated successfully' : 'Failed to update subtask',
                'all_completed' => $allCompleted
            ]);
            break;
            
        case 'delete':
            // Delete subtask
            $subtaskId = isset($data['subtask_id']) ? intval($data['subtask_id']) : 0;
            
            // Validate data
            if ($subtaskId <= 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid subtask ID']);
                exit;
            }
            
            // Verify subtask exists and get parent task
            $subtaskQuery = "SELECT s.id, s.parent_task_id, t.user_id, t.type_id 
                            FROM subtasks s
                            JOIN tasks t ON s.parent_task_id = t.id
                            WHERE s.id = ?";
            $stmt = $conn->prepare($subtaskQuery);
            $stmt->execute([$subtaskId]);
            
            if ($stmt->rowCount() === 0) {
                echo json_encode(['success' => false, 'message' => 'Subtask not found']);
                exit;
            }
            
            $subtaskData = $stmt->fetch();
            
            // Verify parent task belongs to user
            if ($subtaskData['user_id'] != $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this subtask']);
                exit;
            }
            
            // Delete subtask
            $deleteQuery = "DELETE FROM subtasks WHERE id = ?";
            $stmt = $conn->prepare($deleteQuery);
            $stmt->execute([$subtaskId]);
            
            $deleted = $stmt->rowCount() > 0;
            
            // Update goal progress if applicable
            $taskId = $subtaskData['parent_task_id'];
            $typeId = $subtaskData['type_id'];
            
            if ($typeId == 2) {
                updateGoalProgress($taskId);
            }
            
            echo json_encode([
                'success' => $deleted, 
                'message' => $deleted ? 'Subtask deleted successfully' : 'Failed to delete subtask'
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
    
    exit;
}

// If not GET or POST, return error
echo json_encode(['success' => false, 'message' => 'Invalid request method']);