SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `u343618305_habitus_zone` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `u343618305_habitus_zone`;

DELIMITER $$
CREATE DEFINER=`u343618305_habit`@`127.0.0.1` PROCEDURE `UpdateSubscriptionMetrics` (IN `target_date` DATE)   BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Calculate daily metrics
  INSERT INTO subscription_analytics (date, metric_type, metric_value, plan_type)
  VALUES 
  (target_date, 'active_subscriptions', 
   (SELECT COUNT(*) FROM active_subscriptions WHERE subscription_status = 'active'), 
   NULL),
  (target_date, 'active_adfree', 
   (SELECT COUNT(*) FROM active_subscriptions WHERE subscription_status = 'active' AND subscription_type = 'adfree'), 
   'adfree'),
  (target_date, 'active_premium', 
   (SELECT COUNT(*) FROM active_subscriptions WHERE subscription_status = 'active' AND subscription_type = 'premium'), 
   'premium')
  ON DUPLICATE KEY UPDATE 
    metric_value = VALUES(metric_value);

  COMMIT;
END$$

DELIMITER ;
CREATE TABLE `active_subscriptions` (
`user_id` int(11)
,`username` varchar(50)
,`email` varchar(100)
,`subscription_type` enum('free','adfree','premium')
,`subscription_expires` datetime
,`stripe_customer_id` varchar(255)
,`stripe_subscription_id` varchar(255)
,`last_payment_intent` varchar(255)
,`subscription_created_at` timestamp
,`payment_failures` int(11)
,`last_payment_failure` datetime
,`subscription_status` varchar(7)
,`days_until_expiry` int(8)
,`total_payments` bigint(21)
,`total_revenue_cents` decimal(32,0)
);

CREATE TABLE `challenges` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `use_subtasks` tinyint(1) DEFAULT 1,
  `completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `coupon_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `stripe_coupon_id` varchar(255) DEFAULT NULL,
  `discount_percent` int(11) DEFAULT NULL,
  `discount_amount` int(11) DEFAULT NULL,
  `duration` enum('once','repeating','forever') DEFAULT 'once',
  `duration_in_months` int(11) DEFAULT NULL,
  `max_redemptions` int(11) DEFAULT NULL,
  `times_redeemed` int(11) DEFAULT 0,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `discount_type` enum('percent','amount') DEFAULT 'percent',
  `applies_to` enum('all','adfree','premium') DEFAULT 'all',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional coupon metadata' CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `coupon_codes` (`id`, `code`, `stripe_coupon_id`, `discount_percent`, `discount_amount`, `duration`, `duration_in_months`, `max_redemptions`, `times_redeemed`, `valid_until`, `is_active`, `created_at`, `discount_type`, `applies_to`, `metadata`) VALUES
(1, 'WELCOME20', NULL, 20, NULL, 'once', NULL, 100, 0, '2025-08-30 16:42:04', 1, '2025-05-30 16:42:04', 'percent', 'all', NULL),
(2, 'BETA50', NULL, 50, NULL, 'once', NULL, 50, 0, '2025-06-30 16:42:04', 1, '2025-05-30 16:42:04', 'percent', 'all', NULL),
(3, 'FRIEND15', NULL, 15, NULL, 'repeating', NULL, NULL, 0, NULL, 1, '2025-05-30 16:42:04', 'percent', 'all', NULL),
(4, 'WELCOME25', NULL, 25, NULL, 'once', NULL, 1000, 0, '2025-12-31 23:59:59', 1, '2025-06-03 21:00:45', 'percent', 'all', NULL),
(5, 'PREMIUM50', NULL, 50, NULL, 'once', NULL, 100, 0, '2025-08-31 23:59:59', 1, '2025-06-03 21:00:45', 'percent', 'premium', NULL),
(6, 'SAVE1EUR', NULL, 100, NULL, 'once', NULL, 500, 0, '2025-12-31 23:59:59', 1, '2025-06-03 21:00:45', 'amount', 'adfree', NULL);

CREATE TABLE `dailies` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `highest_streak` int(11) DEFAULT 0,
  `reset_time` time DEFAULT '00:00:00',
  `last_completed` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `dailies` (`id`, `task_id`, `current_streak`, `highest_streak`, `reset_time`, `last_completed`) VALUES
