<?php

// index.php

require_once 'php/include/config.php';

// If user is already logged in, redirect to dashboard.php
if (isset($_SESSION['user_id'])) {
    header('Location: ./pages/dashboard.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en" class="index-page" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Habitus - Gamify Your Life</title>
    <link rel="stylesheet" href="../css/themes/light.css" id="theme-stylesheet">
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
                <img src="images/logo/logo.svg" alt="Habitus Logo">
                <span>Habitus</span>
            </div>
            <div class="nav-buttons">
                <a href="pages/login.php" class="nav-button login-btn">Login</a>
                <a href="pages/register.php" class="nav-button register-btn">Register</a>
            </div>
        </nav>

        <!-- Hero Section with Carousel -->
        <section class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">Transform Your Daily Habits into Lasting Success</h1>
                <p class="hero-subtitle">A personalized journey to building better habits, staying motivated, and creating your own digital sanctuary</p>
            </div>
            
            <div class="carousel-container">
                <div class="carousel">
                    <div class="carousel-slide">
                        <img src="./images/index-intro/dashboard_intro.webp" alt="Dashboard Preview">
                        <div class="slide-caption">
                            <h3>Dashboard</h3>
                            <p>Track your daily tasks, challenges, and see your progress at a glance</p>
                        </div>
                    </div>
                    <div class="carousel-slide">
                        <img src="./images/index-intro/tasks_intro.webp" alt="Shop Preview">
                        <div class="slide-caption">
                            <h3>Organize your Habits and Tasks</h3>
                            <p>Earn HCoins to use later at the Shop to see your In Real Time Progress in your Habitus</p>
                        </div>
                    </div>
                    <div class="carousel-slide">
                        <img src="./images/index-intro/shop_intro.webp" alt="Shop Preview">
                        <div class="slide-caption">
                            <h3>Shop</h3>
                            <p>Spend your HCoins to buy your favourite items</p>
                        </div>
                    </div>
                    <div class="carousel-slide">
                        <img src="./images/index-intro/habitus_intro.webp" alt="Habitus Room Preview">
                        <div class="slide-caption">
                            <h3>Customize Your Habitus</h3>
                            <p>Design your personal space with furniture, decorations and more</p>
                        </div>
                    </div>
                </div>
                
                <button class="carousel-prev">&#10094;</button>
                <button class="carousel-next">&#10095;</button>
                
                <div class="carousel-indicators">
                    <button class="carousel-indicator active" data-slide="0"></button>
                    <button class="carousel-indicator" data-slide="1"></button>
                    <button class="carousel-indicator" data-slide="2"></button>
                </div>
            </div>
        </section>

        <!-- Why Habitus Section -->
        <section class="why-habitus" id="why-habitus">
            <h2 class="section-title">Why Habitus?</h2>
            
            <div class="benefits-container">
                <div class="benefit-card">
                    <div class="benefit-img" style="background-image: url('images/index-intro/motivate.webp');"></div>
                    <div class="benefit-content">
                        <h3>Stay Motivated</h3>
                        <p>Transform everyday tasks into rewarding experiences. Our unique gamification system keeps you motivated by providing tangible rewards for your accomplishments.</p>
                    </div>
                </div>
                
                <div class="benefit-card">
                    <div class="benefit-img" style="background-image: url('images/index-intro/track.webp');"></div>
                    <div class="benefit-content">
                        <h3>Track Real Progress</h3>
                        <p>See your growth in real-time with intuitive progress trackers. Maintain streaks, complete challenges, and witness your improvements day by day.</p>
                    </div>
                </div>
                
                <div class="benefit-card">
                    <div class="benefit-img" style="background-image: url('images/index-intro/habitus_room_intro.webp');"></div>
                    <div class="benefit-content">
                        <h3>Your Personal Sanctuary</h3>
                        <p>Create a digital space that reflects your achievements. Customize your Habitus with items earned through consistent habit building and goal completion.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section">
            <h2 class="section-title">Features Designed for Your Growth</h2>
            
            <div class="features-grid">
                <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/dailies-icon.webp" alt="Dailies Icon">
                    </div>
                    <div class="feature-text">
                        <h3>Customizable Daily Tasks</h3>
                        <p>Create personalized dailies tailored to your specific needs and routine. Set task difficulty and duration to earn appropriate rewards.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/goals-icon.webp" alt="Goals Icon">
                    </div>
                    <div class="feature-text">
                        <h3>Long-term Goals</h3>
                        <p>Break down ambitious objectives into manageable steps. Track your progress visually and stay committed to your bigger aspirations.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/challenge-icon.webp" alt="Challenge Icon">
                    </div>
                    <div class="feature-text">
                        <h3>Special Challenges</h3>
                        <p>Push your limits with time-bound challenges. Earn bonus rewards and build resilience by completing more demanding tasks.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/hcoin-icon.webp" alt="HCoin Icon">
                    </div>
                    <div class="feature-text">
                        <h3>HCoin Rewards</h3>
                        <p>Earn HCoins for every completed task. Our intelligent system calculates rewards based on task difficulty and duration.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/home-icon.webp" alt="Home Icon">
                    </div>
                    <div class="feature-text">
                        <h3>Personalized Habitus</h3>
                        <p>Design your virtual space with items purchased from our shop. Express yourself through customization and decoration.</p>
                    </div>
                </div>
                
                <!-- <div class="feature">
                    <div class="feature-icon">
                        <img src="images/icons/dashboard-icon.webp" alt="Dashboard Icon">
                    </div>
                    <div class="feature-text">
                        <h3>Adaptable Dashboard</h3>
                        <p>Arrange your dashboard to suit your workflow. Prioritize the components that matter most to your productivity.</p>
                    </div>
                </div> -->
            </div>
        </section>

        <!-- How it works section -->
        <section class="how-it-works" id="how-it-works">
            <h2 class="section-title">How Habitus Works</h2>
            
            <div class="steps-container">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-icon">
                        <img src="images/icons/tasks-icon.webp" alt="Create Tasks">
                    </div>
                    <h3>Create Tasks</h3>
                    <p>Set up dailies, goals, and challenges based on your real-life objectives</p>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-icon">
                        <img src="images/icons/hcoin-icon.webp" alt="Complete and Earn">
                    </div>
                    <h3>Complete & Earn</h3>
                    <p>Finish tasks to earn HCoins and build streaks for bonus rewards</p>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-icon">
                        <img src="images/icons/edit-icon.webp" alt="Customize">
                    </div>
                    <h3>Customize</h3>
                    <p>Spend your HCoins on items to personalize your virtual habitus</p>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-icon">
                        <img src="images/icons/challenge-icon.webp" alt="Grow">
                    </div>
                    <h3>Grow</h3>
                    <p>Build lasting habits, achieve goals, and watch your virtual space evolve</p>
                </div>
            </div>
        </section>
        
        <!-- Testimonials section -->
        <section class="testimonials">
            <h2 class="section-title">What Our Users Say</h2>
            
            <div class="testimonial-slider">
                <div class="testimonial">
                    <div class="quote">"Habitus has transformed how I approach my daily routine. The streak system keeps me motivated, and watching my virtual space grow feels incredibly rewarding."</div>
                    <div class="author">- Alex S.</div>
                </div>
                
                <div class="testimonial">
                    <div class="quote">"I've tried many productivity apps, but none have kept me engaged like Habitus. Creating my own tasks with custom rewards makes habit-building feel personal and meaningful."</div>
                    <div class="author">- Jamie P.</div>
                </div>
                
                <div class="testimonial">
                    <div class="quote">"The visualization of progress through my Habitus space has been a game-changer. It's not just about checking off tasks; it's about building something beautiful through consistency."</div>
                    <div class="author">- Taylor K.</div>
                </div>
                
                <div class="testimonial">
                    <div class="quote">"As someone who struggled with maintaining habits, the gamification aspect of Habitus makes me excited to complete my daily tasks. It's turned productivity into something I look forward to."</div>
                    <div class="author">- Morgan L.</div>
                </div>
            </div>
        </section>
        
        <!-- CTA section -->
        <section class="final-cta">
            <h2>Start Your Journey to Better Habits Today</h2>
            <p>Join Habitus and discover a more engaging way to build consistency, track your progress, and transform your daily routine into a rewarding experience. Create your personalized space and watch as your habits build a better you.</p>
            <div class="cta-buttons">
                <a href="pages/register.php" class="primary-button">Create Your Account</a>
                <a href="#why-habitus" class="secondary-button">Learn More</a>
            </div>
        </section>
        
        <!-- Footer -->
        <footer class="landing-footer">
            <div class="footer-logo">
                <img src="images/logo/logo.svg" alt="Habitus">
                <span>Habitus</span>
            </div>
            
            <div class="footer-links">
                <a href="#">About Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact</a>
            </div>
            
            <div class="copyright">
                &copy; <?php echo date('Y'); ?> Habitus. All rights reserved.
            </div>
        </footer>
    </div>

    <!-- At the bottom of index.php, before the closing </body> tag -->
    <script src="js/main.js"></script>
    <script src="js/index.js"></script>
</body>
</html>