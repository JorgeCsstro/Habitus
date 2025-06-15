-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 15-06-2025 a las 21:05:27
-- Versión del servidor: 10.11.10-MariaDB
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u343618305_habitus_zone`
--

DELIMITER $$
--
-- Procedimientos
--
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

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `active_subscriptions`
-- (Véase abajo para la vista actual)
--
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `challenges`
--

CREATE TABLE `challenges` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `use_subtasks` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `challenges`
--

TRUNCATE TABLE `challenges`;
--
-- Volcado de datos para la tabla `challenges`
--

INSERT INTO `challenges` (`id`, `task_id`, `start_date`, `end_date`, `is_completed`, `use_subtasks`) VALUES
(1, 6, '2025-06-12', '2025-07-06', 1, 1),
(2, 14, '2025-06-14', '2030-07-21', 0, 1),
(3, 17, '2025-06-14', '2025-06-21', 0, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dailies`
--

CREATE TABLE `dailies` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `highest_streak` int(11) DEFAULT 0,
  `reset_time` time DEFAULT '00:00:00',
  `last_completed` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `dailies`
--

TRUNCATE TABLE `dailies`;
--
-- Volcado de datos para la tabla `dailies`
--

INSERT INTO `dailies` (`id`, `task_id`, `current_streak`, `highest_streak`, `reset_time`, `last_completed`) VALUES
(1, 1, 1, 1, '09:00:00', '2025-06-03'),
(2, 3, 1, 1, '00:00:00', '2025-06-03'),
(4, 5, 1, 1, '08:00:00', '2025-06-15'),
(5, 8, 1, 1, '12:00:00', '2025-06-13'),
(6, 9, 1, 1, '01:00:00', '2025-06-15'),
(7, 10, 3, 3, '00:00:00', '2025-06-15'),
(8, 11, 0, 0, '09:00:00', NULL),
(9, 12, 0, 0, '11:00:00', NULL),
(10, 15, 1, 1, '11:00:00', '2025-06-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dashboard_layouts`
--

CREATE TABLE `dashboard_layouts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `layout_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ;

--
-- Truncar tablas antes de insertar `dashboard_layouts`
--

TRUNCATE TABLE `dashboard_layouts`;
--
-- Volcado de datos para la tabla `dashboard_layouts`
--

INSERT INTO `dashboard_layouts` (`id`, `user_id`, `layout_json`) VALUES
(1, 1, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}'),
(2, 2, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}'),
(4, 4, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}'),
(5, 5, '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `goals`
--

CREATE TABLE `goals` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `deadline` date DEFAULT NULL,
  `use_subtasks` tinyint(1) DEFAULT 1,
  `progress` int(11) DEFAULT 0,
  `total_steps` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `goals`
--

TRUNCATE TABLE `goals`;
--
-- Volcado de datos para la tabla `goals`
--

INSERT INTO `goals` (`id`, `task_id`, `deadline`, `use_subtasks`, `progress`, `total_steps`) VALUES
(1, 2, '2025-06-15', 1, 1, 1),
(2, 7, '2025-06-12', 1, 1, 1),
(3, 13, '2025-06-15', 1, 0, 1),
(4, 16, '2025-06-16', 1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_categories`
--

CREATE TABLE `item_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `item_categories`
--

TRUNCATE TABLE `item_categories`;
--
-- Volcado de datos para la tabla `item_categories`
--

INSERT INTO `item_categories` (`id`, `name`, `description`) VALUES
(1, 'Furniture', 'Items to decorate your room'),
(3, 'Decorations', 'Small decorative items');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

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

--
-- Truncar tablas antes de insertar `notifications`
--

TRUNCATE TABLE `notifications`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payment_methods`
--

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

--
-- Truncar tablas antes de insertar `payment_methods`
--

TRUNCATE TABLE `payment_methods`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `placed_items`
--

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

--
-- Truncar tablas antes de insertar `placed_items`
--

TRUNCATE TABLE `placed_items`;
--
-- Volcado de datos para la tabla `placed_items`
--

INSERT INTO `placed_items` (`id`, `room_id`, `inventory_id`, `surface`, `grid_x`, `grid_y`, `rotation`, `z_index`, `created_at`) VALUES
(11, 4, 26, 'floor', 3, 4, 0, 1, '2025-06-14 12:54:22'),
(12, 4, 27, 'floor', 5, 0, 0, 2, '2025-06-14 12:54:22'),
(13, 4, 29, 'wall-left', 3, 1, 0, 1, '2025-06-14 12:54:22'),
(14, 4, 28, 'floor', 2, 5, 0, 3, '2025-06-14 12:54:22'),
(15, 4, 30, 'wall-right', 2, 3, 0, 1, '2025-06-14 12:54:22'),
(16, 5, 31, 'floor', 1, 3, 0, 1, '2025-06-14 19:47:08'),
(22, 1, 24, 'floor', 3, 4, 0, 1, '2025-06-14 20:11:39'),
(23, 1, 32, 'floor', 4, 1, 180, 2, '2025-06-14 20:11:39'),
(24, 1, 33, 'floor', 4, 2, 0, 3, '2025-06-14 20:11:39'),
(25, 1, 34, 'wall-right', 2, 1, 0, 1, '2025-06-14 20:11:39'),
(26, 1, 25, 'wall-left', 3, 1, 0, 1, '2025-06-14 20:11:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `refunds`
--

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

--
-- Truncar tablas antes de insertar `refunds`
--

TRUNCATE TABLE `refunds`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `floor_color` varchar(7) DEFAULT '#FFD700',
  `wall_color` varchar(7) DEFAULT '#E0E0E0',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `rooms`
--

TRUNCATE TABLE `rooms`;
--
-- Volcado de datos para la tabla `rooms`
--

INSERT INTO `rooms` (`id`, `user_id`, `name`, `floor_color`, `wall_color`, `created_at`, `updated_at`) VALUES
(1, 1, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-01 12:39:17', '2025-06-01 12:39:17'),
(2, 2, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-03 13:53:40', '2025-06-03 13:53:40'),
(4, 4, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-14 10:51:12', '2025-06-14 10:51:12'),
(5, 5, 'My First Room', '#FFD700', '#E0E0E0', '2025-06-14 19:43:01', '2025-06-14 19:43:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shop_items`
--

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

--
-- Truncar tablas antes de insertar `shop_items`
--

TRUNCATE TABLE `shop_items`;
--
-- Volcado de datos para la tabla `shop_items`
--

INSERT INTO `shop_items` (`id`, `category_id`, `name`, `description`, `image_path`, `rotation_variants`, `price`, `rarity`, `grid_width`, `grid_height`, `allowed_surfaces`, `is_featured`, `is_available`, `created_at`) VALUES
(1, 1, 'Wooden Chair', 'A comfortable wooden chair', 'images/items/furniture/wooden_chair.webp', '[\"images/items/furniture/wooden_chair-back-right.webp\", \"images/items/furniture/wooden_chair-back-left.webp\", \"images/items/furniture/wooden_chair-front-left.webp\", \"images/items/furniture/wooden_chair-front-right.webp\"]', 50, 'common', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(2, 1, 'Simple Table', 'A basic wooden table', 'images/items/furniture/simple_table.webp', '[\"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\", \"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\"]', 100, 'common', 2, 2, 'floor', 1, 1, '2025-05-24 20:35:09'),
(3, 1, 'Bookshelf', 'Store your favorite books', 'images/items/furniture/bookshelf.webp', '[\"images/items/furniture/bookshelf-right.webp\", \"images/items/furniture/bookshelf-left.webp\", \"images/items/furniture/bookshelf-left.webp\", \"images/items/furniture/bookshelf-right.webp\"]', 150, 'common', 1, 1, 'floor', 0, 1, '2025-05-24 20:35:09'),
(4, 1, 'Cozy Sofa', 'A comfortable sofa for relaxing', 'images/items/furniture/cozy_sofa.webp', '[\"images/items/furniture/cozy_sofa-back-right.webp\", \"images/items/furniture/cozy_sofa-back-left.webp\", \"images/items/furniture/cozy_sofa-front-left.webp\", \"images/items/furniture/cozy_sofa-front-right.webp\"]', 300, 'uncommon', 3, 2, 'floor', 1, 1, '2025-05-24 20:35:09'),
(5, 3, 'Potted Plant', 'Brings life to your room', 'images/items/decorations/potted_plant.webp', NULL, 30, 'common', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(6, 3, 'Floor Lamp', 'Ambient lighting', 'images/items/decorations/floor_lamp.webp', NULL, 120, 'uncommon', 1, 1, 'floor', 1, 1, '2025-05-24 20:35:09'),
(7, 3, 'Picture Frame', 'Display your memories', 'images/items/decorations/picture_frame.webp', '[\"images/items/decorations/picture_frame-right.webp\", \"images/items/decorations/picture_frame-left.webp\"]', 40, 'common', 1, 1, 'wall-left,wall-right', 0, 1, '2025-05-24 20:35:09'),
(8, 3, 'Cactus', 'Low maintenance plant', 'images/items/decorations/cactus.webp', NULL, 25, 'common', 1, 1, 'floor', 0, 1, '2025-05-24 20:35:09'),
(9, 3, 'Wall Clock', 'Keep track of time', 'images/items/decorations/wall_clock.webp', '[\"images/items/decorations/wall_clock-right.webp\", \"images/items/decorations/wall_clock-left.webp\"]', 80, 'common', 1, 1, 'wall-left,wall-right', 0, 1, '2025-05-24 20:36:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stripe_events`
--

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

--
-- Truncar tablas antes de insertar `stripe_events`
--

TRUNCATE TABLE `stripe_events`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_analytics`
--

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

--
-- Truncar tablas antes de insertar `subscription_analytics`
--

TRUNCATE TABLE `subscription_analytics`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_history`
--

CREATE TABLE `subscription_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `plan_type` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  `stripe_event_id` varchar(255) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `subscription_history`
--

TRUNCATE TABLE `subscription_history`;
--
-- Volcado de datos para la tabla `subscription_history`
--

INSERT INTO `subscription_history` (`id`, `user_id`, `event_type`, `plan_type`, `amount`, `stripe_event_id`, `stripe_invoice_id`, `stripe_payment_intent_id`, `metadata`, `created_at`) VALUES
(1, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:01'),
(2, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:04'),
(3, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:09'),
(4, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:11'),
(5, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:14'),
(6, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:42'),
(7, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:46'),
(8, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-07 18:28:48'),
(9, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 00:23:39'),
(10, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 00:23:45'),
(11, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:58:21'),
(12, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:58:35'),
(13, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:58:42'),
(14, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:58:46'),
(15, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:59:29'),
(16, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:59:31'),
(17, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:59:34'),
(18, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 09:59:52'),
(19, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:00:00'),
(20, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:17:04'),
(21, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:17:07'),
(22, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:17:31'),
(23, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:20:14'),
(24, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:36:45'),
(25, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:37:10'),
(26, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:40:14'),
(27, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 10:40:53'),
(28, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 11:31:01'),
(29, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 11:34:50'),
(30, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 11:35:19'),
(31, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 11:48:29'),
(32, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 12:19:08'),
(33, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-08 12:19:48'),
(34, 1, 'payment_attempt', 'premium', 0.00, NULL, NULL, NULL, NULL, '2025-06-13 22:06:02'),
(35, 5, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-14 19:48:14'),
(36, 5, 'payment_attempt', 'premium', 0.00, NULL, NULL, NULL, NULL, '2025-06-14 19:49:05'),
(37, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-14 20:16:48'),
(38, 1, 'payment_attempt', 'adfree', 0.00, NULL, NULL, NULL, NULL, '2025-06-15 13:28:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_invoices`
--

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

--
-- Truncar tablas antes de insertar `subscription_invoices`
--

TRUNCATE TABLE `subscription_invoices`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int(11) NOT NULL,
  `benefits` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `subscription_plans`
--

TRUNCATE TABLE `subscription_plans`;
--
-- Volcado de datos para la tabla `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration`, `benefits`) VALUES
(1, 'adfree', 1.00, 30, 'No ADs'),
(2, 'premium', 5.00, 30, 'No ADs, Exclusive items and new QQLs features');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subtasks`
--

CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL,
  `parent_task_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `order_position` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `subtasks`
--

TRUNCATE TABLE `subtasks`;
--
-- Volcado de datos para la tabla `subtasks`
--

INSERT INTO `subtasks` (`id`, `parent_task_id`, `title`, `description`, `is_completed`, `order_position`, `created_at`) VALUES
(1, 2, 'Hacer modo oscuro', '', 1, 0, '2025-06-03 13:57:46'),
(2, 7, 'Holaaaa 2', '', 1, 0, '2025-06-13 14:51:52'),
(3, 16, 'Hi 1', '', 1, 0, '2025-06-14 19:45:15'),
(4, 16, 'Hi 2', '', 1, 1, '2025-06-14 19:45:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasks`
--

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
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `tasks`
--

TRUNCATE TABLE `tasks`;
--
-- Volcado de datos para la tabla `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `type_id`, `title`, `description`, `difficulty`, `duration`, `hcoin_reward`, `is_custom`, `created_at`) VALUES
(1, 2, 1, 'Hola', 'Hola', 'expert', 60, 75, 1, '2025-06-03 13:55:36'),
(2, 2, 2, 'Claude', '', 'hard', NULL, 53, 1, '2025-06-03 13:57:26'),
(3, 2, 1, 'ggg', '', 'expert', 60, 75, 1, '2025-06-03 14:00:27'),
(5, 1, 1, 'Hello world', 'a', 'expert', 1, 50, 1, '2025-06-12 20:50:14'),
(6, 1, 3, 'My first Challenge', 'a', 'medium', NULL, 40, 1, '2025-06-12 21:03:26'),
(7, 1, 2, 'Sample goal 7', 'This is a sample goal description.', 'medium', NULL, 38, 1, '2025-06-12 21:04:28'),
(8, 1, 1, '1', '1', 'easy', 1, 10, 1, '2025-06-13 15:20:20'),
(9, 1, 1, 'Hi', 'aaaa', 'easy', 15, 10, 1, '2025-06-13 15:28:28'),
(10, 1, 1, 'aaaaa', 'aaaa', 'hard', 15, 35, 1, '2025-06-13 15:44:43'),
(11, 4, 1, 'Hola Mundo', 'Hola Mundo', 'easy', 1, 10, 1, '2025-06-14 11:33:51'),
(12, 4, 1, 'Ejercicio', '', 'medium', 30, 25, 1, '2025-06-14 11:34:52'),
(13, 4, 2, 'Terminar proyecto', '', 'hard', NULL, 53, 1, '2025-06-14 11:35:18'),
(14, 4, 3, 'Continuar Habitus', '', 'expert', NULL, 100, 1, '2025-06-14 11:36:53'),
(15, 5, 1, 'Hello World', 'Hi', 'hard', 50, 44, 1, '2025-06-14 19:44:33'),
(16, 5, 2, 'Hi', 'Hi', 'medium', NULL, 30, 1, '2025-06-14 19:44:58'),
(17, 5, 3, 'Hi', '2', 'hard', NULL, 70, 1, '2025-06-14 19:45:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `task_types`
--

CREATE TABLE `task_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `hcoin_multiplier` float DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `task_types`
--

TRUNCATE TABLE `task_types`;
--
-- Volcado de datos para la tabla `task_types`
--

INSERT INTO `task_types` (`id`, `name`, `description`, `hcoin_multiplier`) VALUES
(1, 'Daily', 'Tasks that reset every day', 1),
(2, 'Goal', 'Long-term objectives with multiple steps', 1.5),
(3, 'Challenge', 'Time-limited special tasks with higher rewards', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transactions`
--

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

--
-- Truncar tablas antes de insertar `transactions`
--

TRUNCATE TABLE `transactions`;
--
-- Volcado de datos para la tabla `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `amount`, `description`, `transaction_type`, `reference_id`, `reference_type`, `stripe_charge_id`, `payment_method`, `currency`, `created_at`, `stripe_payment_intent_id`, `stripe_invoice_id`, `payment_method_type`, `transaction_status`, `failure_reason`, `metadata`) VALUES
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
(15, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-05 12:34:51', NULL, NULL, NULL, 'completed', NULL, NULL),
(16, 1, 100, 'Demo Subscription: Adfree Plan', 'spend', NULL, 'subscription', NULL, NULL, 'eur', '2025-06-06 00:23:02', NULL, NULL, NULL, 'completed', NULL, NULL),
(17, 1, 500, 'Demo Subscription: Premium Plan', 'spend', NULL, 'subscription', NULL, NULL, 'eur', '2025-06-06 00:24:34', NULL, NULL, NULL, 'completed', NULL, NULL),
(18, 1, 100, 'Demo Subscription: Adfree Plan', 'spend', NULL, 'subscription', NULL, NULL, 'eur', '2025-06-06 00:24:39', NULL, NULL, NULL, 'completed', NULL, NULL),
(19, 1, 500, 'Demo Subscription: Premium Plan', 'spend', NULL, 'subscription', NULL, NULL, 'eur', '2025-06-06 00:30:26', NULL, NULL, NULL, 'completed', NULL, NULL),
(20, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(21, 1, 300, 'Purchased: Cozy Sofa', 'spend', 4, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(22, 1, 80, 'Purchased: Wall Clock', 'spend', 9, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(23, 1, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(24, 1, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(25, 1, 30, 'Purchased: Potted Plant', 'spend', 5, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(26, 1, 25, 'Purchased: Cactus', 'spend', 8, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(27, 1, 150, 'Purchased: Bookshelf', 'spend', 3, 'shop', NULL, NULL, 'eur', '2025-06-11 15:59:53', NULL, NULL, NULL, 'completed', NULL, NULL),
(28, 1, 150, 'Purchased: Bookshelf', 'spend', 3, 'shop', NULL, NULL, 'eur', '2025-06-11 17:37:18', NULL, NULL, NULL, 'completed', NULL, NULL),
(29, 1, 300, 'Purchased: Cozy Sofa', 'spend', 4, 'shop', NULL, NULL, 'eur', '2025-06-11 17:43:17', NULL, NULL, NULL, 'completed', NULL, NULL),
(30, 1, 150, 'Purchased: Bookshelf', 'spend', 3, 'shop', NULL, NULL, 'eur', '2025-06-11 17:43:17', NULL, NULL, NULL, 'completed', NULL, NULL),
(31, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-11 17:43:32', NULL, NULL, NULL, 'completed', NULL, NULL),
(32, 1, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-11 17:48:07', NULL, NULL, NULL, 'completed', NULL, NULL),
(33, 1, 150, 'Purchased: Bookshelf', 'spend', 3, 'shop', NULL, NULL, 'eur', '2025-06-11 17:48:07', NULL, NULL, NULL, 'completed', NULL, NULL),
(34, 1, 25, 'Purchased: Cactus', 'spend', 8, 'shop', NULL, NULL, 'eur', '2025-06-11 17:48:07', NULL, NULL, NULL, 'completed', NULL, NULL),
(35, 1, 120, 'Purchased: Floor Lamp', 'spend', 6, 'shop', NULL, NULL, 'eur', '2025-06-11 17:58:36', NULL, NULL, NULL, 'completed', NULL, NULL),
(36, 1, 300, 'Purchased: Cozy Sofa', 'spend', 4, 'shop', NULL, NULL, 'eur', '2025-06-11 17:58:36', NULL, NULL, NULL, 'completed', NULL, NULL),
(37, 1, 80, 'Purchased: Wall Clock', 'spend', 9, 'shop', NULL, NULL, 'eur', '2025-06-11 17:58:36', NULL, NULL, NULL, 'completed', NULL, NULL),
(38, 1, 35, 'Completed Daily: dsd', 'earn', 4, 'task', NULL, NULL, 'eur', '2025-06-12 20:16:34', NULL, NULL, NULL, 'completed', NULL, NULL),
(39, 1, 50, 'Completed Daily: Hello world', 'earn', 5, 'task', NULL, NULL, 'eur', '2025-06-13 14:52:00', NULL, NULL, NULL, 'completed', NULL, NULL),
(40, 1, 80, 'Completed Challenge: My first Challenge', 'earn', 6, 'task', NULL, NULL, 'eur', '2025-06-13 14:52:02', NULL, NULL, NULL, 'completed', NULL, NULL),
(41, 1, 10, 'Completed Daily: 1', 'earn', 8, 'task', NULL, NULL, 'eur', '2025-06-13 15:20:24', NULL, NULL, NULL, 'completed', NULL, NULL),
(42, 1, 10, 'Completed Daily: Hi', 'earn', 9, 'task', NULL, NULL, 'eur', '2025-06-13 15:29:12', NULL, NULL, NULL, 'completed', NULL, NULL),
(43, 1, 35, 'Completed Daily: aaaaa', 'earn', 10, 'task', NULL, NULL, 'eur', '2025-06-13 15:44:48', NULL, NULL, NULL, 'completed', NULL, NULL),
(44, 4, 300, 'Purchased: Cozy Sofa', 'spend', 4, 'shop', NULL, NULL, 'eur', '2025-06-14 11:58:21', NULL, NULL, NULL, 'completed', NULL, NULL),
(45, 4, 25, 'Purchased: Cactus', 'spend', 8, 'shop', NULL, NULL, 'eur', '2025-06-14 11:58:21', NULL, NULL, NULL, 'completed', NULL, NULL),
(46, 4, 120, 'Purchased: Floor Lamp', 'spend', 6, 'shop', NULL, NULL, 'eur', '2025-06-14 11:58:21', NULL, NULL, NULL, 'completed', NULL, NULL),
(47, 4, 80, 'Purchased: Wall Clock', 'spend', 9, 'shop', NULL, NULL, 'eur', '2025-06-14 12:23:32', NULL, NULL, NULL, 'completed', NULL, NULL),
(48, 4, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-14 12:23:32', NULL, NULL, NULL, 'completed', NULL, NULL),
(49, 5, 45, 'Completed Goal: Hi', 'earn', 16, 'task', NULL, NULL, 'eur', '2025-06-14 19:45:38', NULL, NULL, NULL, 'completed', NULL, NULL),
(50, 5, 44, 'Completed Daily: Hello World', 'earn', 15, 'task', NULL, NULL, 'eur', '2025-06-14 19:46:14', NULL, NULL, NULL, 'completed', NULL, NULL),
(51, 5, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-14 19:46:36', NULL, NULL, NULL, 'completed', NULL, NULL),
(52, 1, 37, 'Completed Daily: aaaaa', 'earn', 10, 'task', NULL, NULL, 'eur', '2025-06-14 20:09:58', NULL, NULL, NULL, 'completed', NULL, NULL),
(53, 1, 50, 'Purchased: Wooden Chair', 'spend', 1, 'shop', NULL, NULL, 'eur', '2025-06-14 20:11:04', NULL, NULL, NULL, 'completed', NULL, NULL),
(54, 1, 100, 'Purchased: Simple Table', 'spend', 2, 'shop', NULL, NULL, 'eur', '2025-06-14 20:11:04', NULL, NULL, NULL, 'completed', NULL, NULL),
(55, 1, 40, 'Purchased: Picture Frame', 'spend', 7, 'shop', NULL, NULL, 'eur', '2025-06-14 20:11:04', NULL, NULL, NULL, 'completed', NULL, NULL),
(56, 1, 39, 'Completed Daily: aaaaa', 'earn', 10, 'task', NULL, NULL, 'eur', '2025-06-15 16:16:09', NULL, NULL, NULL, 'completed', NULL, NULL),
(57, 1, 10, 'Completed Daily: Hi', 'earn', 9, 'task', NULL, NULL, 'eur', '2025-06-15 16:17:52', NULL, NULL, NULL, 'completed', NULL, NULL),
(58, 1, 50, 'Completed Daily: Hello world', 'earn', 5, 'task', NULL, NULL, 'eur', '2025-06-15 16:19:08', NULL, NULL, NULL, 'completed', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `translations`
--

CREATE TABLE `translations` (
  `id` int(11) NOT NULL,
  `content_type` varchar(50) NOT NULL COMMENT 'task, notification, interface',
  `content_id` int(11) DEFAULT NULL COMMENT 'Reference ID for dynamic content',
  `language_code` varchar(10) NOT NULL,
  `translation_key` varchar(255) NOT NULL,
  `original_text` text NOT NULL,
  `translated_text` text NOT NULL,
  `auto_translated` tinyint(1) DEFAULT 1,
  `reviewed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `translations`
--

TRUNCATE TABLE `translations`;
--
-- Volcado de datos para la tabla `translations`
--

INSERT INTO `translations` (`id`, `content_type`, `content_id`, `language_code`, `translation_key`, `original_text`, `translated_text`, `auto_translated`, `reviewed`, `created_at`, `updated_at`) VALUES
(1, 'interface', NULL, 'en', 'dashboard.title', 'Dashboard', 'Dashboard', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(2, 'interface', NULL, 'es', 'dashboard.title', 'Dashboard', 'Panel de Control', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(3, 'interface', NULL, 'en', 'tasks.title', 'Tasks', 'Tasks', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(4, 'interface', NULL, 'es', 'tasks.title', 'Tasks', 'Tareas', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(5, 'interface', NULL, 'en', 'habits.title', 'Habits', 'Habits', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(6, 'interface', NULL, 'es', 'habits.title', 'Habits', 'Hábitos', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(7, 'interface', NULL, 'en', 'shop.title', 'Shop', 'Shop', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(8, 'interface', NULL, 'es', 'shop.title', 'Shop', 'Tienda', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(9, 'interface', NULL, 'en', 'settings.title', 'Settings', 'Settings', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(10, 'interface', NULL, 'es', 'settings.title', 'Settings', 'Configuración', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(11, 'interface', NULL, 'en', 'translation.enable', 'Enable Auto-Translation', 'Enable Auto-Translation', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(12, 'interface', NULL, 'es', 'translation.enable', 'Enable Auto-Translation', 'Habilitar Traducción Automática', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(13, 'interface', NULL, 'en', 'translation.loading', 'Translating...', 'Translating...', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42'),
(14, 'interface', NULL, 'es', 'translation.loading', 'Translating...', 'Traduciendo...', 0, 0, '2025-06-09 17:26:42', '2025-06-09 17:26:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `translation_cache`
--

CREATE TABLE `translation_cache` (
  `id` int(11) NOT NULL,
  `text_hash` varchar(64) NOT NULL,
  `source_language` varchar(10) NOT NULL,
  `target_language` varchar(10) NOT NULL,
  `original_text` text NOT NULL,
  `translated_text` text NOT NULL,
  `provider` varchar(50) NOT NULL DEFAULT 'azure',
  `character_count` int(11) NOT NULL,
  `cached_at` timestamp NULL DEFAULT current_timestamp(),
  `last_used` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usage_count` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `translation_cache`
--

TRUNCATE TABLE `translation_cache`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `translation_usage`
--

CREATE TABLE `translation_usage` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `provider` varchar(50) NOT NULL,
  `character_count` int(11) NOT NULL,
  `api_calls` int(11) DEFAULT 1,
  `cost_estimate` decimal(10,4) DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `translation_usage`
--

TRUNCATE TABLE `translation_usage`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `updates`
--

CREATE TABLE `updates` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `updates`
--

TRUNCATE TABLE `updates`;
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

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
  `subscription_updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Last subscription update',
  `profile_picture` varchar(255) DEFAULT 'images/icons/profile-icon.webp',
  `preferred_language` varchar(5) DEFAULT 'en',
  `timezone` varchar(50) DEFAULT 'UTC',
  `auto_translation` tinyint(1) DEFAULT 1,
  `translation_quality` varchar(20) DEFAULT 'standard',
  `high_quality_translation` tinyint(1) DEFAULT 0,
  `email_notifications` tinyint(1) DEFAULT 1,
  `task_reminders` tinyint(1) DEFAULT 1,
  `theme_preference` varchar(20) DEFAULT 'auto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `users`
--

TRUNCATE TABLE `users`;
--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `hcoin`, `subscription_type`, `subscription_expires`, `theme`, `language`, `created_at`, `last_login`, `stripe_customer_id`, `stripe_subscription_id`, `last_payment_intent`, `payment_method_id`, `payment_failures`, `last_payment_failure`, `subscription_created_at`, `subscription_updated_at`, `profile_picture`, `preferred_language`, `timezone`, `auto_translation`, `translation_quality`, `high_quality_translation`, `email_notifications`, `task_reminders`, `theme_preference`) VALUES
(1, 'Jorge', 'jorgecastrot2005@gmail.com', '$2y$10$JQ1TE1jvG4dWqls4/k0Ofe2.A0gcw0cKT037LucNQH6RbV.tYlSYC', 7135, 'free', NULL, 'light', 'fr', '2025-06-01 12:39:17', '2025-06-15 16:36:27', 'cus_SQ1mbEWErMMsiq', 'sub_1RaGbMP82CUp8m3NdeYuJI34', 'pi_3RaGbNP82CUp8m3N1l88k32l', NULL, 0, NULL, '2025-06-06 00:23:02', '2025-06-15 21:01:44', 'uploads/profiles/profile_1_1749931944.png', 'en', 'UTC', 1, 'standard', 0, 1, 1, 'auto'),
(2, 'vicent', 'va.tataymocholi@edu.gva.es', '$2y$10$XyC5KYwkluqvjmJuoJibJ.x6ri/HvXVA9AJ6tEYFGst9dCqFWPZfy', 0, 'free', NULL, 'light', 'en', '2025-06-03 13:53:40', NULL, 'cus_SQn1JZL6IIaYYW', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'images/icons/profile-icon.webp', 'en', 'UTC', 1, 'standard', 0, 1, 1, 'auto'),
(4, 'Eternal', 'eternalthehunter@gmail.com', '$2y$10$fknB6NRQ6OvVHq4qWHb/VOgwBlh.2omIpVtR7SBKd6AhJlUhtENJW', 6404, 'free', NULL, 'light', 'en', '2025-06-14 10:51:12', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-06-14 12:23:32', 'images/icons/profile-icon.webp', 'en', 'UTC', 1, 'standard', 0, 1, 1, 'auto'),
(5, 'Moe', 'moe@gmail.com', '$2y$10$qvq/3BdPlCLRFkBJBc4CO.FJu/7ysjdrZ/mMucKkPY.evKEd.w1mq', 39, 'free', NULL, 'light', 'en', '2025-06-14 19:43:01', '2025-06-14 19:51:07', 'cus_SV03Y7jPxNBavi', 'sub_1Ra04aP82CUp8m3N5h6wk3iP', 'pi_3Ra04bP82CUp8m3N0inaxnin', NULL, 0, NULL, NULL, '2025-06-14 20:08:49', 'uploads/profiles/profile_5_1749930553.png', 'en', 'UTC', 1, 'standard', 0, 1, 1, 'auto');

--
-- Disparadores `users`
--
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_inventory`
--

CREATE TABLE `user_inventory` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `acquired_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncar tablas antes de insertar `user_inventory`
--

TRUNCATE TABLE `user_inventory`;
--
-- Volcado de datos para la tabla `user_inventory`
--

INSERT INTO `user_inventory` (`id`, `user_id`, `item_id`, `quantity`, `acquired_at`) VALUES
(23, 1, 6, 1, '2025-06-11 17:58:36'),
(24, 1, 4, 1, '2025-06-11 17:58:36'),
(25, 1, 9, 1, '2025-06-11 17:58:36'),
(26, 4, 4, 1, '2025-06-14 11:58:21'),
(27, 4, 8, 1, '2025-06-14 11:58:21'),
(28, 4, 6, 1, '2025-06-14 11:58:21'),
(29, 4, 9, 1, '2025-06-14 12:23:32'),
(30, 4, 7, 1, '2025-06-14 12:23:32'),
(31, 5, 1, 1, '2025-06-14 19:46:36'),
(32, 1, 1, 1, '2025-06-14 20:11:04'),
(33, 1, 2, 1, '2025-06-14 20:11:04'),
(34, 1, 7, 1, '2025-06-14 20:11:04');

-- --------------------------------------------------------

--
-- Estructura para la vista `active_subscriptions`
--
DROP TABLE IF EXISTS `active_subscriptions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u343618305_habit`@`127.0.0.1` SQL SECURITY DEFINER VIEW `active_subscriptions`  AS SELECT `u`.`id` AS `user_id`, `u`.`username` AS `username`, `u`.`email` AS `email`, `u`.`subscription_type` AS `subscription_type`, `u`.`subscription_expires` AS `subscription_expires`, `u`.`stripe_customer_id` AS `stripe_customer_id`, `u`.`stripe_subscription_id` AS `stripe_subscription_id`, `u`.`last_payment_intent` AS `last_payment_intent`, `u`.`subscription_created_at` AS `subscription_created_at`, `u`.`payment_failures` AS `payment_failures`, `u`.`last_payment_failure` AS `last_payment_failure`, CASE WHEN `u`.`subscription_expires` > current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'active' WHEN `u`.`subscription_expires` <= current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'expired' WHEN `u`.`subscription_type` = 'free' THEN 'free' ELSE 'unknown' END AS `subscription_status`, to_days(`u`.`subscription_expires`) - to_days(current_timestamp()) AS `days_until_expiry`, (select count(0) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_payments`, (select sum(`t`.`amount`) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_revenue_cents` FROM `users` AS `u` WHERE `u`.`subscription_type` is not null ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indices de la tabla `dailies`
--
ALTER TABLE `dailies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indices de la tabla `dashboard_layouts`
--
ALTER TABLE `dashboard_layouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `goals`
--
ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indices de la tabla `item_categories`
--
ALTER TABLE `item_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_payment_method` (`stripe_payment_method_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `placed_items`
--
ALTER TABLE `placed_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `inventory_id` (`inventory_id`),
  ADD KEY `idx_placed_items_surface` (`surface`);

--
-- Indices de la tabla `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_refund` (`stripe_refund_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Indices de la tabla `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `shop_items`
--
ALTER TABLE `shop_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_grid_size` (`grid_width`,`grid_height`);

--
-- Indices de la tabla `stripe_events`
--
ALTER TABLE `stripe_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event` (`stripe_event_id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_processed_status` (`processed_status`),
  ADD KEY `idx_processed_at` (`processed_at`);

--
-- Indices de la tabla `subscription_analytics`
--
ALTER TABLE `subscription_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_daily_metric` (`date`,`metric_type`,`plan_type`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_metric_type` (`metric_type`),
  ADD KEY `idx_plan_type` (`plan_type`);

--
-- Indices de la tabla `subscription_history`
--
ALTER TABLE `subscription_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_stripe_event` (`stripe_event_id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_plan_type` (`plan_type`);

--
-- Indices de la tabla `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_invoice` (`stripe_invoice_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_subscription` (`stripe_subscription_id`);

--
-- Indices de la tabla `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `subtasks`
--
ALTER TABLE `subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_task_id` (`parent_task_id`);

--
-- Indices de la tabla `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `type_id` (`type_id`);

--
-- Indices de la tabla `task_types`
--
ALTER TABLE `task_types`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_stripe_charge` (`stripe_charge_id`),
  ADD KEY `idx_stripe_payment_intent` (`stripe_payment_intent_id`),
  ADD KEY `idx_stripe_invoice` (`stripe_invoice_id`),
  ADD KEY `idx_transaction_status` (`transaction_status`),
  ADD KEY `idx_payment_method_type` (`payment_method_type`);

--
-- Indices de la tabla `translations`
--
ALTER TABLE `translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_translation` (`content_type`,`content_id`,`language_code`,`translation_key`),
  ADD KEY `idx_language` (`language_code`),
  ADD KEY `idx_content_type` (`content_type`),
  ADD KEY `idx_translation_key` (`translation_key`);

--
-- Indices de la tabla `translation_cache`
--
ALTER TABLE `translation_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cache` (`text_hash`,`source_language`,`target_language`),
  ADD KEY `idx_languages` (`source_language`,`target_language`),
  ADD KEY `idx_last_used` (`last_used`);

--
-- Indices de la tabla `translation_usage`
--
ALTER TABLE `translation_usage`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_daily_usage` (`user_id`,`date`,`provider`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indices de la tabla `updates`
--
ALTER TABLE `updates`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_stripe_customer` (`stripe_customer_id`),
  ADD KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  ADD KEY `idx_subscription_expires` (`subscription_expires`),
  ADD KEY `idx_subscription_type` (`subscription_type`),
  ADD KEY `idx_last_payment_intent` (`last_payment_intent`);

--
-- Indices de la tabla `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_item` (`user_id`,`item_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `item_id` (`item_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `dailies`
--
ALTER TABLE `dailies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `dashboard_layouts`
--
ALTER TABLE `dashboard_layouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `goals`
--
ALTER TABLE `goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `item_categories`
--
ALTER TABLE `item_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `placed_items`
--
ALTER TABLE `placed_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `shop_items`
--
ALTER TABLE `shop_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `stripe_events`
--
ALTER TABLE `stripe_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subscription_analytics`
--
ALTER TABLE `subscription_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subscription_history`
--
ALTER TABLE `subscription_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `subtasks`
--
ALTER TABLE `subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `task_types`
--
ALTER TABLE `task_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT de la tabla `translations`
--
ALTER TABLE `translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `translation_cache`
--
ALTER TABLE `translation_cache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `translation_usage`
--
ALTER TABLE `translation_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `updates`
--
ALTER TABLE `updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `user_inventory`
--
ALTER TABLE `user_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dailies`
--
ALTER TABLE `dailies`
  ADD CONSTRAINT `dailies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dashboard_layouts`
--
ALTER TABLE `dashboard_layouts`
  ADD CONSTRAINT `dashboard_layouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `goals`
--
ALTER TABLE `goals`
  ADD CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `placed_items`
--
ALTER TABLE `placed_items`
  ADD CONSTRAINT `placed_items_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `placed_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `user_inventory` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Filtros para la tabla `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `shop_items`
--
ALTER TABLE `shop_items`
  ADD CONSTRAINT `shop_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`);

--
-- Filtros para la tabla `subscription_history`
--
ALTER TABLE `subscription_history`
  ADD CONSTRAINT `subscription_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  ADD CONSTRAINT `subscription_invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `subtasks`
--
ALTER TABLE `subtasks`
  ADD CONSTRAINT `subtasks_ibfk_1` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `task_types` (`id`);

--
-- Filtros para la tabla `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `translation_usage`
--
ALTER TABLE `translation_usage`
  ADD CONSTRAINT `translation_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD CONSTRAINT `user_inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_inventory_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