(1, 1, 1, 1, '09:00:00', '2025-06-03'),
(2, 3, 1, 1, '00:00:00', '2025-06-03');

CREATE TABLE `dashboard_layouts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `layout_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ;

REPLACE INTO `dashboard_layouts` (`id`, `user_id`, `layout_json`) VALUES
(1, 1, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}'),
(2, 2, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}');

CREATE TABLE `goals` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `deadline` date DEFAULT NULL,
  `use_subtasks` tinyint(1) DEFAULT 1,
  `progress` int(11) DEFAULT 0,
  `total_steps` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `goals` (`id`, `task_id`, `deadline`, `use_subtasks`, `progress`, `total_steps`) VALUES
(1, 2, '2025-06-15', 1, 1, 1);

CREATE TABLE `item_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `item_categories` (`id`, `name`, `description`) VALUES
(1, 'Furniture', 'Items to decorate your room'),
(3, 'Decorations', 'Small decorative items');

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('update','task') NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stripe_payment_method_id` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `card_brand` varchar(50) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `card_exp_month` int(11) DEFAULT NULL,
  `card_exp_year` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `placed_items` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `surface` varchar(20) DEFAULT 'floor',
  `grid_x` int(11) NOT NULL DEFAULT 0,
  `grid_y` int(11) NOT NULL DEFAULT 0,
  `rotation` int(11) DEFAULT 0,
  `z_index` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `placed_items` (`id`, `room_id`, `inventory_id`, `surface`, `grid_x`, `grid_y`, `rotation`, `z_index`, `created_at`) VALUES
(2, 2, 2, 'floor', 2, 2, 0, 1, '2025-06-03 14:01:10'),
(3, 2, 1, 'floor', 4, 3, 0, 2, '2025-06-03 14:01:10'),
(5, 1, 7, 'floor', 5, 3, 0, 1, '2025-06-05 12:35:00'),
(6, 1, 8, 'wall-right', 2, 1, 0, 1, '2025-06-05 12:35:00');

CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `stripe_refund_id` varchar(255) NOT NULL,
  `amount` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `refunded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `floor_color` varchar(7) DEFAULT '#FFD700',
  `wall_color` varchar(7) DEFAULT '#E0E0E0',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `rooms` (`id`, `user_id`, `name`, `floor_color`, `wall_color`, `created_at`, `updated_at`) VALUES
(1, 1, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-01 12:39:17', '2025-06-01 12:39:17'),
(2, 2, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-03 13:53:40', '2025-06-03 13:53:40');

CREATE TABLE `shop_items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `rotation_variants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rotation_variants`)),
  `price` int(11) NOT NULL,
  `rarity` enum('common','uncommon','rare','epic','legendary') DEFAULT 'common',
  `grid_width` int(11) DEFAULT 1,
  `grid_height` int(11) DEFAULT 1,
  `allowed_surfaces` varchar(100) DEFAULT 'floor',
  `is_featured` tinyint(1) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ;

