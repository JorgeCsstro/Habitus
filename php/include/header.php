<!-- Header -->
<header class="main-header">
    <div class="user-info">
        <div class="user-avatar">
            <img src="../images/logo/logo.svg" alt="Avatar">
        </div>
        <h1 class="habitus-name"><?php echo htmlspecialchars($userHabitusName); ?></h1>
    </div>
    <div class="user-actions">
        <div class="hcoin-balance">
            <img src="../images/icons/hcoin.svg" alt="HCoin">
            <span><?php echo number_format($userHCoins); ?></span>
        </div>
        <a href="tasks.php" class="tasks-button">
            <img src="../images/icons/tasks.svg" alt="Tasks">
        </a>
        <a href="messages.php" class="messages-button">
            <img src="../images/icons/messages.svg" alt="Messages">
        </a>
        <a href="profile.php" class="profile-button">
            <img src="../images/icons/user.svg" alt="Profile">
        </a>
    </div>
</header>