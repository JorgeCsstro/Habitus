<!-- header.php -->
<header class="main-header">
    <div class="user-info">
        <h1 class="habitus-name"><?php echo htmlspecialchars($userHabitusName); ?></h1>
    </div>
    <div class="user-actions">
        <div class="hcoin-balance">
            <img src="../images/icons/hcoin-icon.webp" alt="HCoin">
            <span><?php echo number_format($userHCoins); ?></span>
        </div>
        <!-- Enhanced Theme Toggle with Animation -->
        <button class="theme-toggle-button enhanced" onclick="toggleTheme()" title="Toggle Theme">
            <div class="theme-toggle-inner">
                <span class="sun-icon">☀️</span>
                <span class="moon-icon">🌙</span>
            </div>
        </button>
        <a href="survey.php" class="survey-button" title="Improve with feedback">
            <img src="../images/icons/survey-icon.webp" alt="Survey">
        </a>
        <div class="messages-button" id="messages-toggle" title="Notifications">
            <img src="../images/icons/messages-icon.webp" alt="Messages">
            <?php
            // Check if there are unread messages/notifications
            $unreadCount = getUnreadNotificationsCount($_SESSION['user_id']);
            if ($unreadCount > 0):
            ?>
            <span class="notification-badge"><?php echo $unreadCount; ?></span>
            <?php endif; ?>
        </div>

        <!-- header.php (just the profile picture part) -->
        <div class="user-avatar">
            <a href="settings.php" class="profile-button" title="Profile settings">
                <?php
                // FIXED: Better profile picture path handling
                $profilePic = $userData['profile_picture'] ?? 'uploads/profile-icon.webp';

                // Create proper URL based on path type
                if (strpos($profilePic, 'http') === 0) {
                    // Absolute URL
                    $profileUrl = $profilePic;
                } else if (strpos($profilePic, '/') === 0) {
                    // Absolute path from root
                    $profileUrl = $profilePic;
                } else if (strpos($profilePic, 'uploads/') === 0) {
                    // Relative path from uploads - use absolute path
                    $profileUrl = '/' . $profilePic;
                } else {
                    // Default or other paths
                    $profileUrl = '../' . $profilePic;
                }

                // Add cache buster for uploaded images
                if (strpos($profilePic, 'uploads/profiles/') === 0) {
                    $fullPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $profilePic;
                    if (file_exists($fullPath)) {
                        $modTime = filemtime($fullPath);
                        $profileUrl .= '?v=' . $modTime;
                    }
                }
                ?>
                <img src="<?php echo htmlspecialchars($profileUrl); ?>" 
                     alt="Profile Picture"
                     onerror="this.src='../uploads/profile-icon.webp'">
            </a>
        </div>
    </div>
    
    <!-- Notifications dropdown (hidden by default) -->
    <div id="notifications-dropdown" class="notifications-dropdown">
        <div class="notifications-header">
            <h3>Notifications</h3>
            <button id="close-notifications" class="close-notifications">×</button>
        </div>
        <div class="notifications-list">
            <?php
            // Get user's notifications
            $notifications = getUserNotifications($_SESSION['user_id']);
            
            if (empty($notifications)):
            ?>
                <div class="empty-notifications">No notifications to display</div>
            <?php else: ?>
                <?php foreach ($notifications as $notification): ?>
                    <div class="notification-item <?php echo ($notification['read'] == 0) ? 'unread' : ''; ?>" 
                         data-id="<?php echo $notification['id']; ?>"
                         data-type="<?php echo $notification['type']; ?>"
                         <?php if ($notification['type'] == 'update'): ?>
                         data-action="popup"
                         <?php elseif ($notification['type'] == 'task'): ?>
                         data-action="redirect" 
                         data-redirect="tasks.php?id=<?php echo $notification['reference_id']; ?>"
                         <?php endif; ?>>
                        <div class="notification-content">
                            <div class="notification-icon">
                                <?php if ($notification['type'] == 'update'): ?>
                                    <img src="../images/icons/update-icon.webp" alt="Update">
                                <?php elseif ($notification['type'] == 'task'): ?>
                                    <img src="../images/icons/task-reminder-icon.webp" alt="Task Reminder">
                                <?php endif; ?>
                            </div>
                            <div class="notification-text">
                                <div class="notification-title"><?php echo htmlspecialchars($notification['title']); ?></div>
                                <div class="notification-message"><?php echo htmlspecialchars($notification['message']); ?></div>
                                <div class="notification-time"><?php echo formatNotificationTime($notification['created_at']); ?></div>
                            </div>
                        </div>
                        <button class="delete-notification" data-id="<?php echo $notification['id']; ?>">
                            <img src="../images/icons/trash-icon.webp" alt="Delete">
                        </button>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</header>

<!-- Update Notification Modal (hidden by default) -->
<div id="update-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="update-title"></h2>
            <button class="close-modal">×</button>
        </div>
        <div class="modal-body">
            <p id="update-message"></p>
            <div id="update-details"></div>
        </div>
        <div class="modal-footer">
            <button class="close-button">Close</button>
        </div>
    </div>
</div>

<!-- Include the header.js script -->
<script src="../js/header.js"></script>