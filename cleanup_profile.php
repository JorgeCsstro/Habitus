<?php
// cleanup_profile.php - Clean up profile picture database entries
session_start();
require_once 'php/include/config.php';
require_once 'php/include/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    die('Please log in first');
}

$userId = $_SESSION['user_id'];

// Get current profile picture
$stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
$stmt->execute([$userId]);
$currentPic = $stmt->fetchColumn();

echo "<h2>Profile Picture Cleanup</h2>";
echo "<p><strong>Current database value:</strong> " . htmlspecialchars($currentPic ?: 'NULL') . "</p>";

if (isset($_POST['reset'])) {
    // Reset to default
    $stmt = $conn->prepare("UPDATE users SET profile_picture = NULL WHERE id = ?");
    $stmt->execute([$userId]);
    echo "<p style='color: green;'>✅ Profile picture reset to default</p>";
    echo "<script>setTimeout(() => window.location.reload(), 1000);</script>";
}

if (isset($_POST['cleanup'])) {
    // Remove orphaned files
    $uploadsDir = __DIR__ . '/uploads/profiles/';
    $files = glob($uploadsDir . "profile_{$userId}_*");
    
    foreach ($files as $file) {
        if (file_exists($file)) {
            unlink($file);
            echo "<p style='color: orange;'>🗑️ Deleted: " . basename($file) . "</p>";
        }
    }
    
    // Reset database
    $stmt = $conn->prepare("UPDATE users SET profile_picture = NULL WHERE id = ?");
    $stmt->execute([$userId]);
    echo "<p style='color: green;'>✅ Cleanup complete</p>";
    echo "<script>setTimeout(() => window.location.reload(), 1000);</script>";
}

// Check for actual files
$uploadsDir = __DIR__ . '/uploads/profiles/';
$files = glob($uploadsDir . "profile_{$userId}_*");

echo "<h3>Your Profile Files on Server:</h3>";
if (empty($files)) {
    echo "<p>No files found</p>";
} else {
    foreach ($files as $file) {
        echo "<p>" . basename($file) . " (" . filesize($file) . " bytes)</p>";
    }
}
?>

<form method="post" style="margin: 20px 0;">
    <button name="reset" type="submit" style="background: orange; color: white; padding: 10px;">Reset Profile Picture</button>
    <button name="cleanup" type="submit" style="background: red; color: white; padding: 10px;">Full Cleanup (Delete Files + Reset)</button>
</form>

<p><a href="debug_uploads.php">← Back to Debug</a></p>