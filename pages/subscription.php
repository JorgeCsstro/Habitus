<?php
// pages/subscription.php - COMPLETE FIX for Stripe Payment Form Display

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
    'username' => $_SESSION['username'] ?? 'Unknown',
    'subscription_type' => $subscriptionType,
    'subscription_expires' => $subscriptionExpires,
    'subscription_active' => $isSubscriptionActive,
    'stripe_keys_configured' => !empty(STRIPE_PUBLISHABLE_KEY) && !empty(STRIPE_SECRET_KEY),
    'publishable_key_preview' => !empty(STRIPE_PUBLISHABLE_KEY) ? substr(STRIPE_PUBLISHABLE_KEY, 0, 12) . '...' : 'NOT SET',
    'debug_mode' => DEBUG_MODE,
    'site_url' => SITE_URL,
    'timestamp' => date('Y-m-d H:i:s'),
    'fixed_version' => 'complete-fix-v4.0'
];
?>

<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="<?php echo $currentTheme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription - <?php echo SITE_NAME; ?></title>
    
    <!-- REQUIRED: Theme CSS - Add this to ALL pages -->
    <link rel="stylesheet" href="../css/themes/<?php echo $currentTheme; ?>.css" id="theme-stylesheet">
    
    <!-- Your existing CSS files AFTER theme CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Component CSS -->
    <link rel="stylesheet" href="../css/components/sidebar.css">
    <link rel="stylesheet" href="../css/components/header.css">
    <link rel="stylesheet" href="../css/components/scrollbar.css">
    
    <!-- COMPLETE FIX: Updated Page-specific CSS -->
    <link rel="stylesheet" href="../css/pages/subscription.css">
    
    <link rel="icon" href="../images/favicon.ico" type="image/x-icon">
    
    <!-- Enhanced Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Stripe JavaScript -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script src="https://js.stripe.com/v3/"></script>
    <?php else: ?>
    <script>
        console.warn('⚠️ Stripe publishable key not configured');
    </script>
    <?php endif; ?>
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

                <!-- Development Warning (if Stripe not configured) -->
                <?php if (DEBUG_MODE && (empty(STRIPE_PUBLISHABLE_KEY) || empty(STRIPE_SECRET_KEY))): ?>
                <div class="dev-warning">
                    <strong>⚠️ Development Notice:</strong> Stripe keys not configured. Payment functionality will not work.
                    <br><a href="../test-stripe.php" target="_blank">🔧 Test Configuration</a>
                    <?php if (defined('DEBUG_MODE') && DEBUG_MODE): ?>
                        | <a href="?debug=1">🐛 Debug Mode</a>
                    <?php endif; ?>
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

                <!-- Benefits Section -->
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

    <!-- ===== COMPLETE FIX: PAYMENT MODAL WITH ZERO CONSTRAINTS ===== -->
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
                
                <!-- COMPLETE FIX: UNCONSTRAINED PAYMENT FORM -->
                <form id="payment-form" autocomplete="on">
                    <!-- COMPLETE FIX: MINIMAL PAYMENT ELEMENT CONTAINER -->
                    <div id="payment-element">
                        <!-- Loading state will be inserted here by JavaScript -->
                    </div>
                    
                    <!-- Payment Security Info -->
                    <div class="payment-security">
                        <img src="../images/icons/lock.webp" alt="Secure">
                        <span>🔒 Secured by Stripe. We never store your payment details.</span>
                    </div>
                    
                    <!-- Error messages -->
                    <div id="payment-message" class="hidden" role="alert" aria-live="polite"></div>
                    
                    <!-- Submit Button -->
                    <button type="submit" id="submit-payment-btn" class="submit-payment-btn" disabled aria-describedby="payment-message">
                        <span id="button-text">Subscribe Now</span>
                        <span id="spinner" class="hidden" aria-hidden="true"></span>
                    </button>
                </form>
                
                <!-- Payment Methods Info -->
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
    
    <!-- COMPLETE FIX: Stripe initialization -->
    <?php if (!empty(STRIPE_PUBLISHABLE_KEY)): ?>
    <script>
        console.log('🔧 Initializing COMPLETE FIX Stripe system...');
        
        try {
            // Initialize Stripe
            const stripe = Stripe('<?php echo STRIPE_PUBLISHABLE_KEY; ?>', {
                locale: 'auto'
            });
            
            // Make globally available
            window.stripe = stripe;
            
            // Debug information
            window.debugInfo = <?php echo json_encode($debugInfo, JSON_PRETTY_PRINT); ?>;
            
            console.log('✅ COMPLETE FIX: Stripe initialized successfully');
            console.log('📊 Debug info:', window.debugInfo);
            
        } catch (error) {
            console.error('❌ COMPLETE FIX: Stripe initialization failed:', error);
            
            // Disable subscription buttons on error
            document.addEventListener('DOMContentLoaded', function() {
                const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
                buttons.forEach(button => {
                    button.disabled = true;
                    button.textContent = 'Payment System Error';
                    button.style.opacity = '0.6';
                    button.title = 'Stripe initialization failed: ' + error.message;
                });
                
                // Show error message
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
    
    <!-- Load subscription functionality -->
    <script src="../js/subscription-stripe.js"></script>
    
    <?php else: ?>
    <!-- Fallback for missing Stripe configuration -->
    <script>
        console.error('❌ COMPLETE FIX: Stripe publishable key not configured');
        
        // Configuration error handling
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('[onclick*="subscribeToPlan"]');
            buttons.forEach(button => {
                button.disabled = true;
                button.textContent = 'Configuration Required';
                button.style.opacity = '0.6';
                button.title = 'Stripe keys not configured in .env file';
            });
            
            console.log('🔧 Debug info:', <?php echo json_encode($debugInfo, JSON_PRETTY_PRINT); ?>);
        });
        
        // Fallback functions
        function subscribeToPlan(plan) {
            alert('Payment system not configured. Please contact support.\n\nMissing: Stripe API keys in environment configuration.');
            console.error('subscribeToPlan called but Stripe not configured for plan:', plan);
        }
        
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
    
    <!-- General subscription management -->
    <script>
        // Enhanced subscription management functions
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
        
        // Cancellation function
        function cancelSubscriptionFixed() {
            console.log('🔧 Processing subscription cancellation...');
            
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
                    
                    if (manageBtn) {
                        manageBtn.disabled = false;
                        manageBtn.textContent = 'Manage Subscription';
                    }
                }
            })
            .catch(error => {
                console.error('❌ Cancel error:', error);
                alert('An error occurred. Please try again or contact support.');
                
                if (manageBtn) {
                    manageBtn.disabled = false;
                    manageBtn.textContent = 'Manage Subscription';
                }
            });
        }
        
        // FAQ toggle function with accessibility
        if (typeof window.toggleFaq !== 'function') {
            window.toggleFaq = function(questionElement) {
                const faqItem = questionElement.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const icon = questionElement.querySelector('img');
                
                // Accessibility
                const isExpanded = questionElement.classList.contains('active');
                questionElement.setAttribute('aria-expanded', !isExpanded);
                
                // Close other FAQs
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
                
                // Toggle current FAQ
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
        
        // Modal management
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('payment-modal');
            if (e.target === modal && modal.classList.contains('show')) {
                if (typeof closePaymentModal === 'function') {
                    closePaymentModal();
                }
            }
        });
        
        // Keyboard navigation
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
        
        // DOM ready validation
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 COMPLETE FIX: Subscription page loaded');
            
            // Element validation
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
            }
            
            // Accessibility improvements
            const faqButtons = document.querySelectorAll('.faq-question');
            faqButtons.forEach(button => {
                button.setAttribute('aria-expanded', 'false');
                button.setAttribute('role', 'button');
            });
            
            console.log('✅ COMPLETE FIX: Accessibility attributes applied');
        });
        
        // Error handling for payment system
        window.addEventListener('error', function(event) {
            if (event.error && event.error.message && event.error.message.toLowerCase().includes('stripe')) {
                console.error('❌ Stripe error detected:', event.error);
            }
        });
        
        console.log('✅ COMPLETE FIX: Subscription management system loaded');
    </script>
    
    <!-- Debug Mode Information -->
    <?php if (DEBUG_MODE && isset($_GET['debug'])): ?>
    <div style="position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px; font-family: monospace; z-index: 10000; max-width: 300px;">
        <strong>🐛 COMPLETE FIX Debug Info:</strong><br>
        User: <?php echo $_SESSION['user_id']; ?> (<?php echo htmlspecialchars($_SESSION['username'] ?? 'Unknown'); ?>)<br>
        Plan: <?php echo htmlspecialchars($subscriptionType); ?><br>
        Active: <?php echo $isSubscriptionActive ? 'Yes' : 'No'; ?><br>
        Expires: <?php echo $subscriptionExpires ? date('M j, Y', strtotime($subscriptionExpires)) : 'N/A'; ?><br>
        Stripe: <?php echo !empty(STRIPE_PUBLISHABLE_KEY) ? 'Configured' : 'Not Configured'; ?><br>
        Fix Ver: <?php echo $debugInfo['fixed_version']; ?><br>
        <a href="../test-stripe.php" target="_blank" style="color: #4CAF50;">🔧 Test Config</a> |
        <a href="?" style="color: #4CAF50;">🚫 Hide Debug</a>
    </div>
    <?php endif; ?>
    
    <script>
    // REQUIRED: Theme initialization for ALL pages
    window.initialTheme = '<?php echo $currentTheme; ?>';
    document.documentElement.setAttribute('data-theme', window.initialTheme);
    document.body.classList.add('theme-' + window.initialTheme);
    </script>

    <!-- Load theme manager on ALL pages -->
    <script src="../js/theme-manager.js"></script>
</body>
</html>