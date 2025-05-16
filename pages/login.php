<?php

// login.php

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';

// If user is already logged in, redirect to dashboard.php
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

// Initialize variables for form
$email = '';
$error = '';

// Check if form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    // Validate form data
    if (empty($email) || empty($password)) {
        $error = "Please fill in all fields.";
    } else {
        // Attempt to login user
        $query = "SELECT id, username, password FROM users WHERE email = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 1) {
            $user = $stmt->fetch();
            
            // Verify password
            if (password_verify($password, $user['password'])) {
                // Login successful, create session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                
                // Update last login time
                $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->execute([$user['id']]);
                
                // Redirect to dashboard page
                header('Location: dashboard.php');
                exit;
            } else {
                $error = "Invalid email or password.";
            }
        } else {
            $error = "Invalid email or password.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Habitus Zone</title>
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/pages/login.css">
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <a href="../index.php" class="logo">
                    <img src="../images/logo/habitus-logo.svg" alt="Habitus Zone Logo">
                    <span>Habitus Zone</span>
                </a>
                <h1>Login to Your Account</h1>
                <p>Welcome back! Enter your credentials to continue your productivity journey.</p>
            </div>
            
            <?php if ($error): ?>
                <div class="auth-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            
            <form class="auth-form" method="POST" action="login.php">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <div class="form-options">
                    <div class="remember-me">
                        <input type="checkbox" id="remember" name="remember">
                        <label for="remember">Remember me</label>
                    </div>
                    
                    <a href="forgot_password.php" class="forgot-password">Forgot Password?</a>
                </div>
                
                <button type="submit" class="auth-button">Login</button>
            </form>
            
            <div class="auth-separator">
                <span>or</span>
            </div>
            
            <a href="register.php" class="switch-auth">
                Don't have an account? <span>Register Now</span>
            </a>
        </div>
        
        <div class="auth-decoration">
            <div class="decoration-content">
                <h2>Transform Your Daily Tasks</h2>
                <p>Gamify your life and turn productivity into rewards</p>
                
                <div class="decoration-features">
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/tasks-feature-white.svg" alt="Tasks Icon">
                        </div>
                        <div class="feature-text">Track Daily Tasks</div>
                    </div>
                    
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/hcoin-feature-white.svg" alt="HCoin Icon">
                        </div>
                        <div class="feature-text">Earn HCoins</div>
                    </div>
                    
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/habitus-feature-white.svg" alt="Habitus Icon">
                        </div>
                        <div class="feature-text">Build Your Habitus</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../js/main.js"></script>
</body>
</html>