<?php

// index.php

// Include necessary files
require_once 'php/include/config.php';

// If user is already logged in, redirect to dashboard.php
if (isset($_SESSION['user_id'])) {
    header('Location: ./pages/dashboard.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en" class="index-page">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Habitus Zone - Gamify Your Life</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/pages/index.css">
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="landing-container">
        <!-- Top navigation -->
        <nav class="landing-nav">
            <div class="logo">
                <img src="images/logo/habitus-logo.svg" alt="Habitus Zone Logo">
                <span>Habitus Zone</span>
            </div>
            <div class="nav-buttons">
                <a href="pages/login.php" class="nav-button login-btn">Login</a>
                <a href="pages/register.php" class="nav-button register-btn">Register</a>
            </div>
        </nav>

        <!-- Main content -->
        <main class="landing-content">
            <div class="left-content">
                <h1>Transform Your Daily Tasks Into Rewards</h1>
                <p class="subtitle">Gamify your life, earn rewards, and customize your virtual space</p>
                
                <div class="feature-list">
                    <div class="feature">
                        <div class="feature-icon">
                            <img src="images/icons/tasks-feature.svg" alt="Tasks Icon">
                        </div>
                        <div class="feature-text">
                            <h3>Track Daily Tasks</h3>
                            <p>Create customizable dailies, goals, and challenges to stay motivated</p>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">
                            <img src="images/icons/hcoin-feature.svg" alt="HCoin Icon">
                        </div>
                        <div class="feature-text">
                            <h3>Earn HCoins</h3>
                            <p>Complete tasks and receive rewards to spend in the shop</p>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">
                            <img src="images/icons/habitus-feature.svg" alt="Habitus Icon">
                        </div>
                        <div class="feature-text">
                            <h3>Build Your Habitus</h3>
                            <p>Personalize your virtual space with furniture, decorations, and more</p>
                        </div>
                    </div>
                </div>
                
                <div class="cta-buttons">
                    <a href="pages/register.php" class="primary-button">Get Started Now</a>
                    <a href="#how-it-works" class="secondary-button">Learn More</a>
                </div>
            </div>
            
            <div class="right-content">
                <div class="preview-image">
                    <img src="images/landing/habitus-preview.png" alt="Habitus Zone Preview">
                </div>
            </div>
        </main>
        
        <!-- How it works section -->
        <section id="how-it-works" class="how-it-works">
            <h2>How Habitus Zone Works</h2>
            
            <div class="steps-container">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-icon">
                        <img src="images/icons/create-tasks.svg" alt="Create Tasks">
                    </div>
                    <h3>Create Tasks</h3>
                    <p>Set up dailies, goals, and challenges based on your real-life objectives</p>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-icon">
                        <img src="images/icons/complete-earn.svg" alt="Complete and Earn">
                    </div>
                    <h3>Complete & Earn</h3>
                    <p>Finish tasks to earn HCoins and build streaks for bonus rewards</p>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-icon">
                        <img src="images/icons/customize.svg" alt="Customize">
                    </div>
                    <h3>Customize</h3>
                    <p>Spend your HCoins on items to personalize your virtual habitus</p>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-icon">
                        <img src="images/icons/grow.svg" alt="Grow">
                    </div>
                    <h3>Grow</h3>
                    <p>Build habits, achieve goals, and watch your virtual space evolve</p>
                </div>
            </div>
        </section>
        
        <!-- Testimonials section -->
        <section class="testimonials">
            <h2>What Our Users Say</h2>
            
            <div class="testimonial-slider">
                <div class="testimonial">
                    <div class="quote">"Habitus Zone helped me build a consistent workout routine. Now I look forward to checking off my dailies!"</div>
                    <div class="author">- Alex S.</div>
                </div>
                
                <div class="testimonial">
                    <div class="quote">"I love how I can customize my virtual space. It makes completing tasks so much more rewarding."</div>
                    <div class="author">- Jamie P.</div>
                </div>
                
                <div class="testimonial">
                    <div class="quote">"The streak system keeps me motivated to maintain my habits day after day."</div>
                    <div class="author">- Taylor K.</div>
                </div>
            </div>
        </section>
        
        <!-- CTA section -->
        <section class="final-cta">
            <h2>Ready to Transform Your Daily Routine?</h2>
            <p>Join Habitus Zone today and turn your tasks into rewards!</p>
            <div class="cta-buttons">
                <a href="pages/register.php" class="primary-button">Create Your Account</a>
                <a href="pages/login.php" class="secondary-button">Login</a>
            </div>
        </section>
        
        <!-- Footer -->
        <footer class="landing-footer">
            <div class="footer-logo">
                <img src="images/logo/habitus-logo-small.svg" alt="Habitus Zone">
                <span>Habitus Zone</span>
            </div>
            
            <div class="footer-links">
                <a href="#">About Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact</a>
            </div>
            
            <div class="copyright">
                &copy; <?php echo date('Y'); ?> Habitus Zone. All rights reserved.
            </div>
        </footer>
    </div>

    <script src="js/main.js"></script>
</body>
</html>