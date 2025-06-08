<!-- sidebar.php -->
<div class="left-menu">
    <!-- Logo at the top -->
    <div class="menu-item logo <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>">
        <a href="dashboard.php">
            <img src="../images/logo/logo.svg" alt="Home">
        </a>
    </div>
    <div class="middle-menu-items">
        <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'tasks.php' ? 'active' : ''; ?>">
            <a href="tasks.php">
                <img src="../images/icons/tasks-icon.webp" alt="Tasks">
            </a>
        </div>
        <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'shop.php' ? 'active' : ''; ?>">
            <a href="shop.php">
                <img src="../images/icons/cart-icon.webp" alt="Shop">
            </a>
        </div>
        <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'habitus.php' ? 'active' : ''; ?>">
            <a href="habitus.php">
                <img src="../images/icons/home-icon.webp" alt="Habitus">
            </a>
        </div>
        <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'subscription.php' ? 'active' : ''; ?>">
            <a href="subscription.php">
                <img src="../images/icons/sub-icon.webp" alt="Subscription">
            </a>
        </div>
    </div>
    <div class="menu-item settings <?php echo basename($_SERVER['PHP_SELF']) == 'settings.php' ? 'active' : ''; ?>">
        <a href="settings.php">
            <img src="../images/icons/settings-icon.webp" alt="Settings">
        </a>
    </div>
</div>