REPLACE INTO `shop_items` (`id`, `category_id`, `name`, `description`, `image_path`, `rotation_variants`, `price`, `rarity`, `grid_width`, `grid_height`, `allowed_surfaces`, `is_featured`, `is_available`, `created_at`) VALUES
(1, 1, 'Wooden Chair', 'A comfortable wooden chair', 'images/items/furniture/wooden_chair.webp', '[\"images/items/furniture/wooden_chair-back-right.webp\", \"images/items/furniture/wooden_chair-back-left.webp\", \"images/items/furniture/wooden_chair-front-left.webp\", \"images/items/furniture/wooden_chair-front-right.webp\"]', 50, 'common', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(2, 1, 'Simple Table', 'A basic wooden table', 'images/items/furniture/simple_table.webp', '[\"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\", \"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\"]', 100, 'common', 2, 2, 'floor', 1, 1, '2025-05-24 20:35:09'),
(3, 1, 'Bookshelf', 'Store your favorite books', 'images/items/furniture/bookshelf.webp', '[\"images/items/furniture/bookshelf-back-right.webp\", \"images/items/furniture/bookshelf-back-left.webp\", \"images/items/furniture/bookshelf-front-left.webp\", \"images/items/furniture/bookshelf-front-right.webp\"]', 150, 'common', 1, 2, 'floor', 0, 1, '2025-05-24 20:35:09'),
(4, 1, 'Cozy Sofa', 'A comfortable sofa for relaxing', 'images/items/furniture/cozy_sofa.webp', '[\"images/items/furniture/cozy_sofa-back-right.webp\", \"images/items/furniture/cozy_sofa-back-left.webp\", \"images/items/furniture/cozy_sofa-front-left.webp\", \"images/items/furniture/cozy_sofa-front-right.webp\"]', 300, 'uncommon', 3, 2, 'floor', 1, 1, '2025-05-24 20:35:09'),
(5, 3, 'Potted Plant', 'Brings life to your room', 'images/items/decorations/potted_plant.webp', NULL, 30, 'common', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(6, 3, 'Floor Lamp', 'Ambient lighting', 'images/items/decorations/floor_lamp.webp', NULL, 120, 'uncommon', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(7, 3, 'Picture Frame', 'Display your memories', 'images/items/decorations/picture_frame.webp', '[\"images/items/decorations/picture_frame-right.webp\", \"images/items/decorations/picture_frame-left.webp\"]', 40, 'common', 1, 1, 'wall-left,wall-right', 0, 1, '2025-05-24 20:35:09'),
(8, 3, 'Cactus', 'Low maintenance plant', 'images/items/decorations/cactus.webp', NULL, 25, 'common', 1, 1, 'floor', 0, 1, '2025-05-24 20:35:09'),
(9, 3, 'Wall Clock', 'Keep track of time', 'images/items/decorations/wall_clock.webp', '[\"images/items/decorations/wall_clock-right.webp\", \"images/items/decorations/wall_clock-left.webp\"]', 80, 'common', 1, 1, 'wall-left,wall-right', 0, 1, '2025-05-24 20:36:26');

CREATE TABLE `stripe_events` (
  `id` int(11) NOT NULL,
  `stripe_event_id` varchar(255) NOT NULL COMMENT 'Stripe event ID',
  `event_type` varchar(100) NOT NULL COMMENT 'Type of Stripe event',
  `processed_status` enum('processing','completed','failed','ignored') DEFAULT 'processing',
  `processed_at` timestamp NULL DEFAULT current_timestamp(),
  `failed_reason` text DEFAULT NULL COMMENT 'Reason for failure if applicable',
  `retry_count` int(11) DEFAULT 0 COMMENT 'Number of processing retries',
  `event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Raw event data for debugging' CHECK (json_valid(`event_data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscription_analytics` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `metric_type` varchar(50) NOT NULL COMMENT 'new_subscriptions, cancellations, revenue, etc.',
  `metric_value` decimal(10,2) NOT NULL,
  `plan_type` varchar(20) DEFAULT NULL COMMENT 'adfree, premium, or null for total',
  `currency` varchar(3) DEFAULT 'eur',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscription_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_name` varchar(50) NOT NULL,
  `action` enum('subscribe','cancel','upgrade','downgrade') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `stripe_subscription_id` varchar(255) DEFAULT NULL COMMENT 'Stripe subscription ID',
  `currency` varchar(3) DEFAULT 'eur' COMMENT 'Payment currency',
  `payment_method_type` varchar(50) DEFAULT NULL COMMENT 'Type of payment method used',
  `failure_reason` text DEFAULT NULL COMMENT 'Reason for failure if applicable',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional metadata' CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscription_invoices` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stripe_invoice_id` varchar(255) NOT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `amount_paid` int(11) NOT NULL,
  `currency` varchar(3) DEFAULT 'eur',
  `status` varchar(50) NOT NULL,
  `invoice_pdf` varchar(500) DEFAULT NULL,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int(11) NOT NULL,
  `benefits` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `subscription_plans` (`id`, `name`, `price`, `duration`, `benefits`) VALUES
(1, 'adfree', 1.00, 30, 'No ADs'),
(2, 'premium', 5.00, 30, 'No ADs, Exclusive items and new QQLs features');

CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL,
  `parent_task_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `order_position` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `subtasks` (`id`, `parent_task_id`, `title`, `description`, `is_completed`, `order_position`, `created_at`) VALUES
(1, 2, 'Hacer modo oscuro', '', 1, 0, '2025-06-03 13:57:46');

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard','expert') DEFAULT 'medium',
  `duration` int(11) DEFAULT NULL,
  `hcoin_reward` int(11) NOT NULL,
  `is_custom` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `duration_backup` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `tasks` (`id`, `user_id`, `type_id`, `title`, `description`, `difficulty`, `duration`, `hcoin_reward`, `is_custom`, `created_at`, `duration_backup`) VALUES
(1, 2, 1, 'Hola', 'Hola', 'expert', 60, 75, 1, '2025-06-03 13:55:36', NULL),
(2, 2, 2, 'Claude', '', 'hard', NULL, 53, 1, '2025-06-03 13:57:26', NULL),
(3, 2, 1, 'ggg', '', 'expert', 60, 75, 1, '2025-06-03 14:00:27', NULL);

CREATE TABLE `task_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `hcoin_multiplier` float DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `task_types` (`id`, `name`, `description`, `hcoin_multiplier`) VALUES
(1, 'Daily', 'Tasks that reset every day', 1),
(2, 'Goal', 'Long-term objectives with multiple steps', 1.5),
(3, 'Challenge', 'Time-limited special tasks with higher rewards', 2);

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_type` enum('earn','spend') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `stripe_charge_id` varchar(255) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'eur',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL COMMENT 'Stripe payment intent ID',
  `stripe_invoice_id` varchar(255) DEFAULT NULL COMMENT 'Stripe invoice ID',
  `payment_method_type` varchar(50) DEFAULT NULL COMMENT 'Payment method used',
  `transaction_status` enum('pending','completed','failed','refunded') DEFAULT 'completed',
  `failure_reason` text DEFAULT NULL COMMENT 'Failure reason if applicable',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional transaction metadata' CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `transactions` (`id`, `user_id`, `amount`, `description`, `transaction_type`, `reference_id`, `reference_type`, `stripe_charge_id`, `payment_method`, `currency`, `created_at`, `stripe_payment_intent_id`, `stripe_invoice_id`, `payment_method_type`, `transaction_status`, `failure_reason`, `metadata`) VALUES
(1, 2, 75, 'Completed Daily: Hola', 'earn', 1, 'task', NULL, NULL, 'eur', '2025-06-03 13:56:47', NULL, NULL, NULL, 'completed', NULL, NULL),
(2, 2, 80, 'Completed Goal: Claude', 'earn', 2, 'task', NULL, NULL, 'eur', '2025-06-03 13:58:06', NULL, NULL, NULL, 'completed', NULL, NULL),
(3, 2, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-03 13:59:15', NULL, NULL, NULL, 'completed', NULL, NULL),
(4, 2, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-03 13:59:15', NULL, NULL, NULL, 'completed', NULL, NULL),
(5, 2, 75, 'Completed Daily: ggg', 'earn', 3, 'task', NULL, NULL, 'eur', '2025-06-03 14:00:29', NULL, NULL, NULL, 'completed', NULL, NULL),
(6, 2, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-03 14:00:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(7, 2, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-03 14:01:19', NULL, NULL, NULL, 'completed', NULL, NULL),
(8, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(9, 1, 300, 'Purchased: Cozy Sofa', 'spend', 4, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(10, 1, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(11, 1, 120, 'Purchased: Floor Lamp', 'spend', 6, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(12, 1, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(13, 1, 80, 'Purchased: Wall Clock', 'spend', 9, 'shop', NULL, NULL, 'eur', '2025-06-04 20:42:44', NULL, NULL, NULL, 'completed', NULL, NULL),
(14, 1, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-05 12:34:51', NULL, NULL, NULL, 'completed', NULL, NULL),
(15, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-05 12:34:51', NULL, NULL, NULL, 'completed', NULL, NULL);

CREATE TABLE `updates` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `hcoin` int(11) DEFAULT 0,
  `subscription_type` enum('free','adfree','premium') DEFAULT 'free',
  `subscription_expires` datetime DEFAULT NULL,
  `theme` varchar(20) DEFAULT 'light',
  `language` varchar(10) DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `last_payment_intent` varchar(255) DEFAULT NULL,
  `payment_method_id` varchar(255) DEFAULT NULL,
  `payment_failures` int(11) DEFAULT 0,
  `last_payment_failure` datetime DEFAULT NULL,
  `subscription_created_at` timestamp NULL DEFAULT NULL COMMENT 'When subscription was first created',
  `subscription_updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Last subscription update'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `users` (`id`, `username`, `email`, `password`, `hcoin`, `subscription_type`, `subscription_expires`, `theme`, `language`, `created_at`, `last_login`, `stripe_customer_id`, `stripe_subscription_id`, `last_payment_intent`, `payment_method_id`, `payment_failures`, `last_payment_failure`, `subscription_created_at`, `subscription_updated_at`) VALUES
(1, 'Jorge', 'jorgecastrot2005@gmail.com', '$2y$10$JQ1TE1jvG4dWqls4/k0Ofe2.A0gcw0cKT037LucNQH6RbV.tYlSYC', 9159, 'free', NULL, 'dark', 'es', '2025-06-01 12:39:17', '2025-06-05 13:01:51', 'cus_SQ1mbEWErMMsiq', NULL, NULL, NULL, 0, NULL, NULL, '2025-06-05 13:02:53'),
(2, 'vicent', 'va.tataymocholi@edu.gva.es', '$2y$10$XyC5KYwkluqvjmJuoJibJ.x6ri/HvXVA9AJ6tEYFGst9dCqFWPZfy', 0, 'free', NULL, 'light', 'en', '2025-06-03 13:53:40', NULL, 'cus_SQn1JZL6IIaYYW', NULL, NULL, NULL, 0, NULL, NULL, NULL);
DELIMITER $$
CREATE TRIGGER `update_subscription_timestamps` BEFORE UPDATE ON `users` FOR EACH ROW BEGIN
  IF NEW.subscription_type != OLD.subscription_type OR NEW.subscription_expires != OLD.subscription_expires THEN
    SET NEW.subscription_updated_at = CURRENT_TIMESTAMP;
    
    -- Set created_at if this is the first subscription
    IF OLD.subscription_type = 'free' AND NEW.subscription_type != 'free' AND OLD.subscription_created_at IS NULL THEN
      SET NEW.subscription_created_at = CURRENT_TIMESTAMP;
    END IF;
  END IF;
END
$$
DELIMITER ;

CREATE TABLE `user_coupons` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `stripe_discount_id` varchar(255) DEFAULT NULL,
  `applied_to_subscription` varchar(255) DEFAULT NULL,
  `redeemed_at` timestamp NULL DEFAULT current_timestamp(),
  `discount_amount` int(11) DEFAULT NULL COMMENT 'Actual discount amount applied',
  `expires_at` datetime DEFAULT NULL COMMENT 'When discount expires'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_inventory` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `acquired_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO `user_inventory` (`id`, `user_id`, `item_id`, `quantity`, `acquired_at`) VALUES
(1, 2, 1, 1, '2025-06-03 13:59:15'),
(2, 2, 2, 1, '2025-06-03 13:59:15'),
(3, 2, 7, 2, '2025-06-03 14:00:44'),
(4, 1, 2, 2, '2025-06-04 20:42:44'),
(5, 1, 4, 1, '2025-06-04 20:42:44'),
(6, 1, 1, 2, '2025-06-04 20:42:44'),
(7, 1, 6, 1, '2025-06-04 20:42:44'),
(8, 1, 7, 1, '2025-06-04 20:42:44'),
(9, 1, 9, 1, '2025-06-04 20:42:44');

CREATE TABLE `webhook_logs` (
  `id` int(11) NOT NULL,
  `webhook_id` varchar(255) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `processing_status` enum('received','processing','completed','failed') DEFAULT 'received',
  `request_body` longtext NOT NULL,
  `response_code` int(11) DEFAULT NULL,
  `response_body` text DEFAULT NULL,
  `processing_time_ms` int(11) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'Related user if applicable',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `active_subscriptions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u343618305_habit`@`127.0.0.1` SQL SECURITY DEFINER VIEW `active_subscriptions`  AS SELECT `u`.`id` AS `user_id`, `u`.`username` AS `username`, `u`.`email` AS `email`, `u`.`subscription_type` AS `subscription_type`, `u`.`subscription_expires` AS `subscription_expires`, `u`.`stripe_customer_id` AS `stripe_customer_id`, `u`.`stripe_subscription_id` AS `stripe_subscription_id`, `u`.`last_payment_intent` AS `last_payment_intent`, `u`.`subscription_created_at` AS `subscription_created_at`, `u`.`payment_failures` AS `payment_failures`, `u`.`last_payment_failure` AS `last_payment_failure`, CASE WHEN `u`.`subscription_expires` > current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'active' WHEN `u`.`subscription_expires` <= current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'expired' WHEN `u`.`subscription_type` = 'free' THEN 'free' ELSE 'unknown' END AS `subscription_status`, to_days(`u`.`subscription_expires`) - to_days(current_timestamp()) AS `days_until_expiry`, (select count(0) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_payments`, (select sum(`t`.`amount`) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_revenue_cents` FROM `users` AS `u` WHERE `u`.`subscription_type` is not null ;


ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

ALTER TABLE `coupon_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_code` (`code`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_stripe_coupon` (`stripe_coupon_id`);

ALTER TABLE `dailies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

ALTER TABLE `dashboard_layouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

ALTER TABLE `item_categories`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_payment_method` (`stripe_payment_method_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `placed_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `inventory_id` (`inventory_id`),
  ADD KEY `idx_placed_items_surface` (`surface`);

ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_refund` (`stripe_refund_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `shop_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_grid_size` (`grid_width`,`grid_height`);

ALTER TABLE `stripe_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event` (`stripe_event_id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_processed_status` (`processed_status`),
  ADD KEY `idx_processed_at` (`processed_at`);

ALTER TABLE `subscription_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_daily_metric` (`date`,`metric_type`,`plan_type`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_metric_type` (`metric_type`),
  ADD KEY `idx_plan_type` (`plan_type`);

ALTER TABLE `subscription_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_payment_intent` (`payment_intent_id`),
  ADD KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  ADD KEY `idx_stripe_invoice` (`stripe_invoice_id`),
  ADD KEY `idx_payment_method_type` (`payment_method_type`);

ALTER TABLE `subscription_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_invoice` (`stripe_invoice_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_subscription` (`stripe_subscription_id`);

ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_task_id` (`parent_task_id`);

ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `type_id` (`type_id`);

ALTER TABLE `task_types`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_stripe_charge` (`stripe_charge_id`),
  ADD KEY `idx_stripe_payment_intent` (`stripe_payment_intent_id`),
  ADD KEY `idx_stripe_invoice` (`stripe_invoice_id`),
  ADD KEY `idx_transaction_status` (`transaction_status`),
  ADD KEY `idx_payment_method_type` (`payment_method_type`);

ALTER TABLE `updates`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_stripe_customer` (`stripe_customer_id`),
  ADD KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  ADD KEY `idx_subscription_expires` (`subscription_expires`),
  ADD KEY `idx_subscription_type` (`subscription_type`),
  ADD KEY `idx_last_payment_intent` (`last_payment_intent`);

ALTER TABLE `user_coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_coupon` (`user_id`,`coupon_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `coupon_id` (`coupon_id`);

ALTER TABLE `user_inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `item_id` (`item_id`);

ALTER TABLE `webhook_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_webhook_id` (`webhook_id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_status` (`processing_status`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);


ALTER TABLE `challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `coupon_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `dailies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `dashboard_layouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `item_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `placed_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `shop_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `stripe_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `subscription_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `subscription_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `subscription_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `task_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

ALTER TABLE `updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `user_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

ALTER TABLE `webhook_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

ALTER TABLE `dailies`
  ADD CONSTRAINT `dailies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

ALTER TABLE `dashboard_layouts`
  ADD CONSTRAINT `dashboard_layouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `goals`
  ADD CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `placed_items`
  ADD CONSTRAINT `placed_items_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `placed_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `user_inventory` (`id`) ON DELETE CASCADE;

ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `shop_items`
  ADD CONSTRAINT `shop_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`);

ALTER TABLE `subscription_history`
  ADD CONSTRAINT `subscription_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `subscription_invoices`
  ADD CONSTRAINT `subscription_invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `subtasks`
  ADD CONSTRAINT `subtasks_ibfk_1` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `task_types` (`id`);

ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_coupons`
  ADD CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupon_codes` (`id`);

ALTER TABLE `user_inventory`
  ADD CONSTRAINT `user_inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_inventory_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
