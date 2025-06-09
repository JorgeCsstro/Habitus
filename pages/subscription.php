<?php
// pages/subscription.php - Updated with proper Stripe configuration

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

$currentLanguage = $userData['language'] ?? 'en';
$currentTheme = $userData['theme'] ?? 'light';

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

// Debug mode check
$debugMode = isset($_GET['debug']) && $_GET['debug'] === 'true';
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription - <?php echo SITE_NAME; ?></title>
    
    <!-- Theme CSS -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Main CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/subscription.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Stripe.js -->
    <script src="https://js.stripe.com/v3/"></script>
</head>
<body class="theme-<?php echo $currentTheme; ?>">
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
                    <?php if ($debugMode): ?>
                        <div class="debug-notice">
                            <strong>Debug Mode Active:</strong> Subscriptions will be simulated for testing
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Current Subscription Status -->
                <?php if ($subscriptionType !== 'free'): ?>
                <div class="current-subscription">
                    <div class="subscription-status">
                        <img src="../images/icons/sub-icon.webp" alt="Subscription">
                        <div>
                            <h3>Current Plan: <?php echo ucfirst($subscriptionType); ?></h3>
                            <?php if ($subscriptionExpires && $isSubscriptionActive): ?>
                                <p>Valid until: <?php echo date('F j, Y', strtotime($subscriptionExpires)); ?></p>
                            <?php elseif ($subscriptionExpires && !$isSubscriptionActive): ?>
                                <p style="color: #a15c5c;">Expired: <?php echo date('F j, Y', strtotime($subscriptionExpires)); ?></p>
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
                                <span class="price">0.99€</span>
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
                                <button class="plan-button subscribe-btn" 
                                        data-plan-id="adfree"
                                        data-plan-name="Ad-Free Plan"
                                        data-plan-price="€0.99/month"
                                        data-price-id="<?php echo STRIPE_PRICE_ADFREE_MONTHLY; ?>">
                                    Subscribe
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Premium Plan -->
                    <div class="plan-card premium <?php echo $subscriptionType === 'premium' ? 'current' : ''; ?>">
                        <div class="plan-badge">BEST VALUE</div>
                        <div class="plan-header">
                            <h2>Premium</h2>
                            <div class="plan-price">
                                <span class="price">4.99€</span>
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
                                <button class="plan-button premium-btn subscribe-btn" 
                                        data-plan-id="premium"
                                        data-plan-name="Premium Plan"
                                        data-plan-price="€4.99/month"
                                        data-price-id="<?php echo STRIPE_PRICE_SUPPORTER_MONTHLY; ?>">
                                    Go Premium
                                </button>
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
                                <img src="../images/icons/ads-icon.webp" alt="No Ads">
                            </div>
                            <h3>Ad-Free Experience</h3>
                            <p>Focus on your tasks without any distractions or interruptions from advertisements. Enjoy a clean, professional interface.</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/exclusive-icon.webp" alt="Exclusive">
                            </div>
                            <h3>Exclusive Content</h3>
                            <p>Access special items, themes, and features not available to free users. Customize your Habitus with premium decorations.</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/support-icon.webp" alt="Support">
                            </div>
                            <h3>Support Development</h3>
                            <p>Help us continue improving Habitus Zone and adding new features for everyone. Your support keeps the platform growing.</p>
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
                                <p>Yes! You can cancel your subscription at any time. You'll retain access to premium features until the end of your current billing period. No cancellation fees or hassles.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                What payment methods do you accept?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>We accept all major credit and debit cards through our secure payment processor Stripe. Your payment information is encrypted and never stored on our servers.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Can I change plans later?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing adjusts accordingly. You'll always have access to features you've paid for.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Is my payment information secure?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>Yes, we use Stripe's industry-standard encryption and security. We never store your payment details on our servers. All transactions are PCI DSS compliant and secured with bank-level encryption.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stripe Payment Modal -->
    <div id="stripe-payment-modal" class="modal hidden" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div class="modal-overlay"></div>
        <div class="modal-container">
            <div class="modal-header">
                <h2 id="modal-title">Complete Your Subscription</h2>
                <button class="modal-close" type="button" aria-label="Close">&times;</button>
            </div>
                                
            <div class="modal-body">
                <div id="subscription-details" class="subscription-info">
                    <h3 id="selected-plan-name">Plan Name</h3>
                    <p id="selected-plan-price">€0.00/month</p>
                </div>
                                
                <form id="stripe-payment-form">
                    <div id="stripe-payment-element">
                        <!-- Stripe Elements will mount here -->
                    </div>
                                
                    <div id="payment-errors" class="error-message" role="alert"></div>
                    <div id="payment-success" class="success-message hidden"></div>
                                
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary">Cancel</button>
                        <button type="submit" id="stripe-submit-btn" class="btn btn-primary">
                            <div class="spinner"></div>
                            <span class="btn-text">Subscribe Now</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    
    <script>
    // Theme initialization
    window.initialTheme = '<?php echo $currentTheme; ?>';
    document.documentElement.setAttribute('data-theme', window.initialTheme);
    document.body.classList.add('theme-' + window.initialTheme);
    
    // Debug mode configuration
    window.debugMode = <?php echo $debugMode ? 'true' : 'false'; ?>;
    
    // User data for Stripe
    window.currentUser = {
        email: '<?php echo htmlspecialchars($userData['email']); ?>',
        username: '<?php echo htmlspecialchars($userData['username']); ?>',
        id: <?php echo $userData['id']; ?>
    };
    
    // Enhanced Stripe configuration with validation
    <?php if (empty(STRIPE_PUBLISHABLE_KEY) || STRIPE_PUBLISHABLE_KEY === 'sk_live_'): ?>
    console.error('Stripe publishable key is not configured properly!');
    window.stripeConfig = null;
    <?php else: ?>
    window.stripeConfig = {
        publishableKey: '<?php echo STRIPE_PUBLISHABLE_KEY; ?>',
        currency: '<?php echo PAYMENT_CURRENCY; ?>'
    };
    <?php endif; ?>
    
    // Debug logging
    console.log('Configuration Debug:', {
        debugMode: window.debugMode,
        hasStripeConfig: !!window.stripeConfig,
        stripeKeyPrefix: window.stripeConfig ? window.stripeConfig.publishableKey.substring(0, 12) + '...' : 'NOT SET',
        currency: window.stripeConfig ? window.stripeConfig.currency : 'NOT SET',
        currentUser: window.currentUser
    });
    
    // Validate Stripe configuration
    if (window.stripeConfig && window.stripeConfig.publishableKey) {
        if (!window.stripeConfig.publishableKey.startsWith('pk_')) {
            console.error('Invalid Stripe publishable key format - should start with pk_');
            window.stripeConfig = null;
        }
    }
    </script>

    <!-- Load theme manager -->
    <script src="../js/theme-manager.js"></script>
    
    <!-- Load subscription functionality -->
    <script src="../js/subscription-checkout.js"></script>

    <!-- Load translation manager -->
    <script src="../js/translation-manager.js"></script>
</body>
</html>