<?php
// dashboard.php

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';
require_once '../php/include/auth.php';

// Check if user is logged in, if not redirect to login page
if (!isLoggedIn()) {
    header('Location: login.php');    
    exit;
}

// Get user data
$userData = getUserData($_SESSION['user_id']);
$userHCoins = $userData['hcoin'];
$userHabitusName = $userData['username'] . "'s Habitus";

// Get user's dailies
$dailies = getUserDailies($_SESSION['user_id']);

// Get user's goals
$goals = getUserGoals($_SESSION['user_id']);

// Get user's challenges
$challenges = getUserChallenges($_SESSION['user_id']);

// Get featured shop items
$featuredItems = getFeaturedShopItems();

// Get user's habitus data
$habitusData = getUserHabitusData($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Habitus Zone</title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/dashboard.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
</head>
<body>
    <div class="main-container">

        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Dashboard Content -->
            <div class="dashboard-content">
                <!-- Dailies Panel -->
                <div class="panel dailies-panel">
                    <div class="panel-header">
                        <img src="../images/icons/dailies-icon-light.webp" alt="Calendar">
                        <h2>Dailies</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($dailies)): ?>
                            <p class="empty-message">No dailies found. Add some to get started!</p>
                        <?php else: ?>
                            <ul class="dailies-list">
                                <?php foreach ($dailies as $daily): ?>
                                    <li class="daily-item <?php echo ($daily['completed']) ? 'completed' : ''; ?>">
                                        <span class="daily-bullet">●</span>
                                        <span class="daily-title"><?php echo htmlspecialchars($daily['title']); ?></span>
                                        <span class="daily-dots"></span>
                                        <?php if ($daily['reset_time']): ?>
                                            <span class="daily-time"><?php echo date('H:i', strtotime($daily['reset_time'])); ?></span>
                                        <?php endif; ?>
                                        <button class="complete-button <?php echo ($daily['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $daily['id']; ?>"
                                                onclick="completeDaily(<?php echo $daily['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=daily'">
                            <img src="../images/icons/task_add-icon-light.webp" alt="Add">
                            Add new daily...
                        </button>
                    </div>
                </div>

                <!-- Featured Shop Panel -->
                <div class="panel shop-panel">
                    <div class="panel-header">
                        <img src="../images/icons/shop-icon-light.webp" alt="Shop">
                        <h2>Featured Shop</h2>
                    </div>
                    <div class="panel-content">
                        <div class="shop-grid">
                            <?php foreach ($featuredItems as $item): ?>
                                <div class="shop-item">
                                    <?php
                                    // Convert image path to WebP
                                    $imagePath = $item['image_path'];
                                    $webpPath = preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $imagePath);
                                    ?>
                                    <img src="<?php echo htmlspecialchars($webpPath); ?>" alt="<?php echo htmlspecialchars($item['name']); ?>">
                                    <div class="item-price">
                                        <img src="../images/icons/hcoin-small.webp" alt="HCoin">
                                        <span><?php echo $item['price']; ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="go-to-shop-button" onclick="location.href='shop.php'">
                            <img src="../images/icons/cart-icon-light.webp" alt="Shop">
                            Go to Shop
                        </button>
                    </div>
                </div>

                <!-- Habitus Preview Panel -->
                <div class="panel habitus-panel">
                    <div class="panel-header">
                        <img src="../images/icons/home.webp" alt="Habitus">
                        <h2>Habitus</h2>
                    </div>
                    <div class="panel-content">
                        <div class="habitus-preview">
                            <?php if ($habitusData && isset($habitusData['preview_image'])): ?>
                                <?php
                                // Convert preview image to WebP
                                $previewImage = $habitusData['preview_image'];
                                $webpPreview = preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $previewImage);
                                ?>
                                <img src="<?php echo htmlspecialchars($webpPreview); ?>" alt="Habitus Preview">
                            <?php else: ?>
                                <div id="dashboard-room-container" class="habitus-room-container"></div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="edit-habitus-button" onclick="location.href='habitus.php'">
                            <img src="../images/icons/edit-icon-light.webp" alt="Edit">
                            Edit your Habitus...
                        </button>
                    </div>
                </div>

                <!-- Goals Panel -->
                <div class="panel goals-panel">
                    <div class="panel-header">
                        <img src="../images/icons/goals-icon-light.webp" alt="Goals">
                        <h2>Goals</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($goals)): ?>
                            <p class="empty-message">No goals found. Add some to track your progress!</p>
                        <?php else: ?>
                            <ul class="goals-list">
                                <?php foreach ($goals as $goal): ?>
                                    <li class="goal-item <?php echo ($goal['completed']) ? 'completed' : ''; ?>">
                                        <span class="goal-bullet">●</span>
                                        <span class="goal-title"><?php echo htmlspecialchars($goal['title']); ?></span>
                                        <span class="goal-dots"></span>
                                        <button class="complete-button <?php echo ($goal['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $goal['id']; ?>"
                                                onclick="completeGoal(<?php echo $goal['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=goal'">
                            <img src="../images/icons/task_add-icon-light.webp" alt="Add">
                            Add new objective...
                        </button>
                    </div>
                </div>

                <!-- Challenges Panel -->
                <div class="panel challenges-panel">
                    <div class="panel-header">
                        <img src="../images/icons/challenge-icon-light.webp" alt="Challenges">
                        <h2>Challenges</h2>
                    </div>
                    <div class="panel-content">
                        <?php if (empty($challenges)): ?>
                            <p class="empty-message">No challenges found. Try something new!</p>
                        <?php else: ?>
                            <ul class="challenges-list">
                                <?php foreach ($challenges as $challenge): ?>
                                    <li class="challenge-item <?php echo ($challenge['completed']) ? 'completed' : ''; ?>">
                                        <span class="challenge-bullet">●</span>
                                        <span class="challenge-title"><?php echo htmlspecialchars($challenge['title']); ?></span>
                                        <span class="challenge-dots"></span>
                                        <button class="complete-button <?php echo ($challenge['completed']) ? 'completed' : ''; ?>" 
                                                data-id="<?php echo $challenge['id']; ?>"
                                                onclick="completeChallenge(<?php echo $challenge['id']; ?>)">
                                            <img src="../images/icons/check.webp" alt="Complete">
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                    <div class="panel-footer">
                        <button class="add-new-button" onclick="location.href='tasks.php?add=challenge'">
                            <img src="../images/icons/task_add-icon-light.webp" alt="Add">
                            Add new challenge...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="../js/main.js"></script>
    <script src="../js/dashboard.js"></script>
    <!-- Habitus Room Script -->
    <script src="../js/habitus-house.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the isometric room
            if (document.getElementById('dashboard-room-container')) {
                initHabitusRoom('dashboard-room-container');
            }
        });
    </script>
</body>
</html>