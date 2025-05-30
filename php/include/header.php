<!-- header.php -->
<header class="main-header">
    <div class="user-info">
        <h1 class="habitus-name"><?php echo htmlspecialchars($userHabitusName); ?></h1>
    </div>
    <div class="user-actions">
        <div class="hcoin-balance">
            <img src="../images/icons/hcoin-icon-light.webp" alt="HCoin">
            <span><?php echo number_format($userHCoins); ?></span>
        </div>
        <a href="survey.php" class="survey-button" title="Improve with feedback">
            <img src="../images/icons/survey-icon-light.webp" alt="Survey">
        </a>
        <div class="messages-button" id="messages-toggle" title="Notifications">
            <img src="../images/icons/messages-icon-light.webp" alt="Messages">
            <?php
            // Check if there are unread messages/notifications
            $unreadCount = getUnreadNotificationsCount($_SESSION['user_id']);
            if ($unreadCount > 0):
            ?>
            <span class="notification-badge"><?php echo $unreadCount; ?></span>
            <?php endif; ?>
        </div>
        <a href="settings.php" class="profile-button" title="Profile settings">
            <img src="../images/icons/profile-icon-light.webp" alt="Profile">
        </a>
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
                                    <img src="../images/icons/update-icon-light.webp" alt="Update">
                                <?php elseif ($notification['type'] == 'task'): ?>
                                    <img src="../images/icons/task-reminder-icon-light.webp" alt="Task Reminder">
                                <?php endif; ?>
                            </div>
                            <div class="notification-text">
                                <div class="notification-title"><?php echo htmlspecialchars($notification['title']); ?></div>
                                <div class="notification-message"><?php echo htmlspecialchars($notification['message']); ?></div>
                                <div class="notification-time"><?php echo formatNotificationTime($notification['created_at']); ?></div>
                            </div>
                        </div>
                        <button class="delete-notification" data-id="<?php echo $notification['id']; ?>">
                            <img src="../images/icons/trash-icon-light.webp" alt="Delete">
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