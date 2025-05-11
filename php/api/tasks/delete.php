// php/api/tasks/delete.php
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

// Begin transaction
$conn->begin_transaction();

try {
    // Verify task belongs to user
    $taskQuery = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($taskQuery);
    $stmt->bind_param("ii", $taskId, $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Task not found or does not belong to you");
    }
    
    // Delete task-specific record first
    switch ($taskType) {
        case 'daily':
            $deleteSpecific = "DELETE FROM dailies WHERE task_id = ?";
            break;
        case 'goal':
            $deleteSpecific = "DELETE FROM goals WHERE task_id = ?";
            break;
        case 'challenge':
            $deleteSpecific = "DELETE FROM challenges WHERE task_id = ?";
            break;
    }
    
    $stmt = $conn->prepare($deleteSpecific);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    
    // Delete main task record
    $deleteTask = "DELETE FROM tasks WHERE id = ?";
    $stmt = $conn->prepare($deleteTask);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>