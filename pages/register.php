<?php

// register.php

// Include necessary files
require_once '../php/include/config.php';
require_once '../php/include/db_connect.php';
require_once '../php/include/functions.php';

// If user is already logged in, redirect to dashboard.php
if (isset($_SESSION['user_id'])) {
    // Redirect to dashboard page after 2 seconds
    header("Refresh: 2; URL=dashboard.php");
    exit;
}

// Initialize variables for form
$username = '';
$email = '';
$error = '';
$success = '';

// Check if form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    
    // Validate form data
    if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
        $error = "Please fill in all fields.";
    } elseif (strlen($username) < 3 || strlen($username) > 30) {
        $error = "Username must be between 3 and 30 characters.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address.";
    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";
    } elseif (strlen($password) < 8) {
        $error = "Password must be at least 8 characters long.";
    } else {
        // Check if username already exists
        $checkUsername = "SELECT id FROM users WHERE username = ?";
        $stmt = $conn->prepare($checkUsername);
        $stmt->execute([$username]);
        
        if ($stmt->rowCount() > 0) {
            $error = "Username already exists. Please choose another.";
        } else {
            // Check if email already exists
            $checkEmail = "SELECT id FROM users WHERE email = ?";
            $stmt = $conn->prepare($checkEmail);
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() > 0) {
                $error = "Email already registered. Please login instead.";
            } else {
                // Hash password
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                
                try {
                    // Begin transaction
                    $conn->beginTransaction();
                    
                    // Register user - let created_at be auto-generated
                    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
                    $stmt = $conn->prepare($insertQuery);
                    $stmt->execute([$username, $email, $hashed_password]);
                    
                    // Get the user ID
                    $userId = $conn->lastInsertId();
                    
                    // Create default room for the user (without layout_json as it doesn't exist in rooms table)
                    $createRoom = "INSERT INTO rooms (user_id, name) VALUES (?, 'My First Room')";
                    $roomStmt = $conn->prepare($createRoom);
                    $roomStmt->execute([$userId]);
                    
                    // Create default dashboard layout
                    $defaultLayout = json_encode([
                        'panels' => [
                            'dailies' => ['x' => 0, 'y' => 0, 'w' => 1, 'h' => 1],
                            'goals' => ['x' => 0, 'y' => 1, 'w' => 1, 'h' => 1],
                            'challenges' => ['x' => 1, 'y' => 1, 'w' => 1, 'h' => 1],
                            'shop' => ['x' => 1, 'y' => 0, 'w' => 1, 'h' => 1],
                            'habitus' => ['x' => 2, 'y' => 0, 'w' => 1, 'h' => 2]
                        ]
                    ]);
                    
                    $createDashboard = "INSERT INTO dashboard_layouts (user_id, layout_json) VALUES (?, ?)";
                    $dashboardStmt = $conn->prepare($createDashboard);
                    $dashboardStmt->execute([$userId, $defaultLayout]);
                    
                    // Commit transaction
                    $conn->commit();
                    
                    // Registration successful
                    $success = "Registration successful! You can now login.";
                    
                    // Optional: Auto-login user
                    $_SESSION['user_id'] = $userId;
                    $_SESSION['username'] = $username;
                    
                    // Redirect to dashboard page after 2 seconds
                    header("Refresh: 2; URL=dashboard.php");
                } catch (Exception $e) {
                    // Rollback transaction on error
                    $conn->rollBack();
                    $error = "Registration failed: " . $e->getMessage();
                }
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Habitus Zone</title>
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
                    <img src="../images/logo/logo.svg" alt="Habitus Zone Logo">
                    <span>Habitus Zone</span>
                </a>
                <h1>Create Your Account</h1>
                <p>Join Habitus Zone to transform your daily tasks into rewards!</p>
            </div>
            
            <?php if ($error): ?>
                <div class="auth-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="auth-success">
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>
            
            <form class="auth-form" method="POST" action="register.php">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($username); ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                    <div class="password-requirements">
                        At least 8 characters long
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required>
                </div>
                
                <div class="form-terms">
                    <input type="checkbox" id="terms" name="terms" required>
                    <label for="terms">I agree to the <a href="#" target="_blank">Terms of Service</a> and <a href="#" target="_blank">Privacy Policy</a></label>
                </div>
                
                <button type="submit" class="auth-button">Create Account</button>
            </form>
            
            <div class="auth-separator">
                <span>or</span>
            </div>
            
            <a href="login.php" class="switch-auth">
                Already have an account? <span>Login</span>
            </a>
        </div>
        
        <div class="auth-decoration">
            <div class="decoration-content">
                <h2>Transform Your Daily Tasks</h2>
                <p>Gamify your life and turn productivity into rewards</p>
                
                <div class="decoration-features">
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/tasks-icon.webp" alt="Tasks Icon">
                        </div>
                        <div class="feature-text">Track Daily Tasks</div>
                    </div>
                    
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/hcoin-icon.webp" alt="HCoin Icon">
                        </div>
                        <div class="feature-text">Earn HCoins</div>
                    </div>
                    
                    <div class="decoration-feature">
                        <div class="feature-icon">
                            <img src="../images/icons/home-icon.webp" alt="Habitus Icon">
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