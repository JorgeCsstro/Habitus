<?php
// pages/subscription.php - COMPLETE FIXED VERSION

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

// Get user's subscription info
$subscriptionType = $userData['subscription_type'] ?? 'free';
$subscriptionExpires = $userData['subscription_expires'] ?? null;

// Check if subscription is still active
$isSubscriptionActive = false;
if ($subscriptionExpires) {
    $expiryDate = new DateTime($subscriptionExpires);
    $now = new DateTime();
    $isSubscriptionActive = $expiryDate > $now;
    
    // If subscription expired, update to free
    if (!$isSubscriptionActive && $subscriptionType !== 'free') {
        $updateQuery = "UPDATE users SET subscription_type = 'free', subscription_expires = NULL WHERE id = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([$_SESSION['user_id']]);
        $subscriptionType = 'free';
        $subscriptionExpires = null;
    }
}

// Get subscription plans
$plansQuery = "SELECT * FROM subscription_plans ORDER BY price ASC";
$stmt = $conn->query($plansQuery);
$plans = $stmt->fetchAll();

// Format plans data for easier access
$planData = [];
foreach ($plans as $plan) {
    $planData[$plan['name']] = $plan;
}

// Debug information
$debugInfo = [
    'user_id' => $_SESSION['user_id'],
    'subscription_type' => $subscriptionType,
    'subscription_expires' => $subscriptionExpires,
    'stripe_keys_configured' => !empty(STRIPE_PUBLISHABLE_KEY) && !empty(STRIPE_SECRET_KEY),
    'publishable_key_preview' => !empty(STRIPE_PUBLISHABLE_KEY) ? substr(STRIPE_PUBLISHABLE_KEY, 0, 12) . '...' : 'NOT SET'
];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription - <?php echo SITE_NAME; ?></title>
    
    <!-- CRITICAL: Inline styles for modal to prevent CSS loading issues -->
    <style>
        /* Critical inline styles for modal display and Stripe form */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(45, 41, 38, 0.85);
            z-index: 99999;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
            backdrop-filter: blur(5px);
        }
        
        .modal.show {
            display: flex !important;
        }
        
        .modal-content {
            background-color: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 650px;
            min-height: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            margin: auto;
            animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30px 35px;
            border-bottom: 2px solid #e9e2d9;
            background: linear-gradient(135deg, #f5f1ea 0%, #e9e2d9 100%);
            border-radius: 20px 20px 0 0;
            flex-shrink: 0;
        }
        
        .modal-header h2 {
            margin: 0;
            color: #2d2926;
            font-size: 1.6rem;
            font-family: 'Quicksand', sans-serif;
            font-weight: 600;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #8d8580;
            line-height: 1;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .close-modal:hover {
            color: #2d2926;
            background-color: rgba(141, 91, 76, 0.1);
            transform: rotate(90deg);
        }
        
        .modal-body {
            padding: 40px;
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }
        
        .payment-summary {
            background: linear-gradient(135deg, #f5f1ea 0%, #e9e2d9 100%);
            border-radius: 15px;
            padding: 35px;
            margin-bottom: 40px;
            text-align: center;
            border: 2px solid #e9e2d9;
            box-shadow: inset 0 2px 10px rgba(141, 91, 76, 0.05);
        }
        
        .payment-summary h3 {
            margin: 0 0 15px;
            color: #2d2926;
            font-size: 1.8rem;
            font-weight: 600;
            font-family: 'Quicksand', sans-serif;
        }
        
        .payment-summary p {
            margin: 0;
            color: #8d5b4c;
            font-size: 2.5rem;
            font-weight: 800;
            font-family: 'Quicksand', sans-serif;
        }
        
        #payment-element {
            width: 100%;
            min-height: 350px;
            margin: 30px 0;
            border: 2px solid #e9e2d9;
            border-radius: 15px;
            background-color: #ffffff;
            padding: 0;
            overflow: visible;
            position: relative;
            box-shadow: 0 4px 15px rgba(141, 91, 76, 0.08);
        }
        
        #payment-element > div {
            width: 100% !important;
            min-height: 320px !important;
            padding: 25px !important;
            border-radius: 15px;
        }
        
        #payment-element iframe {
            width: 100% !important;
            min-height: 300px !important;
            border: none !important;
            border-radius: 10px !important;
            background: transparent !important;
        }
        
        .stripe-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 320px;
            padding: 50px;
            text-align: center;
            background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
            border-radius: 15px;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #8d5b4c;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 25px;
        }
        
        .stripe-loading p {
            margin: 0;
            color: #6c757d;
            font-size: 1.1rem;
            font-weight: 500;
            font-family: 'Quicksand', sans-serif;
        }
        
        .submit-payment-btn {
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #6a8d7f, #7a9d8f);
            color: white;
            border: none;
            border-radius: 15px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            min-height: 65px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            font-family: 'Quicksand', sans-serif;
            margin-top: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 6px 20px rgba(106, 141, 127, 0.3);
        }
        
        .submit-payment-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #5a7c70, #6a8d7f);
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(106, 141, 127, 0.4);
        }
        
        .submit-payment-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            background: linear-gradient(135deg, #cccccc, #dddddd);
        }
        
        #payment-message {
            background: linear-gradient(135deg, #fff5f5, #ffe5e5);
            color: #c53030;
            border: 2px solid #feb2b2;
            padding: 18px 22px;
            border-radius: 10px;
            margin-bottom: 25px;
            font-size: 1rem;
            line-height: 1.5;
            font-weight: 500;
            box-shadow: 0 3px 10px rgba(197, 48, 48, 0.1);
        }
        
        #payment-message.hidden {
            display: none;
        }
        
        .hidden {
            display: none !important;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #spinner {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .modal-content {
                max-width: 95%;
                margin: 20px auto;
            }
            
            .modal-header {
                padding: 25px 20px;
            }
            
            .modal-body {
                padding: 30px 20px;
            }
            
            .payment-summary {
                padding: 25px 20px;
            }
            
            #payment-element {
                min-height: 300px;
            }
        }
    </style>
    
    <!-- External CSS files with error handling -->
    <link rel="stylesheet" href="../css/main.css" onerror="this.onerror=null; console.warn('Failed to load main.css');">
    <link rel="stylesheet" href="../css/components/sidebar.css" onerror="this.onerror=null; console.warn('Failed to load sidebar.css');">
    <link rel="stylesheet" href="../css/components/header.css" onerror="this.onerror=null; console.warn('Failed to load header.css');">
    <link rel="stylesheet" href="../css/components/scrollbar.css" onerror="this.onerror=null; console.warn('Failed to load scrollbar.css');">
    <link rel="stylesheet" href="../css/pages/subscription.css" onerror="this.onerror=null; console.warn('Failed to load subscription.css');">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Stripe JavaScript -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script src="https://js.stripe.com/v3/"></script>
    <?php endif; ?>
