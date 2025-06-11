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
        'description' => 'Warm colors'
    ],
    'dark' => [
        'name' => 'Dark',
        'description' => 'Night colors'
    ]
];
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - <?php echo SITE_NAME; ?></title>
    
        <!-- REQUIRED: Theme CSS - Add this to ALL pages -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Your existing CSS files AFTER theme CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
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
                                <img src="<?php echo htmlspecialchars($user['profile_picture'] ?? '../uploads/profile-icon.webp'); ?>" 
                                     alt="Profile Picture" 
                                     id="profile-picture-preview">
                                <div class="profile-picture-overlay">
                                    <label for="profile-picture-upload" class="change-picture-btn">
                                        <img src="../images/icons/camera.webp" alt="Change">
                                        <span>Change Photo</span>
                                    </label>
                                </div>
                            </div>
                            <input type="file" id="profile-picture-upload" accept="image/*" style="display: none;" 
                                   onchange="handleProfilePictureChange(this)">
                        </div>
                    </div>
                </div>

                <!-- Translation Section -->
                <div class="settings-section">
                    <h2>Translation & Language</h2>
                    <div class="settings-group">
                        <!-- Enhanced Language Selector -->
                        <label for="language-select" class="setting-label">
                            <div class="setting-info">
                                <span class="setting-title">Display Language</span>
                                <span class="setting-description">Choose your preferred language</span>
                            </div>
                                <select id="language-selector" class="form-control">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="it">Italiano</option>
                                    <option value="pt">Português</option>
                                    <option value="ru">Русский</option>
                                    <option value="zh">中文</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
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
                                            <br>
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
                                    <img src="../images/icons/sub-icon.webp" alt="Subscription">
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
                                <img src="../images/icons/key-icon.webp" alt="Password">
                            </span>
                            <div class="button-text">
                                <span class="button-title">Change Password</span>
                                <span class="button-description">Update your account password</span>
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

    <script>
    // REQUIRED: Theme initialization for ALL pages
    window.initialTheme = '<?php echo $currentTheme; ?>';
    document.documentElement.setAttribute('data-theme', window.initialTheme);
    document.body.classList.add('theme-' + window.initialTheme);
    </script>

    <!-- Load theme manager on ALL pages -->
    <script src="../js/theme-manager.js"></script>

    <script src="../js/settings.js"></script>

    <!-- Load translation manager -->
    <script src="../js/translation-manager.js"></script>
</body>
</html>