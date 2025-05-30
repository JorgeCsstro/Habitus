<?php
// pages/subscription.php

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
$plansQuery = "SELECT * FROM subscription_plans";
$stmt = $conn->query($plansQuery);
$plans = $stmt->fetchAll();

// Format plans data for easier access
$planData = [];
foreach ($plans as $plan) {
    $planData[$plan['name']] = $plan;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription - <?php echo SITE_NAME; ?></title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/subscription.css">
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
                            <p>Focus on your tasks without any distractions or interruptions</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/exclusive-icon-light.webp" alt="Exclusive">
                            </div>
                            <h3>Exclusive Content</h3>
                            <p>Access special items and themes not available to free users</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/support-icon-light.webp" alt="Support">
                            </div>
                            <h3>Support Development</h3>
                            <p>Help us continue improving and adding new features</p>
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
                                <p>Yes! You can cancel your subscription at any time. You'll retain access to premium features until the end of your billing period.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                What payment methods do you accept?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>We accept all major credit and debit cards through our secure payment processor.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Can I change plans later?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Is my payment information secure?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Yes, we use industry-standard encryption and never store your payment details on our servers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Modal -->
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
                    <div id="payment-element"></div>
                                
                    <div class="payment-security">
                        <img src="../images/icons/lock.webp" alt="Secure">
                        <span>Secured by Stripe. We never store your payment details.</span>
                    </div>
                                
                    <!-- Error messages -->
                    <div id="payment-message" class="hidden"></div>
                                
                    <button type="submit" id="submit-payment-btn" class="submit-payment-btn">
                        <span id="button-text">Subscribe Now</span>
                        <span id="spinner" class="hidden">Processing...</span>
                    </button>
                </form>
                                
                <!-- Payment method logos -->
                <div class="payment-methods">
                    <img src="../images/payment/visa.svg" alt="Visa" title="Visa">
                    <img src="../images/payment/mastercard.svg" alt="Mastercard" title="Mastercard">
                    <img src="../images/payment/amex.svg" alt="American Express" title="American Express">
                    <img src="../images/payment/apple-pay.svg" alt="Apple Pay" title="Apple Pay">
                    <img src="../images/payment/google-pay.svg" alt="Google Pay" title="Google Pay">
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://js.stripe.com/v3/"></script>
    <script>
        // Initialize Stripe with your publishable key
        const stripe = Stripe('<?php echo STRIPE_PUBLISHABLE_KEY; ?>');
    </script>
    <script src="../js/main.js"></script>
    <script src="../js/subscription-stripe.js"></script>
</body>
</html>