</head>
<body>
    <div class="main-container">
        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- Subscription Content -->
            <div class="subscription-content">
                <!-- Header Section -->
                <div class="subscription-header">
                    <h1>Subscription Plans</h1>
                    <p>Choose the plan that's right for you and unlock premium features</p>
                </div>

                <!-- Current Subscription Status -->
                <?php if ($subscriptionType !== 'free'): ?>
                <div class="current-subscription">
                    <div class="subscription-status">
                        <img src="../images/icons/sub-icon-light.webp" alt="Subscription">
                        <div>
                            <h3>Current Plan: <?php echo ucfirst($subscriptionType); ?></h3>
                            <?php if ($subscriptionExpires): ?>
                                <p>Valid until: <?php echo date('F j, Y', strtotime($subscriptionExpires)); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>
                    <button class="manage-subscription-btn" onclick="manageSubscription()">Manage Subscription</button>
                </div>
                <?php endif; ?>

                <!-- Configuration Warning (Development) -->
                <?php if (DEBUG_MODE && (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY))): ?>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>⚠️ Development Notice:</strong> Stripe keys not configured. 
                    <a href="../test-stripe.php" target="_blank">Test Configuration</a>
                </div>
                <?php endif; ?>

                <!-- Subscription Plans -->
                <div class="subscription-plans">
                    <!-- Free Plan -->
                    <div class="plan-card <?php echo $subscriptionType === 'free' ? 'current' : ''; ?>">
                        <div class="plan-header">
                            <h2>Free Plan</h2>
                            <div class="plan-price">
                                <span class="price">0€</span>
                                <span class="period">/month</span>
                            </div>
                        </div>
                        <div class="plan-features">
                            <ul>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Unlimited tasks creation
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Basic room customization
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Earn and spend HCoins
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Track streaks and progress
                                </li>
                                <li class="disabled">
                                    <img src="../images/icons/cross.webp" alt="✗">
                                    Contains advertisements
                                </li>
                                <li class="disabled">
                                    <img src="../images/icons/cross.webp" alt="✗">
                                    Limited shop items
                                </li>
                            </ul>
                        </div>
                        <div class="plan-button-wrapper">
                            <?php if ($subscriptionType === 'free'): ?>
                                <button class="plan-button current-plan" disabled>Current Plan</button>
                            <?php else: ?>
                                <button class="plan-button downgrade" onclick="downgradeToFree()">Downgrade to Free</button>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Ad-Free Plan -->
                    <div class="plan-card <?php echo $subscriptionType === 'adfree' ? 'current' : ''; ?>">
                        <div class="plan-header">
                            <h2>Ad-Free</h2>
                            <div class="plan-price">
                                <span class="price">1€</span>
                                <span class="period">/month</span>
                            </div>
                        </div>
                        <div class="plan-features">
                            <ul>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Everything in Free
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>No advertisements</strong>
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Clean, distraction-free interface
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Support development
                                </li>
                                <li class="disabled">
                                    <img src="../images/icons/cross.webp" alt="✗">
                                    No exclusive items
                                </li>
                                <li class="disabled">
                                    <img src="../images/icons/cross.webp" alt="✗">
                                    No premium features
                                </li>
                            </ul>
                        </div>
                        <div class="plan-button-wrapper">
                            <?php if ($subscriptionType === 'adfree'): ?>
                                <button class="plan-button current-plan" disabled>Current Plan</button>
                            <?php else: ?>
                                <button class="plan-button" onclick="subscribeToPlan('adfree')">Subscribe</button>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Premium Plan -->
                    <div class="plan-card premium <?php echo $subscriptionType === 'premium' ? 'current' : ''; ?>">
                        <div class="plan-badge">BEST VALUE</div>
                        <div class="plan-header">
                            <h2>Premium</h2>
                            <div class="plan-price">
                                <span class="price">5€</span>
                                <span class="period">/month</span>
                            </div>
                        </div>
                        <div class="plan-features">
                            <ul>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    Everything in Ad-Free
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>Exclusive shop items</strong>
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>Premium room themes</strong>
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>Advanced statistics</strong>
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>Priority support</strong>
                                </li>
                                <li>
                                    <img src="../images/icons/check.webp" alt="✓">
                                    <strong>Early access to features</strong>
                                </li>
                            </ul>
                        </div>
                        <div class="plan-button-wrapper">
                            <?php if ($subscriptionType === 'premium'): ?>
                                <button class="plan-button current-plan" disabled>Current Plan</button>
                            <?php else: ?>
                                <button class="plan-button premium-btn" onclick="subscribeToPlan('premium')">Go Premium</button>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Benefits Section -->
                <div class="subscription-benefits">
                    <h2>Why Subscribe?</h2>
                    <div class="benefits-grid">
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/ads-icon-light.webp" alt="No Ads">
                            </div>
                            <h3>Ad-Free Experience</h3>
                            <p>Focus on your tasks without any distractions or interruptions from advertisements</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/exclusive-icon-light.webp" alt="Exclusive">
                            </div>
                            <h3>Exclusive Content</h3>
                            <p>Access special items, themes, and features not available to free users</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/support-icon-light.webp" alt="Support">
                            </div>
                            <h3>Support Development</h3>
                            <p>Help us continue improving Habitus Zone and adding new features for everyone</p>
                        </div>
                    </div>
                </div>

                <!-- FAQ Section -->
                <div class="subscription-faq">
                    <h2>Frequently Asked Questions</h2>
                    <div class="faq-list">
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Can I cancel anytime?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Yes! You can cancel your subscription at any time. You'll retain access to premium features until the end of your current billing period.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                What payment methods do you accept?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>We accept all major credit and debit cards, Apple Pay, and Google Pay through our secure payment processor Stripe.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Can I change plans later?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing adjusts accordingly.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Is my payment information secure?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Yes, we use Stripe's industry-standard encryption and security. We never store your payment details on our servers.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                What happens if I don't renew?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>If you don't renew, your account will revert to the free plan. You'll keep all your data, but lose access to premium features.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- FIXED Payment Modal -->
    <div id="payment-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Complete Your Subscription</h2>
                <button class="close-modal" onclick="closePaymentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="payment-summary">
                    <h3 id="selected-plan-name">Plan Name</h3>
                    <p id="selected-plan-price">Price</p>
                </div>
                
                <form id="payment-form">
                    <!-- Stripe Elements will be inserted here -->
                    <div id="payment-element">
                        <div class="stripe-loading">
                            <div class="loading-spinner"></div>
                            <p>Initializing secure payment form...</p>
                        </div>
                    </div>
                    
                    <!-- Payment Security Info -->
                    <div class="payment-security" style="display: flex; align-items: center; gap: 12px; margin: 25px 0; padding: 18px; background-color: #f5f1ea; border-radius: 8px; font-size: 14px; color: #5a5755; border: 1px solid #e9e2d9;">
                        <img src="../images/icons/lock.webp" alt="Secure" style="width: 24px; height: 24px;">
                        <span>Secured by Stripe. We never store your payment details.</span>
                    </div>
                    
                    <!-- Error messages -->
                    <div id="payment-message" class="hidden"></div>
                    
                    <!-- Submit Button -->
                    <button type="submit" id="submit-payment-btn" class="submit-payment-btn" disabled>
                        <span id="button-text">Subscribe Now</span>
                        <span id="spinner" class="hidden"></span>
                    </button>
                </form>
                
                <!-- Payment Methods Info -->
                <div class="payment-methods" style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e9e2d9; font-size: 14px; color: #8d8580;">
                    <span>Powered by Stripe</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    
    <!-- Enhanced Stripe initialization -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script>
        // Initialize Stripe with error handling
        console.log('🔧 Initializing Stripe...');
        
        try {
            const stripe = Stripe('<?php echo STRIPE_PUBLISHABLE_KEY; ?>');
            window.stripe = stripe; // Make globally available
            
            console.log('✅ Stripe initialized successfully');
            console.log('📊 Debug info:', <?php echo json_encode($debugInfo); ?>);
            
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            
            // Disable all subscription buttons
            document.addEventListener('DOMContentLoaded', function() {
                const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
                buttons.forEach(button => {
                    button.disabled = true;
                    button.textContent = 'Payment System Error';
                    button.style.opacity = '0.5';
                });
            });
        }
    </script>
    
    <!-- Load enhanced subscription functionality -->
    <script src="../js/subscription-stripe.js"></script>
    
    <?php else: ?>
    <script>
        console.error('❌ Stripe publishable key not configured');
        
        // Disable subscription buttons
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
            buttons.forEach(button => {
                button.disabled = true;
                button.textContent = 'Configuration Required';
                button.style.opacity = '0.5';
            });
        });
        
        function subscribeToPlan(plan) {
            alert('Payment system not configured. Please contact support.');
        }
        
        window.subscribeToPlan = subscribeToPlan;
    </script>
    <?php endif; ?>
    
    <script>
        // Enhanced subscription management functions
        function manageSubscription() {
            if (confirm('Would you like to cancel your subscription? You will retain access until the end of your billing period.')) {
                cancelSubscription();
            }
        }
        
        function downgradeToFree() {
            if (confirm('Are you sure you want to downgrade to the free plan? You will lose access to premium features.')) {
                cancelSubscription();
            }
        }
        
        function cancelSubscription() {
            fetch('../php/api/subscription/cancel.php', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Subscription cancelled. You will retain access until ' + data.expires_date);
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    alert(data.message || 'Error cancelling subscription');
                }
            })
            .catch(error => {
                console.error('Cancel error:', error);
                alert('An error occurred. Please try again.');
            });
        }
        
        // Enhanced FAQ toggle function
        function toggleFaq(questionElement) {
            const faqItem = questionElement.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const icon = questionElement.querySelector('img');
            
            questionElement.classList.toggle('active');
            answer.classList.toggle('show');
            
            if (answer.classList.contains('show')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                answer.style.maxHeight = '0';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        }
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('payment-modal');
            if (e.target === modal) {
                if (typeof closePaymentModal === 'function') {
                    closePaymentModal();
                }
            }
        });
        
        // ESC key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('payment-modal');
                if (modal && modal.classList.contains('show')) {
                    if (typeof closePaymentModal === 'function') {
                        closePaymentModal();
                    }
                }
            }
        });
        
        // Enhanced error handling for CSS loading
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 Subscription page loaded');
            
            // Check if critical elements exist
            const modal = document.getElementById('payment-modal');
            const paymentElement = document.getElementById('payment-element');
            
            if (!modal) {
                console.error('❌ Payment modal not found!');
            } else {
                console.log('✅ Payment modal found');
            }
            
            if (!paymentElement) {
                console.error('❌ Payment element container not found!');
            } else {
                console.log('✅ Payment element container found');
            }
        });
    </script>
    
    <!-- Debug Mode Styling -->
    <?php if (DEBUG_MODE): ?>
    <style>
        .debug-info {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: monospace;
            z-index: 10000;
            max-width: 300px;
        }
    </style>
    <div class="debug-info">
        <strong>Debug Info:</strong><br>
        User: <?php echo $_SESSION['user_id']; ?><br>
        Plan: <?php echo $subscriptionType; ?><br>
        Stripe: <?php echo !empty(STRIPE_PUBLISHABLE_KEY) ? 'Configured' : 'Not Configured'; ?><br>
        <a href="../test-stripe.php" target="_blank" style="color: #4CAF50;">Test Config</a>
    </div>
    <?php endif; ?>
</body>
</html>