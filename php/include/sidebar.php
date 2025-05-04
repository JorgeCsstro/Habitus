<!-- Left Navigation Menu -->
<div class="left-menu">
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'home.php' ? 'active' : ''; ?>">
        <a href="home.php">
            <img src="../images/logo/logo.svg" alt="Home">
        </a>
    </div>
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'tasks.php' ? 'active' : ''; ?>">
        <a href="tasks.php">
            <img src="../images/icons/tasks.svg" alt="Tasks">
        </a>
    </div>
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'shop.php' ? 'active' : ''; ?>">
        <a href="shop.php">
            <img src="../images/icons/shop.svg" alt="Shop">
        </a>
    </div>
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'habitus.php' ? 'active' : ''; ?>">
        <a href="habitus.php">
            <img src="../images/icons/home.svg" alt="Habitus">
        </a>
    </div>
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'subscription.php' ? 'active' : ''; ?>">
        <a href="subscription.php">
            <img src="../images/icons/star.svg" alt="Subscription">
        </a>
    </div>
    <div class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'settings.php' ? 'active' : ''; ?>">
        <a href="settings.php">
            <img src="../images/icons/settings.svg" alt="Settings">
        </a>
    </div>
</div>