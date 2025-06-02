<?php
// pages/subscription.php - COMPLETELY FIXED VERSION with Proper Payment Element Display

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

// COMPLETELY FIXED debug information
$debugInfo = [
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username'] ?? 'Unknown',
    'subscription_type' => $subscriptionType,
    'subscription_expires' => $subscriptionExpires,
    'subscription_active' => $isSubscriptionActive,
    'stripe_keys_configured' => !empty(STRIPE_PUBLISHABLE_KEY) && !empty(STRIPE_SECRET_KEY),
    'publishable_key_preview' => !empty(STRIPE_PUBLISHABLE_KEY) ? substr(STRIPE_PUBLISHABLE_KEY, 0, 12) . '...' : 'NOT SET',
    'debug_mode' => DEBUG_MODE,
    'site_url' => SITE_URL,
    'timestamp' => date('Y-m-d H:i:s'),
    'fixed_version' => '3.0-complete-card-form-fix'
];
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
    
    <!-- COMPLETELY FIXED Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/subscription.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    
    <!-- Enhanced Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Stripe JavaScript with error handling -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script src="https://js.stripe.com/v3/"></script>
    <?php else: ?>
    <!-- Development warning for missing Stripe -->
    <script>
        console.warn('⚠️ Stripe publishable key not configured');
    </script>
    <?php endif; ?>
    
    <!-- CRITICAL: COMPLETELY FIXED Modal and Stripe Element Styles -->
    <style>
        /* CRITICAL: Override any CSS that might constrain Stripe elements */
        #payment-element,
        #payment-element *,
        #stripe-payment-element,
        #stripe-payment-element * {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            transform: none !important;
            box-sizing: border-box !important;
        }
        
        /* CRITICAL: Ensure modal can accommodate any payment form size */
        .modal {
            align-items: flex-start !important;
            padding: 20px !important;
        }
        
        .modal-content {
            width: 100% !important;
            max-width: 1000px !important;
            max-height: 95vh !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            margin: 20px auto !important;
        }
        
        .modal-body {
            overflow: visible !important;
            flex: 1 !important;
            min-height: 0 !important;
        }
        
        /* CRITICAL: Remove ALL constraints from payment form */
        #payment-form {
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
        }
        
        /* CRITICAL: Let Stripe iframe size itself naturally */
        iframe[src*="js.stripe.com"] {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            border: none !important;
            overflow: visible !important;
            display: block !important;
        }
        
        /* CRITICAL: Force visibility of all Stripe-related elements */
        .StripeElement,
        .StripeElement--focus,
        .StripeElement--invalid,
        .StripeElement--complete,
        .StripeElement div,
        .StripeElement iframe {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
        }
        
        /* CRITICAL: Mobile responsive fixes */
        @media (max-width: 768px) {
            .modal {
                padding: 10px !important;
                align-items: flex-start !important;
            }
            
            .modal-content {
                margin: 10px auto !important;
                max-width: calc(100% - 20px) !important;
                max-height: 95vh !important;
            }
            
            .modal-body {
                padding: 20px 15px 25px !important;
            }
        }
        
        @media (max-width: 480px) {
            .modal {
                padding: 5px !important;
            }
            
            .modal-content {
                margin: 5px auto !important;
                max-width: calc(100% - 10px) !important;
                border-radius: 12px !important;
            }
            
            .modal-body {
                padding: 20px 12px 20px !important;
            }
        }
        
        /* CRITICAL: Ensure payment button is always accessible */
        .submit-payment-btn {
            position: relative !important;
            z-index: 10 !important;
            margin-top: 30px !important;
            margin-bottom: 0 !important;
        }
        
        /* CRITICAL: Debug helper for payment element */
        .payment-element-debug {
            border: 2px dashed #ff0000;
            background: rgba(255, 0, 0, 0.1);
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
            display: none; /* Hidden by default, enable for debugging */
        }
        
        /* CRITICAL: Force proper z-index layering */
        .modal {
            z-index: 999999 !important;
        }
        
        .modal-content {
            z-index: 1000000 !important;
            position: relative !important;
        }
        
        /* CRITICAL: Prevent any potential iframe hiding */
        iframe {
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- Left Navigation Menu -->
        <?php include '../php/include/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="content-container">
            <!-- Header -->
            <?php include '../php/include/header.php'; ?>

            <!-- COMPLETELY FIXED Subscription Content -->
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

                <!-- COMPLETELY FIXED Configuration Warning (Development) -->
                <?php if (DEBUG_MODE && (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY))): ?>
                <div class="dev-warning">
                    <strong>⚠️ Development Notice:</strong> Stripe keys not configured. Payment functionality will not work.
                    <br><a href="../test-stripe.php" target="_blank">🔧 Test Configuration</a>
                    <?php if (defined('DEBUG_MODE') && DEBUG_MODE): ?>
                        | <a href="?debug=1">🐛 Debug Mode</a>
                    <?php endif; ?>
                </div>
                <?php endif; ?>

                <!-- COMPLETELY FIXED Subscription Plans -->
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
                                <button class="plan-button" onclick="subscribeToPlan('adfree')" 
                                        <?php echo (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY)) ? 'disabled title="Payment system not configured"' : ''; ?>>
                                    <?php echo (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY)) ? 'Unavailable' : 'Subscribe'; ?>
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
                                <button class="plan-button premium-btn" onclick="subscribeToPlan('premium')"
                                        <?php echo (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY)) ? 'disabled title="Payment system not configured"' : ''; ?>>
                                    <?php echo (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY)) ? 'Unavailable' : 'Go Premium'; ?>
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- COMPLETELY FIXED Benefits Section -->
                <div class="subscription-benefits">
                    <h2>Why Subscribe?</h2>
                    <div class="benefits-grid">
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/ads-icon-light.webp" alt="No Ads">
                            </div>
                            <h3>Ad-Free Experience</h3>
                            <p>Focus on your tasks without any distractions or interruptions from advertisements. Enjoy a clean, professional interface.</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/exclusive-icon-light.webp" alt="Exclusive">
                            </div>
                            <h3>Exclusive Content</h3>
                            <p>Access special items, themes, and features not available to free users. Customize your Habitus with premium decorations.</p>
                        </div>
                        <div class="benefit">
                            <div class="benefit-icon">
                                <img src="../images/icons/support-icon-light.webp" alt="Support">
                            </div>
                            <h3>Support Development</h3>
                            <p>Help us continue improving Habitus Zone and adding new features for everyone. Your support keeps the platform growing.</p>
                        </div>
                    </div>
                </div>

                <!-- COMPLETELY FIXED FAQ Section -->
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
                                <p>We accept all major credit and debit cards, Apple Pay, and Google Pay through our secure payment processor Stripe. Your payment information is encrypted and never stored on our servers.</p>
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
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                What happens if I don't renew?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>If you don't renew, your account will revert to the free plan. You'll keep all your data, tasks, and basic room customization, but lose access to premium features and exclusive items.</p>
                            </div>
                        </div>
                        <div class="faq-item">
                            <button class="faq-question" onclick="toggleFaq(this)">
                                Do you offer refunds?
                                <img src="../images/icons/chevron-down.webp" alt="Toggle">
                            </button>
                            <div class="faq-answer">
                                <p>We offer a 7-day satisfaction guarantee. If you're not happy with your subscription within the first week, contact us for a full refund. After that, you can cancel anytime to avoid future charges.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== COMPLETELY FIXED PAYMENT MODAL WITH ZERO CONSTRAINTS ===== -->
    <div id="payment-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Complete Your Subscription</h2>
                <button class="close-modal" onclick="closePaymentModal()" aria-label="Close payment modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="payment-summary">
                    <h3 id="selected-plan-name">Plan Name</h3>
                    <p id="selected-plan-price">Price</p>
                </div>
                
                <!-- CRITICAL: COMPLETELY UNCONSTRAINED PAYMENT FORM -->
                <form id="payment-form" autocomplete="on">
                    <!-- CRITICAL: COMPLETELY MINIMAL PAYMENT ELEMENT CONTAINER -->
                    <div id="payment-element">
                        <div class="stripe-loading">
                            <div class="loading-spinner"></div>
                            <p>Initializing secure payment form...</p>
                            <small>This may take a few seconds</small>
                        </div>
                    </div>
                    
                    <!-- Debug Element (hidden by default) -->
                    <div class="payment-element-debug" id="payment-debug" style="display: none;">
                        <strong>Payment Element Debug Info:</strong><br>
                        Container Height: <span id="debug-height">Unknown</span><br>
                        Container Width: <span id="debug-width">Unknown</span><br>
                        Iframe Count: <span id="debug-iframe-count">0</span><br>
                        Element Status: <span id="debug-status">Initializing</span>
                    </div>
                    
                    <!-- COMPLETELY FIXED Payment Security Info -->
                    <div class="payment-security">
                        <img src="../images/icons/lock.webp" alt="Secure">
                        <span>🔒 Secured by Stripe. We never store your payment details.</span>
                    </div>
                    
                    <!-- COMPLETELY FIXED Error messages -->
                    <div id="payment-message" class="hidden" role="alert" aria-live="polite"></div>
                    
                    <!-- COMPLETELY FIXED Submit Button -->
                    <button type="submit" id="submit-payment-btn" class="submit-payment-btn" disabled aria-describedby="payment-message">
                        <span id="button-text">Subscribe Now</span>
                        <span id="spinner" class="hidden" aria-hidden="true"></span>
                    </button>
                </form>
                
                <!-- COMPLETELY FIXED Payment Methods Info -->
                <div class="payment-methods">
                    <span>Powered by Stripe</span>
                    <img src="../images/icons/visa.webp" alt="Visa" style="height: 16px;">
                    <img src="../images/icons/mastercard.webp" alt="Mastercard" style="height: 16px;">
                    <img src="../images/icons/apple-pay.webp" alt="Apple Pay" style="height: 16px;">
                    <img src="../images/icons/google-pay.webp" alt="Google Pay" style="height: 16px;">
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="../js/main.js"></script>
    
    <!-- COMPLETELY FIXED Stripe initialization with comprehensive error handling -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script>
        // COMPLETELY FIXED Stripe initialization with error boundary
        console.log('🔧 Initializing COMPLETELY FIXED Stripe system...');
        
        try {
            // Initialize Stripe with COMPLETELY FIXED configuration
            const stripe = Stripe('<?php echo STRIPE_PUBLISHABLE_KEY; ?>', {
                locale: 'auto',
                stripeAccount: undefined // Can be configured for marketplace applications
            });
            
            // Make globally available with COMPLETELY FIXED error handling
            window.stripe = stripe;
            
            // COMPLETELY FIXED debug information
            window.debugInfo = <?php echo json_encode($debugInfo, JSON_PRETTY_PRINT); ?>;
            
            console.log('✅ COMPLETELY FIXED Stripe initialized successfully');
            console.log('📊 COMPLETELY FIXED debug info:', window.debugInfo);
            
            // COMPLETELY FIXED connection test (optional in production)
            if (window.debugInfo.debug_mode) {
                console.log('🔧 Debug mode enabled - additional logging active');
                console.log('🔧 Fixed version:', window.debugInfo.fixed_version);
                
                // Enable payment element debugging
                setTimeout(() => {
                    const debugEl = document.getElementById('payment-debug');
                    if (debugEl && window.location.search.includes('debug')) {
                        debugEl.style.display = 'block';
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ COMPLETELY FIXED Stripe initialization failed:', error);
            
            // COMPLETELY FIXED error handling - disable all subscription buttons
            document.addEventListener('DOMContentLoaded', function() {
                const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
                buttons.forEach(button => {
                    button.disabled = true;
                    button.textContent = 'Payment System Error';
                    button.style.opacity = '0.6';
                    button.title = 'Stripe initialization failed: ' + error.message;
                });
                
                // Show COMPLETELY FIXED error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'dev-warning';
                errorDiv.innerHTML = `
                    <strong>❌ Payment System Error:</strong> ${error.message}
                    <br><small>Please refresh the page or contact support if the problem persists.</small>
                `;
                
                const content = document.querySelector('.subscription-content');
                if (content) {
                    content.insertBefore(errorDiv, content.firstChild);
                }
            });
        }
    </script>
    
    <!-- Load COMPLETELY FIXED subscription functionality -->
    <script src="../js/subscription-stripe.js"></script>
    
    <!-- COMPLETELY FIXED Payment Element Debug Helper -->
    <script>
        // Debug helper for payment element sizing
        function updatePaymentElementDebug() {
            const debugEl = document.getElementById('payment-debug');
            if (!debugEl || debugEl.style.display === 'none') return;
            
            const paymentEl = document.getElementById('payment-element');
            const iframes = document.querySelectorAll('#payment-element iframe');
            
            if (paymentEl) {
                document.getElementById('debug-height').textContent = paymentEl.offsetHeight + 'px';
                document.getElementById('debug-width').textContent = paymentEl.offsetWidth + 'px';
                document.getElementById('debug-iframe-count').textContent = iframes.length;
                document.getElementById('debug-status').textContent = iframes.length > 0 ? 'Loaded' : 'Loading';
            }
        }
        
        // Update debug info periodically when debugging is enabled
        if (window.location.search.includes('debug')) {
            setInterval(updatePaymentElementDebug, 2000);
        }
    </script>
    
    <?php else: ?>
    <!-- COMPLETELY FIXED fallback for missing Stripe configuration -->
    <script>
        console.error('❌ COMPLETELY FIXED error: Stripe publishable key not configured');
        
        // COMPLETELY FIXED configuration error handling
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
            buttons.forEach(button => {
                button.disabled = true;
                button.textContent = 'Configuration Required';
                button.style.opacity = '0.6';
                button.title = 'Stripe keys not configured in .env file';
            });
            
            console.log('🔧 COMPLETELY FIXED debug info:', <?php echo json_encode($debugInfo, JSON_PRETTY_PRINT); ?>);
        });
        
        // COMPLETELY FIXED fallback subscription function
        function subscribeToPlan(plan) {
            alert('Payment system not configured. Please contact support.\n\nMissing: Stripe API keys in environment configuration.');
            console.error('subscribeToPlan called but Stripe not configured for plan:', plan);
        }
        
        // COMPLETELY FIXED fallback management functions
        function manageSubscription() {
            alert('Subscription management not available without payment system configuration.');
        }
        
        function downgradeToFree() {
            if (confirm('Are you sure you want to downgrade to the free plan?')) {
                window.location.href = '../php/api/subscription/cancel.php';
            }
        }
        
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
        
        // Make functions globally available
        window.subscribeToPlan = subscribeToPlan;
        window.manageSubscription = manageSubscription;
        window.downgradeToFree = downgradeToFree;
        window.toggleFaq = toggleFaq;
    </script>
    <?php endif; ?>
    
    <!-- COMPLETELY FIXED general subscription management -->
    <script>
        // COMPLETELY FIXED subscription management functions with better UX
        if (typeof window.manageSubscription !== 'function') {
            window.manageSubscription = function() {
                const message = 'Would you like to cancel your subscription?\n\n' +
                              'You will retain access to premium features until the end of your billing period.\n' +
                              'You can resubscribe at any time.';
                              
                if (confirm(message)) {
                    cancelSubscriptionFixed();
                }
            };
        }
        
        if (typeof window.downgradeToFree !== 'function') {
            window.downgradeToFree = function() {
                const message = 'Are you sure you want to downgrade to the free plan?\n\n' +
                              'You will lose access to:\n' +
                              '• Ad-free experience\n' +
                              '• Exclusive shop items\n' +
                              '• Premium features\n\n' +
                              'You can upgrade again at any time.';
                              
                if (confirm(message)) {
                    cancelSubscriptionFixed();
                }
            };
        }
        
        // COMPLETELY FIXED cancellation function
        function cancelSubscriptionFixed() {
            console.log('🔧 Processing COMPLETELY FIXED subscription cancellation...');
            
            // Show loading state
            const manageBtn = document.querySelector('.manage-subscription-btn');
            if (manageBtn) {
                manageBtn.disabled = true;
                manageBtn.textContent = 'Processing...';
            }
            
            fetch('../php/api/subscription/cancel.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const message = data.expires_date ? 
                        `Subscription cancelled successfully.\n\nYou will retain access until: ${data.expires_date}` :
                        'Subscription cancelled successfully.';
                        
                    alert(message);
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    alert(data.message || 'Error cancelling subscription. Please try again.');
                    
                    // Reset button state
                    if (manageBtn) {
                        manageBtn.disabled = false;
                        manageBtn.textContent = 'Manage Subscription';
                    }
                }
            })
            .catch(error => {
                console.error('❌ COMPLETELY FIXED cancel error:', error);
                alert('An error occurred. Please try again or contact support.');
                
                // Reset button state
                if (manageBtn) {
                    manageBtn.disabled = false;
                    manageBtn.textContent = 'Manage Subscription';
                }
            });
        }
        
        // COMPLETELY FIXED FAQ toggle function with accessibility
        if (typeof window.toggleFaq !== 'function') {
            window.toggleFaq = function(questionElement) {
                const faqItem = questionElement.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const icon = questionElement.querySelector('img');
                
                // COMPLETELY FIXED accessibility
                const isExpanded = questionElement.classList.contains('active');
                questionElement.setAttribute('aria-expanded', !isExpanded);
                
                // Close other open FAQs
                document.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
                    if (activeQuestion !== questionElement) {
                        const activeFaq = activeQuestion.closest('.faq-item');
                        const activeAnswer = activeFaq.querySelector('.faq-answer');
                        const activeIcon = activeQuestion.querySelector('img');
                        
                        activeQuestion.classList.remove('active');
                        activeQuestion.setAttribute('aria-expanded', 'false');
                        activeAnswer.classList.remove('show');
                        activeAnswer.style.maxHeight = '0';
                        if (activeIcon) activeIcon.style.transform = 'rotate(0deg)';
                    }
                });
                
                // Toggle current FAQ with COMPLETELY FIXED animation
                questionElement.classList.toggle('active');
                answer.classList.toggle('show');
                
                if (answer.classList.contains('show')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    if (icon) icon.style.transform = 'rotate(180deg)';
                } else {
                    answer.style.maxHeight = '0';
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            };
        }
        
        // COMPLETELY FIXED modal management
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('payment-modal');
            if (e.target === modal && modal.classList.contains('show')) {
                if (typeof closePaymentModal === 'function') {
                    closePaymentModal();
                }
            }
        });
        
        // COMPLETELY FIXED keyboard navigation
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
        
        // COMPLETELY FIXED DOM ready check
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 COMPLETELY FIXED subscription page loaded');
            
            // COMPLETELY FIXED element validation
            const modal = document.getElementById('payment-modal');
            const paymentElement = document.getElementById('payment-element');
            
            if (!modal) {
                console.error('❌ Payment modal not found in DOM!');
            } else {
                console.log('✅ Payment modal found and ready');
            }
            
            if (!paymentElement) {
                console.error('❌ Payment element container not found in DOM!');
            } else {
                console.log('✅ Payment element container found and ready');
                console.log('📐 Payment element initial dimensions:', {
                    width: paymentElement.offsetWidth,
                    height: paymentElement.offsetHeight,
                    computed: getComputedStyle(paymentElement)
                });
            }
            
            // COMPLETELY FIXED accessibility improvements
            const faqButtons = document.querySelectorAll('.faq-question');
            faqButtons.forEach(button => {
                button.setAttribute('aria-expanded', 'false');
                button.setAttribute('role', 'button');
            });
            
            console.log('✅ COMPLETELY FIXED accessibility attributes applied');
        });
        
        // COMPLETELY FIXED error handling for payment system
        window.addEventListener('error', function(event) {
            if (event.error && event.error.message && event.error.message.toLowerCase().includes('stripe')) {
                console.error('❌ COMPLETELY FIXED Stripe error detected:', event.error);
                
                // Could show user-friendly error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'dev-warning';
                errorDiv.innerHTML = '<strong>⚠️ Payment System Notice:</strong> There was an issue with the payment system. Please refresh the page.';
                
                const content = document.querySelector('.subscription-content');
                if (content && !content.querySelector('.payment-error-notice')) {
                    errorDiv.className += ' payment-error-notice';
                    content.insertBefore(errorDiv, content.firstChild);
                }
            }
        });
        
        console.log('✅ COMPLETELY FIXED subscription management system loaded');
    </script>
    
    <!-- COMPLETELY FIXED Debug Mode Information -->
    <?php if (DEBUG_MODE && isset($_GET['debug'])): ?>
    <div class="debug-info">
        <strong>🐛 COMPLETELY FIXED Debug Info:</strong><br>
        User: <?php echo $_SESSION['user_id']; ?> (<?php echo htmlspecialchars($_SESSION['username'] ?? 'Unknown'); ?>)<br>
        Plan: <?php echo htmlspecialchars($subscriptionType); ?><br>
        Active: <?php echo $isSubscriptionActive ? 'Yes' : 'No'; ?><br>
        Expires: <?php echo $subscriptionExpires ? date('M j, Y', strtotime($subscriptionExpires)) : 'N/A'; ?><br>
        Stripe: <?php echo !empty(STRIPE_PUBLISHABLE_KEY) ? 'Configured' : 'Not Configured'; ?><br>
        Fix Ver: <?php echo $debugInfo['fixed_version']; ?><br>
        <a href="../test-stripe.php" target="_blank">🔧 Test Config</a> |
        <a href="?">🚫 Hide Debug</a> |
        <a href="?debug=1">🔍 Show Payment Debug</a>
    </div>
    <?php endif; ?>
</body>
</html>