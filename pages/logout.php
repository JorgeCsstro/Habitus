<?php

// logout.php

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/auth.php';

// Log security event if user was logged in
if (isLoggedIn()) {
    logSecurityEvent('User logout', getCurrentUserId());
}

// Logout user
logoutUser();

// Redirect to home page
header('Location: ../index.php');
exit;