<?php
// pages/settings.php - Updated with enhanced theme system

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

// Get current settings
$currentLanguage = $userData['language'] ?? 'en';
$currentTheme = $userData['theme'] ?? 'light';
$currentSubscription = $userData['subscription_type'] ?? 'free';
$profilePicture = $userData['profile_picture'] ?? '../images/avatars/default.webp';

// Language options
$languages = [
    'en' => 'English',
    'es' => 'Español'
];

// Theme options with descriptions
$themes = [
    'light' => [
        'name' => 'Light',
        'description' => 'Classic light theme with warm colors'
    ],
    'dark' => [
        'name' => 'Dark',
        'description' => 'Modern dark theme for reduced eye strain'
    ]
];
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - <?php echo SITE_NAME; ?></title>
    
    <!-- Meta theme color for browser chrome -->
    <meta name="theme-color" content="<?php echo $currentTheme === 'dark' ? '#1a1a1a' : '#f9f5f0'; ?>">
    
    <!-- Core CSS with variables -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Theme CSS -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/settings.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    
    <!-- Enhanced Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="theme-<?php echo $currentTheme; ?>">
    <div class="main-container">
        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Settings Content -->
            <div class="settings-content">
                <div class="settings-header">
                    <h1>Settings</h1>
                    <p>Customize your Habitus Zone experience</p>
                </div>

                <!-- Profile Section -->
                <div class="settings-section">
                    <h2>Profile</h2>
                    <div class="settings-group">
                        <div class="profile-picture-section">
                            <div class="current-profile-picture">
                                <img src="<?php echo htmlspecialchars($profilePicture); ?>" alt="Profile Picture" id="profile-picture-preview">
                                <div class="profile-picture-overlay">
                                    <label for="profile-picture-upload" class="change-picture-btn">
                                        <img src="../images/icons/camera.webp" alt="Change">
                                        <span>Change Photo</span>
                                    </label>
                                </div>
                            </div>
                            <input type="file" id="profile-picture-upload" accept="image/*" style="display: none;" onchange="handleProfilePictureChange(this)">
                            <div class="profile-info">
                                <h3><?php echo htmlspecialchars($userData['username']); ?></h3>
                                <p><?php echo htmlspecialchars($userData['email']); ?></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Language Section -->
                <div class="settings-section">
                    <h2>Language</h2>
                    <div class="settings-group">
                        <label for="language-select" class="setting-label">
                            <div class="setting-info">
                                <span class="setting-title">Display Language</span>
                                <span class="setting-description">Choose your preferred language</span>
                            </div>
                            <select id="language-select" class="setting-select" onchange="changeLanguage(this.value)">
                                <?php foreach ($languages as $code => $name): ?>
                                    <option value="<?php echo $code; ?>" <?php echo $currentLanguage === $code ? 'selected' : ''; ?>>
                                        <?php echo $name; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                    </div>
                </div>

                <!-- Appearance Section - Enhanced -->
                <div class="settings-section">
                    <h2>Appearance</h2>
                    <div class="settings-group">
                        <div class="theme-selector">
                            <div class="theme-header">
                                <span class="setting-title">Theme</span>
                                <span class="setting-description">Choose between light and dark themes</span>
                            </div>
                            <div class="theme-options">
                                <?php foreach ($themes as $themeKey => $themeInfo): ?>
                                    <label class="theme-option <?php echo $currentTheme === $themeKey ? 'active' : ''; ?>" 
                                           data-theme="<?php echo $themeKey; ?>">
                                        <input type="radio" name="theme" value="<?php echo $themeKey; ?>" 
                                               <?php echo $currentTheme === $themeKey ? 'checked' : ''; ?>>
                                        
                                        <div class="theme-preview theme-<?php echo $themeKey; ?>">
                                            <div class="preview-header"></div>
                                            <div class="preview-content">
                                                <div class="preview-sidebar"></div>
                                                <div class="preview-main">
                                                    <div class="preview-card"></div>
                                                    <div class="preview-card"></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="theme-info">
                                            <span class="theme-name"><?php echo $themeInfo['name']; ?></span>
                                            <span class="theme-description"><?php echo $themeInfo['description']; ?></span>
                                        </div>
                                        
                                        <div class="theme-indicator">
                                            <?php if ($currentTheme === $themeKey): ?>
                                                <span class="current-badge">Current</span>
                                            <?php endif; ?>
                                        </div>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                            
                            <div class="theme-shortcuts">
                                <small>💡 Tip: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd> to quickly toggle themes</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subscription Section -->
                <div class="settings-section">
                    <h2>Subscription</h2>
                    <div class="settings-group">
                        <div class="subscription-info">
                            <div class="subscription-status">
                                <div class="status-icon">
                                    <img src="../images/icons/sub-icon-light.webp" alt="Subscription">
                                </div>
                                <div class="status-details">
                                    <h3>Current Plan: <span class="plan-name"><?php echo ucfirst($currentSubscription); ?></span></h3>
                                    <?php if ($currentSubscription !== 'free' && $userData['subscription_expires']): ?>
                                        <p>Valid until: <?php echo date('F j, Y', strtotime($userData['subscription_expires'])); ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="subscription-actions">
                                <?php if ($currentSubscription === 'free'): ?>
                                    <a href="subscription.php" class="upgrade-btn">Upgrade Plan</a>
                                <?php else: ?>
                                    <button class="manage-btn" onclick="openCustomerPortal()">Manage Subscription</button>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Account Section -->
                <div class="settings-section">
                    <h2>Account</h2>
                    <div class="settings-group">
                        <button class="setting-button" onclick="showChangePasswordModal()">
                            <span class="button-icon">
                                <img src="../images/icons/key-icon-light.webp" alt="Password">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Change Password</span>
                                <span class="button-description">Update your account password</span>
                            </div>
                            <span class="button-arrow">›</span>
                        </button>
                        
                        <button class="setting-button" onclick="showChangeEmailModal()">
                            <span class="button-icon">
                                <img src="../images/icons/email-icon-light.webp" alt="Email">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Change Email</span>
                                <span class="button-description">Update your email address</span>
                            </div>
                            <span class="button-arrow">›</span>
                        </button>
                        
                        <button class="setting-button danger" onclick="showDeleteAccountModal()">
                            <span class="button-icon">
                                <img src="../images/icons/trash.webp" alt="Delete">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Delete Account</span>
                                <span class="button-description">Permanently delete your account and data</span>
                            </div>
                            <span class="button-arrow">›</span>
                        </button>
                    </div>
                </div>

                <!-- Notifications Section -->
                <div class="settings-section">
                    <h2>Notifications</h2>
                    <div class="settings-group">
                        <label class="setting-toggle">
                            <div class="toggle-info">
                                <span class="toggle-title">Email Notifications</span>
                                <span class="toggle-description">Receive updates about your tasks and achievements</span>
                            </div>
                            <input type="checkbox" id="email-notifications" checked onchange="toggleEmailNotifications(this.checked)">
                            <span class="toggle-switch"></span>
                        </label>
                        
                        <label class="setting-toggle">
                            <div class="toggle-info">
                                <span class="toggle-title">Task Reminders</span>
                                <span class="toggle-description">Get reminded about incomplete daily tasks</span>
                            </div>
                            <input type="checkbox" id="task-reminders" checked onchange="toggleTaskReminders(this.checked)">
                            <span class="toggle-switch"></span>
                        </label>
                        
                        <label class="setting-toggle">
                            <div class="toggle-info">
                                <span class="toggle-title">Theme Auto-Switch</span>
                                <span class="toggle-description">Automatically switch theme based on time of day</span>
                            </div>
                            <input type="checkbox" id="auto-theme" onchange="toggleAutoTheme(this.checked)">
                            <span class="toggle-switch"></span>
                        </label>
                    </div>
                </div>

                <!-- Advanced Section -->
                <div class="settings-section">
                    <h2>Advanced</h2>
                    <div class="settings-group">
                        <button class="setting-button" onclick="exportUserData()">
                            <span class="button-icon">
                                <img src="../images/icons/download-icon-light.webp" alt="Export">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Export Data</span>
                                <span class="button-description">Download your account data</span>
                            </div>
                            <span class="button-arrow">›</span>
                        </button>
                        
                        <button class="setting-button" onclick="clearCache()">
                            <span class="button-icon">
                                <img src="../images/icons/refresh-icon-light.webp" alt="Clear">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Clear Cache</span>
                                <span class="button-description">Clear stored data and refresh</span>
                            </div>
                            <span class="button-arrow">›</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div id="password-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Change Password</h2>
                <button class="close-modal" onclick="closeModal('password-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="change-password-form">
                    <div class="form-group">
                        <label for="current-password">Current Password</label>
                        <input type="password" id="current-password" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">New Password</label>
                        <input type="password" id="new-password" required>
                        <span class="field-hint">At least 8 characters with uppercase, lowercase, and numbers</span>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirm New Password</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal('password-modal')">Cancel</button>
                        <button type="submit" class="save-btn">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Change Email Modal -->
    <div id="email-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Change Email</h2>
                <button class="close-modal" onclick="closeModal('email-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="change-email-form">
                    <div class="form-group">
                        <label for="new-email">New Email Address</label>
                        <input type="email" id="new-email" required>
                    </div>
                    <div class="form-group">
                        <label for="email-password">Current Password</label>
                        <input type="password" id="email-password" required>
                        <span class="field-hint">Enter your password to confirm this change</span>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal('email-modal')">Cancel</button>
                        <button type="submit" class="save-btn">Update Email</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete Account Modal -->
    <div id="delete-account-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Delete Account</h2>
                <button class="close-modal" onclick="closeModal('delete-account-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="warning-message">
                    <img src="../images/icons/warning.webp" alt="Warning">
                    <p>This action cannot be undone. All your data, including tasks, habitus items, and HCoins will be permanently deleted.</p>
                </div>
                <form id="delete-account-form">
                    <div class="form-group">
                        <label for="delete-password">Password</label>
                        <input type="password" id="delete-password" required>
                    </div>
                    <div class="form-group">
                        <label for="delete-confirm">Type "DELETE" to confirm</label>
                        <input type="text" id="delete-confirm" required pattern="DELETE" placeholder="Type DELETE here">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal('delete-account-modal')">Cancel</button>
                        <button type="submit" class="delete-btn">Delete My Account</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    <script src="../js/settings.js"></script>
    
    <!-- Initialize theme system -->
    <script>
        // Pass PHP theme to JavaScript
        window.initialTheme = '<?php echo $currentTheme; ?>';
        window.initialLanguage = '<?php echo $currentLanguage; ?>';
        
        // Additional settings functions
        function showChangeEmailModal() {
            const modal = document.getElementById('email-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
        }
        
        function toggleAutoTheme(enabled) {
            if (enabled) {
                // Implement auto theme switching based on time
                const hour = new Date().getHours();
                const isDaytime = hour >= 6 && hour < 18;
                const newTheme = isDaytime ? 'light' : 'dark';
                
                if (window.themeManager && window.themeManager.getTheme() !== newTheme) {
                    window.themeManager.setTheme(newTheme);
                    showNotification(`Auto-switched to ${newTheme} theme`, 'info');
                }
            }
            
            localStorage.setItem('autoTheme', enabled);
        }
        
        function exportUserData() {
            showNotification('Preparing your data export...', 'info');
            
            fetch('../php/api/user/export_data.php', {
                method: 'POST'
            })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'habitus-zone-data.json';
                a.click();
                window.URL.revokeObjectURL(url);
                showNotification('Data exported successfully', 'success');
            })
            .catch(error => {
                console.error('Export error:', error);
                showNotification('Error exporting data', 'error');
            });
        }
        
        function clearCache() {
            if (confirm('This will clear all cached data and refresh the page. Continue?')) {
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear service worker cache if available
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                
                showNotification('Cache cleared. Refreshing...', 'success');
                setTimeout(() => {
                    window.location.reload(true);
                }, 1500);
            }
        }
    </script>
</body>
</html>