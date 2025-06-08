-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 08-06-2025 a las 21:51:47
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
CREATE DATABASE IF NOT EXISTS `u343618305_habitus_zone` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `u343618305_habitus_zone`;

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
CREATE TABLE IF NOT EXISTS `active_subscriptions` (
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

CREATE TABLE IF NOT EXISTS `challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `use_subtasks` tinyint(1) DEFAULT 1,
  `completed` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `coupon_codes`
--

CREATE TABLE IF NOT EXISTS `coupon_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional coupon metadata' CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_active` (`is_active`),
  KEY `idx_stripe_coupon` (`stripe_coupon_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `coupon_codes`
--

UPDATE `coupon_codes` SET `id` = 1,`code` = 'WELCOME20',`stripe_coupon_id` = NULL,`discount_percent` = 20,`discount_amount` = NULL,`duration` = 'once',`duration_in_months` = NULL,`max_redemptions` = 100,`times_redeemed` = 0,`valid_until` = '2025-08-30 16:42:04',`is_active` = 1,`created_at` = '2025-05-30 16:42:04',`discount_type` = 'percent',`applies_to` = 'all',`metadata` = NULL WHERE `coupon_codes`.`id` = 1;
UPDATE `coupon_codes` SET `id` = 2,`code` = 'BETA50',`stripe_coupon_id` = NULL,`discount_percent` = 50,`discount_amount` = NULL,`duration` = 'once',`duration_in_months` = NULL,`max_redemptions` = 50,`times_redeemed` = 0,`valid_until` = '2025-06-30 16:42:04',`is_active` = 1,`created_at` = '2025-05-30 16:42:04',`discount_type` = 'percent',`applies_to` = 'all',`metadata` = NULL WHERE `coupon_codes`.`id` = 2;
UPDATE `coupon_codes` SET `id` = 3,`code` = 'FRIEND15',`stripe_coupon_id` = NULL,`discount_percent` = 15,`discount_amount` = NULL,`duration` = 'repeating',`duration_in_months` = NULL,`max_redemptions` = NULL,`times_redeemed` = 0,`valid_until` = NULL,`is_active` = 1,`created_at` = '2025-05-30 16:42:04',`discount_type` = 'percent',`applies_to` = 'all',`metadata` = NULL WHERE `coupon_codes`.`id` = 3;
UPDATE `coupon_codes` SET `id` = 4,`code` = 'WELCOME25',`stripe_coupon_id` = NULL,`discount_percent` = 25,`discount_amount` = NULL,`duration` = 'once',`duration_in_months` = NULL,`max_redemptions` = 1000,`times_redeemed` = 0,`valid_until` = '2025-12-31 23:59:59',`is_active` = 1,`created_at` = '2025-06-03 21:00:45',`discount_type` = 'percent',`applies_to` = 'all',`metadata` = NULL WHERE `coupon_codes`.`id` = 4;
UPDATE `coupon_codes` SET `id` = 5,`code` = 'PREMIUM50',`stripe_coupon_id` = NULL,`discount_percent` = 50,`discount_amount` = NULL,`duration` = 'once',`duration_in_months` = NULL,`max_redemptions` = 100,`times_redeemed` = 0,`valid_until` = '2025-08-31 23:59:59',`is_active` = 1,`created_at` = '2025-06-03 21:00:45',`discount_type` = 'percent',`applies_to` = 'premium',`metadata` = NULL WHERE `coupon_codes`.`id` = 5;
UPDATE `coupon_codes` SET `id` = 6,`code` = 'SAVE1EUR',`stripe_coupon_id` = NULL,`discount_percent` = 100,`discount_amount` = NULL,`duration` = 'once',`duration_in_months` = NULL,`max_redemptions` = 500,`times_redeemed` = 0,`valid_until` = '2025-12-31 23:59:59',`is_active` = 1,`created_at` = '2025-06-03 21:00:45',`discount_type` = 'amount',`applies_to` = 'adfree',`metadata` = NULL WHERE `coupon_codes`.`id` = 6;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dailies`
--

CREATE TABLE IF NOT EXISTS `dailies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `highest_streak` int(11) DEFAULT 0,
  `reset_time` time DEFAULT '00:00:00',
  `last_completed` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dailies`
--

UPDATE `dailies` SET `id` = 1,`task_id` = 1,`current_streak` = 1,`highest_streak` = 1,`reset_time` = '09:00:00',`last_completed` = '2025-06-03' WHERE `dailies`.`id` = 1;
UPDATE `dailies` SET `id` = 2,`task_id` = 3,`current_streak` = 1,`highest_streak` = 1,`reset_time` = '00:00:00',`last_completed` = '2025-06-03' WHERE `dailies`.`id` = 2;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dashboard_layouts`
--

CREATE TABLE IF NOT EXISTS `dashboard_layouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `layout_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ;

--
-- Volcado de datos para la tabla `dashboard_layouts`
--

UPDATE `dashboard_layouts` SET `id` = 1,`user_id` = 1,`layout_json` = '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}' WHERE `dashboard_layouts`.`id` = 1;
UPDATE `dashboard_layouts` SET `id` = 2,`user_id` = 2,`layout_json` = '{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}' WHERE `dashboard_layouts`.`id` = 2;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `demo_subscriptions`
--

CREATE TABLE IF NOT EXISTS `demo_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_type` enum('adfree','premium') NOT NULL,
  `payment_intent_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_plan` (`user_id`,`plan_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_intent` (`payment_intent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `goals`
--

CREATE TABLE IF NOT EXISTS `goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `deadline` date DEFAULT NULL,
  `use_subtasks` tinyint(1) DEFAULT 1,
  `progress` int(11) DEFAULT 0,
  `total_steps` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `goals`
--

UPDATE `goals` SET `id` = 1,`task_id` = 2,`deadline` = '2025-06-15',`use_subtasks` = 1,`progress` = 1,`total_steps` = 1 WHERE `goals`.`id` = 1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_categories`
--

CREATE TABLE IF NOT EXISTS `item_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `item_categories`
--

UPDATE `item_categories` SET `id` = 1,`name` = 'Furniture',`description` = 'Items to decorate your room' WHERE `item_categories`.`id` = 1;
UPDATE `item_categories` SET `id` = 3,`name` = 'Decorations',`description` = 'Small decorative items' WHERE `item_categories`.`id` = 3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('update','task') NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payment_methods`
--

CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `stripe_payment_method_id` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `card_brand` varchar(50) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `card_exp_month` int(11) DEFAULT NULL,
  `card_exp_year` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payment_method` (`stripe_payment_method_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `placed_items`
--

CREATE TABLE IF NOT EXISTS `placed_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `surface` varchar(20) DEFAULT 'floor',
  `grid_x` int(11) NOT NULL DEFAULT 0,
  `grid_y` int(11) NOT NULL DEFAULT 0,
  `rotation` int(11) DEFAULT 0,
  `z_index` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `idx_placed_items_surface` (`surface`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `placed_items`
--

UPDATE `placed_items` SET `id` = 2,`room_id` = 2,`inventory_id` = 2,`surface` = 'floor',`grid_x` = 2,`grid_y` = 2,`rotation` = 0,`z_index` = 1,`created_at` = '2025-06-03 14:01:10' WHERE `placed_items`.`id` = 2;
UPDATE `placed_items` SET `id` = 3,`room_id` = 2,`inventory_id` = 1,`surface` = 'floor',`grid_x` = 4,`grid_y` = 3,`rotation` = 0,`z_index` = 2,`created_at` = '2025-06-03 14:01:10' WHERE `placed_items`.`id` = 3;
UPDATE `placed_items` SET `id` = 5,`room_id` = 1,`inventory_id` = 7,`surface` = 'floor',`grid_x` = 5,`grid_y` = 3,`rotation` = 0,`z_index` = 1,`created_at` = '2025-06-05 12:35:00' WHERE `placed_items`.`id` = 5;
UPDATE `placed_items` SET `id` = 6,`room_id` = 1,`inventory_id` = 8,`surface` = 'wall-right',`grid_x` = 2,`grid_y` = 1,`rotation` = 0,`z_index` = 1,`created_at` = '2025-06-05 12:35:00' WHERE `placed_items`.`id` = 6;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `refunds`
--

CREATE TABLE IF NOT EXISTS `refunds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `stripe_refund_id` varchar(255) NOT NULL,
  `amount` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `refunded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_refund` (`stripe_refund_id`),
  KEY `user_id` (`user_id`),
  KEY `transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rooms`
--

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `floor_color` varchar(7) DEFAULT '#FFD700',
  `wall_color` varchar(7) DEFAULT '#E0E0E0',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `rooms`
--

UPDATE `rooms` SET `id` = 1,`user_id` = 1,`name` = 'My First Room',`floor_color` = '#FFD700',`wall_color` = '#E0E0E0',`created_at` = '2025-06-01 12:39:17',`updated_at` = '2025-06-01 12:39:17' WHERE `rooms`.`id` = 1;
UPDATE `rooms` SET `id` = 2,`user_id` = 2,`name` = 'My First Room',`floor_color` = '#FFD700',`wall_color` = '#E0E0E0',`created_at` = '2025-06-03 13:53:40',`updated_at` = '2025-06-03 13:53:40' WHERE `rooms`.`id` = 2;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shop_items`
--

CREATE TABLE IF NOT EXISTS `shop_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_grid_size` (`grid_width`,`grid_height`)
) ;

--
-- Volcado de datos para la tabla `shop_items`
--

UPDATE `shop_items` SET `id` = 1,`category_id` = 1,`name` = 'Wooden Chair',`description` = 'A comfortable wooden chair',`image_path` = 'images/items/furniture/wooden_chair.webp',`rotation_variants` = '[\"images/items/furniture/wooden_chair-back-right.webp\", \"images/items/furniture/wooden_chair-back-left.webp\", \"images/items/furniture/wooden_chair-front-left.webp\", \"images/items/furniture/wooden_chair-front-right.webp\"]',`price` = 50,`rarity` = 'common',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'floor',`is_featured` = 1,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 1;
UPDATE `shop_items` SET `id` = 2,`category_id` = 1,`name` = 'Simple Table',`description` = 'A basic wooden table',`image_path` = 'images/items/furniture/simple_table.webp',`rotation_variants` = '[\"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\", \"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\"]',`price` = 100,`rarity` = 'common',`grid_width` = 2,`grid_height` = 2,`allowed_surfaces` = 'floor',`is_featured` = 1,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 2;
UPDATE `shop_items` SET `id` = 3,`category_id` = 1,`name` = 'Bookshelf',`description` = 'Store your favorite books',`image_path` = 'images/items/furniture/bookshelf.webp',`rotation_variants` = '[\"images/items/furniture/bookshelf-back-right.webp\", \"images/items/furniture/bookshelf-back-left.webp\", \"images/items/furniture/bookshelf-front-left.webp\", \"images/items/furniture/bookshelf-front-right.webp\"]',`price` = 150,`rarity` = 'common',`grid_width` = 1,`grid_height` = 2,`allowed_surfaces` = 'floor',`is_featured` = 0,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 3;
UPDATE `shop_items` SET `id` = 4,`category_id` = 1,`name` = 'Cozy Sofa',`description` = 'A comfortable sofa for relaxing',`image_path` = 'images/items/furniture/cozy_sofa.webp',`rotation_variants` = '[\"images/items/furniture/cozy_sofa-back-right.webp\", \"images/items/furniture/cozy_sofa-back-left.webp\", \"images/items/furniture/cozy_sofa-front-left.webp\", \"images/items/furniture/cozy_sofa-front-right.webp\"]',`price` = 300,`rarity` = 'uncommon',`grid_width` = 3,`grid_height` = 2,`allowed_surfaces` = 'floor',`is_featured` = 1,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 4;
UPDATE `shop_items` SET `id` = 5,`category_id` = 3,`name` = 'Potted Plant',`description` = 'Brings life to your room',`image_path` = 'images/items/decorations/potted_plant.webp',`rotation_variants` = NULL,`price` = 30,`rarity` = 'common',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'floor',`is_featured` = 1,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 5;
UPDATE `shop_items` SET `id` = 6,`category_id` = 3,`name` = 'Floor Lamp',`description` = 'Ambient lighting',`image_path` = 'images/items/decorations/floor_lamp.webp',`rotation_variants` = NULL,`price` = 120,`rarity` = 'uncommon',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'floor',`is_featured` = 1,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 6;
UPDATE `shop_items` SET `id` = 7,`category_id` = 3,`name` = 'Picture Frame',`description` = 'Display your memories',`image_path` = 'images/items/decorations/picture_frame.webp',`rotation_variants` = '[\"images/items/decorations/picture_frame-right.webp\", \"images/items/decorations/picture_frame-left.webp\"]',`price` = 40,`rarity` = 'common',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'wall-left,wall-right',`is_featured` = 0,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 7;
UPDATE `shop_items` SET `id` = 8,`category_id` = 3,`name` = 'Cactus',`description` = 'Low maintenance plant',`image_path` = 'images/items/decorations/cactus.webp',`rotation_variants` = NULL,`price` = 25,`rarity` = 'common',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'floor',`is_featured` = 0,`is_available` = 1,`created_at` = '2025-05-24 20:35:09' WHERE `shop_items`.`id` = 8;
UPDATE `shop_items` SET `id` = 9,`category_id` = 3,`name` = 'Wall Clock',`description` = 'Keep track of time',`image_path` = 'images/items/decorations/wall_clock.webp',`rotation_variants` = '[\"images/items/decorations/wall_clock-right.webp\", \"images/items/decorations/wall_clock-left.webp\"]',`price` = 80,`rarity` = 'common',`grid_width` = 1,`grid_height` = 1,`allowed_surfaces` = 'wall-left,wall-right',`is_featured` = 0,`is_available` = 1,`created_at` = '2025-05-24 20:36:26' WHERE `shop_items`.`id` = 9;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stripe_events`
--

CREATE TABLE IF NOT EXISTS `stripe_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stripe_event_id` varchar(255) NOT NULL COMMENT 'Stripe event ID',
  `event_type` varchar(100) NOT NULL COMMENT 'Type of Stripe event',
  `processed_status` enum('processing','completed','failed','ignored') DEFAULT 'processing',
  `processed_at` timestamp NULL DEFAULT current_timestamp(),
  `failed_reason` text DEFAULT NULL COMMENT 'Reason for failure if applicable',
  `retry_count` int(11) DEFAULT 0 COMMENT 'Number of processing retries',
  `event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Raw event data for debugging' CHECK (json_valid(`event_data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event` (`stripe_event_id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_processed_status` (`processed_status`),
  KEY `idx_processed_at` (`processed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_analytics`
--

CREATE TABLE IF NOT EXISTS `subscription_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `metric_type` varchar(50) NOT NULL COMMENT 'new_subscriptions, cancellations, revenue, etc.',
  `metric_value` decimal(10,2) NOT NULL,
  `plan_type` varchar(20) DEFAULT NULL COMMENT 'adfree, premium, or null for total',
  `currency` varchar(3) DEFAULT 'eur',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_daily_metric` (`date`,`metric_type`,`plan_type`),
  KEY `idx_date` (`date`),
  KEY `idx_metric_type` (`metric_type`),
  KEY `idx_plan_type` (`plan_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_history`
--

CREATE TABLE IF NOT EXISTS `subscription_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `plan_type` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  `stripe_event_id` varchar(255) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_stripe_event` (`stripe_event_id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_plan_type` (`plan_type`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `subscription_history`
--

UPDATE `subscription_history` SET `id` = 1,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:01' WHERE `subscription_history`.`id` = 1;
UPDATE `subscription_history` SET `id` = 2,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:04' WHERE `subscription_history`.`id` = 2;
UPDATE `subscription_history` SET `id` = 3,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:09' WHERE `subscription_history`.`id` = 3;
UPDATE `subscription_history` SET `id` = 4,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:11' WHERE `subscription_history`.`id` = 4;
UPDATE `subscription_history` SET `id` = 5,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:14' WHERE `subscription_history`.`id` = 5;
UPDATE `subscription_history` SET `id` = 6,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:42' WHERE `subscription_history`.`id` = 6;
UPDATE `subscription_history` SET `id` = 7,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:46' WHERE `subscription_history`.`id` = 7;
UPDATE `subscription_history` SET `id` = 8,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-07 18:28:48' WHERE `subscription_history`.`id` = 8;
UPDATE `subscription_history` SET `id` = 9,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 00:23:39' WHERE `subscription_history`.`id` = 9;
UPDATE `subscription_history` SET `id` = 10,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 00:23:45' WHERE `subscription_history`.`id` = 10;
UPDATE `subscription_history` SET `id` = 11,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:58:21' WHERE `subscription_history`.`id` = 11;
UPDATE `subscription_history` SET `id` = 12,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:58:35' WHERE `subscription_history`.`id` = 12;
UPDATE `subscription_history` SET `id` = 13,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:58:42' WHERE `subscription_history`.`id` = 13;
UPDATE `subscription_history` SET `id` = 14,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:58:46' WHERE `subscription_history`.`id` = 14;
UPDATE `subscription_history` SET `id` = 15,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:59:29' WHERE `subscription_history`.`id` = 15;
UPDATE `subscription_history` SET `id` = 16,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:59:31' WHERE `subscription_history`.`id` = 16;
UPDATE `subscription_history` SET `id` = 17,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:59:34' WHERE `subscription_history`.`id` = 17;
UPDATE `subscription_history` SET `id` = 18,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 09:59:52' WHERE `subscription_history`.`id` = 18;
UPDATE `subscription_history` SET `id` = 19,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:00:00' WHERE `subscription_history`.`id` = 19;
UPDATE `subscription_history` SET `id` = 20,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:17:04' WHERE `subscription_history`.`id` = 20;
UPDATE `subscription_history` SET `id` = 21,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:17:07' WHERE `subscription_history`.`id` = 21;
UPDATE `subscription_history` SET `id` = 22,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:17:31' WHERE `subscription_history`.`id` = 22;
UPDATE `subscription_history` SET `id` = 23,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:20:14' WHERE `subscription_history`.`id` = 23;
UPDATE `subscription_history` SET `id` = 24,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:36:45' WHERE `subscription_history`.`id` = 24;
UPDATE `subscription_history` SET `id` = 25,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:37:10' WHERE `subscription_history`.`id` = 25;
UPDATE `subscription_history` SET `id` = 26,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:40:14' WHERE `subscription_history`.`id` = 26;
UPDATE `subscription_history` SET `id` = 27,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 10:40:53' WHERE `subscription_history`.`id` = 27;
UPDATE `subscription_history` SET `id` = 28,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 11:31:01' WHERE `subscription_history`.`id` = 28;
UPDATE `subscription_history` SET `id` = 29,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 11:34:50' WHERE `subscription_history`.`id` = 29;
UPDATE `subscription_history` SET `id` = 30,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 11:35:19' WHERE `subscription_history`.`id` = 30;
UPDATE `subscription_history` SET `id` = 31,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 11:48:29' WHERE `subscription_history`.`id` = 31;
UPDATE `subscription_history` SET `id` = 32,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 12:19:08' WHERE `subscription_history`.`id` = 32;
UPDATE `subscription_history` SET `id` = 33,`user_id` = 1,`event_type` = 'payment_attempt',`plan_type` = 'adfree',`amount` = 0.00,`stripe_event_id` = NULL,`stripe_invoice_id` = NULL,`stripe_payment_intent_id` = NULL,`metadata` = NULL,`created_at` = '2025-06-08 12:19:48' WHERE `subscription_history`.`id` = 33;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_invoices`
--

CREATE TABLE IF NOT EXISTS `subscription_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invoice` (`stripe_invoice_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_subscription` (`stripe_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscription_plans`
--

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int(11) NOT NULL,
  `benefits` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `subscription_plans`
--

UPDATE `subscription_plans` SET `id` = 1,`name` = 'adfree',`price` = 1.00,`duration` = 30,`benefits` = 'No ADs' WHERE `subscription_plans`.`id` = 1;
UPDATE `subscription_plans` SET `id` = 2,`name` = 'premium',`price` = 5.00,`duration` = 30,`benefits` = 'No ADs, Exclusive items and new QQLs features' WHERE `subscription_plans`.`id` = 2;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subtasks`
--

CREATE TABLE IF NOT EXISTS `subtasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_task_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `order_position` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_task_id` (`parent_task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `subtasks`
--

UPDATE `subtasks` SET `id` = 1,`parent_task_id` = 2,`title` = 'Hacer modo oscuro',`description` = '',`is_completed` = 1,`order_position` = 0,`created_at` = '2025-06-03 13:57:46' WHERE `subtasks`.`id` = 1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasks`
--

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard','expert') DEFAULT 'medium',
  `duration` int(11) DEFAULT NULL,
  `hcoin_reward` int(11) NOT NULL,
  `is_custom` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `duration_backup` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `type_id` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tasks`
--

UPDATE `tasks` SET `id` = 1,`user_id` = 2,`type_id` = 1,`title` = 'Hola',`description` = 'Hola',`difficulty` = 'expert',`duration` = 60,`hcoin_reward` = 75,`is_custom` = 1,`created_at` = '2025-06-03 13:55:36',`duration_backup` = NULL WHERE `tasks`.`id` = 1;
UPDATE `tasks` SET `id` = 2,`user_id` = 2,`type_id` = 2,`title` = 'Claude',`description` = '',`difficulty` = 'hard',`duration` = NULL,`hcoin_reward` = 53,`is_custom` = 1,`created_at` = '2025-06-03 13:57:26',`duration_backup` = NULL WHERE `tasks`.`id` = 2;
UPDATE `tasks` SET `id` = 3,`user_id` = 2,`type_id` = 1,`title` = 'ggg',`description` = '',`difficulty` = 'expert',`duration` = 60,`hcoin_reward` = 75,`is_custom` = 1,`created_at` = '2025-06-03 14:00:27',`duration_backup` = NULL WHERE `tasks`.`id` = 3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `task_types`
--

CREATE TABLE IF NOT EXISTS `task_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `hcoin_multiplier` float DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `task_types`
--

UPDATE `task_types` SET `id` = 1,`name` = 'Daily',`description` = 'Tasks that reset every day',`hcoin_multiplier` = 1 WHERE `task_types`.`id` = 1;
UPDATE `task_types` SET `id` = 2,`name` = 'Goal',`description` = 'Long-term objectives with multiple steps',`hcoin_multiplier` = 1.5 WHERE `task_types`.`id` = 2;
UPDATE `task_types` SET `id` = 3,`name` = 'Challenge',`description` = 'Time-limited special tasks with higher rewards',`hcoin_multiplier` = 2 WHERE `task_types`.`id` = 3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transactions`
--

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional transaction metadata' CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_stripe_charge` (`stripe_charge_id`),
  KEY `idx_stripe_payment_intent` (`stripe_payment_intent_id`),
  KEY `idx_stripe_invoice` (`stripe_invoice_id`),
  KEY `idx_transaction_status` (`transaction_status`),
  KEY `idx_payment_method_type` (`payment_method_type`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `transactions`
--

UPDATE `transactions` SET `id` = 1,`user_id` = 2,`amount` = 75,`description` = 'Completed Daily: Hola',`transaction_type` = 'earn',`reference_id` = 1,`reference_type` = 'task',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 13:56:47',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 1;
UPDATE `transactions` SET `id` = 2,`user_id` = 2,`amount` = 80,`description` = 'Completed Goal: Claude',`transaction_type` = 'earn',`reference_id` = 2,`reference_type` = 'task',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 13:58:06',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 2;
UPDATE `transactions` SET `id` = 3,`user_id` = 2,`amount` = 50,`description` = 'Purchased: Wooden Chair',`transaction_type` = 'spend',`reference_id` = 1,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 13:59:15',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 3;
UPDATE `transactions` SET `id` = 4,`user_id` = 2,`amount` = 100,`description` = 'Purchased: Simple Table',`transaction_type` = 'spend',`reference_id` = 2,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 13:59:15',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 4;
UPDATE `transactions` SET `id` = 5,`user_id` = 2,`amount` = 75,`description` = 'Completed Daily: ggg',`transaction_type` = 'earn',`reference_id` = 3,`reference_type` = 'task',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 14:00:29',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 5;
UPDATE `transactions` SET `id` = 6,`user_id` = 2,`amount` = 40,`description` = 'Purchased: Picture Frame',`transaction_type` = 'spend',`reference_id` = 7,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 14:00:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 6;
UPDATE `transactions` SET `id` = 7,`user_id` = 2,`amount` = 40,`description` = 'Purchased: Picture Frame',`transaction_type` = 'spend',`reference_id` = 7,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-03 14:01:19',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 7;
UPDATE `transactions` SET `id` = 8,`user_id` = 1,`amount` = 100,`description` = 'Purchased: Simple Table',`transaction_type` = 'spend',`reference_id` = 2,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 8;
UPDATE `transactions` SET `id` = 9,`user_id` = 1,`amount` = 300,`description` = 'Purchased: Cozy Sofa',`transaction_type` = 'spend',`reference_id` = 4,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 9;
UPDATE `transactions` SET `id` = 10,`user_id` = 1,`amount` = 50,`description` = 'Purchased: Wooden Chair',`transaction_type` = 'spend',`reference_id` = 1,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 10;
UPDATE `transactions` SET `id` = 11,`user_id` = 1,`amount` = 120,`description` = 'Purchased: Floor Lamp',`transaction_type` = 'spend',`reference_id` = 6,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 11;
UPDATE `transactions` SET `id` = 12,`user_id` = 1,`amount` = 40,`description` = 'Purchased: Picture Frame',`transaction_type` = 'spend',`reference_id` = 7,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 12;
UPDATE `transactions` SET `id` = 13,`user_id` = 1,`amount` = 80,`description` = 'Purchased: Wall Clock',`transaction_type` = 'spend',`reference_id` = 9,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-04 20:42:44',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 13;
UPDATE `transactions` SET `id` = 14,`user_id` = 1,`amount` = 50,`description` = 'Purchased: Wooden Chair',`transaction_type` = 'spend',`reference_id` = 1,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-05 12:34:51',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 14;
UPDATE `transactions` SET `id` = 15,`user_id` = 1,`amount` = 100,`description` = 'Purchased: Simple Table',`transaction_type` = 'spend',`reference_id` = 2,`reference_type` = 'shop',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-05 12:34:51',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 15;
UPDATE `transactions` SET `id` = 16,`user_id` = 1,`amount` = 100,`description` = 'Demo Subscription: Adfree Plan',`transaction_type` = 'spend',`reference_id` = NULL,`reference_type` = 'subscription',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-06 00:23:02',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 16;
UPDATE `transactions` SET `id` = 17,`user_id` = 1,`amount` = 500,`description` = 'Demo Subscription: Premium Plan',`transaction_type` = 'spend',`reference_id` = NULL,`reference_type` = 'subscription',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-06 00:24:34',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 17;
UPDATE `transactions` SET `id` = 18,`user_id` = 1,`amount` = 100,`description` = 'Demo Subscription: Adfree Plan',`transaction_type` = 'spend',`reference_id` = NULL,`reference_type` = 'subscription',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-06 00:24:39',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 18;
UPDATE `transactions` SET `id` = 19,`user_id` = 1,`amount` = 500,`description` = 'Demo Subscription: Premium Plan',`transaction_type` = 'spend',`reference_id` = NULL,`reference_type` = 'subscription',`stripe_charge_id` = NULL,`payment_method` = NULL,`currency` = 'eur',`created_at` = '2025-06-06 00:30:26',`stripe_payment_intent_id` = NULL,`stripe_invoice_id` = NULL,`payment_method_type` = NULL,`transaction_status` = 'completed',`failure_reason` = NULL,`metadata` = NULL WHERE `transactions`.`id` = 19;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `updates`
--

CREATE TABLE IF NOT EXISTS `updates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `demo_subscription_plan` enum('adfree','premium') DEFAULT NULL,
  `demo_subscription_date` timestamp NULL DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT 'images/icons/profile-icon.webp',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_stripe_customer` (`stripe_customer_id`),
  KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  KEY `idx_subscription_expires` (`subscription_expires`),
  KEY `idx_subscription_type` (`subscription_type`),
  KEY `idx_last_payment_intent` (`last_payment_intent`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

UPDATE `users` SET `id` = 1,`username` = 'Jorge',`email` = 'jorgecastrot2005@gmail.com',`password` = '$2y$10$JQ1TE1jvG4dWqls4/k0Ofe2.A0gcw0cKT037LucNQH6RbV.tYlSYC',`hcoin` = 9159,`subscription_type` = 'free',`subscription_expires` = NULL,`theme` = 'light',`language` = 'es',`created_at` = '2025-06-01 12:39:17',`last_login` = '2025-06-08 20:33:59',`stripe_customer_id` = 'cus_SQ1mbEWErMMsiq',`stripe_subscription_id` = 'sub_1RXiCVP82CUp8m3NtSoaRp2j',`last_payment_intent` = 'pi_3RXiCWP82CUp8m3N1kEQXpp2',`payment_method_id` = NULL,`payment_failures` = 0,`last_payment_failure` = NULL,`subscription_created_at` = '2025-06-06 00:23:02',`subscription_updated_at` = '2025-06-08 20:33:59',`demo_subscription_plan` = NULL,`demo_subscription_date` = NULL,`profile_picture` = 'images/icons/profile-icon.webp' WHERE `users`.`id` = 1;
UPDATE `users` SET `id` = 2,`username` = 'vicent',`email` = 'va.tataymocholi@edu.gva.es',`password` = '$2y$10$XyC5KYwkluqvjmJuoJibJ.x6ri/HvXVA9AJ6tEYFGst9dCqFWPZfy',`hcoin` = 0,`subscription_type` = 'free',`subscription_expires` = NULL,`theme` = 'light',`language` = 'en',`created_at` = '2025-06-03 13:53:40',`last_login` = NULL,`stripe_customer_id` = 'cus_SQn1JZL6IIaYYW',`stripe_subscription_id` = NULL,`last_payment_intent` = NULL,`payment_method_id` = NULL,`payment_failures` = 0,`last_payment_failure` = NULL,`subscription_created_at` = NULL,`subscription_updated_at` = NULL,`demo_subscription_plan` = NULL,`demo_subscription_date` = NULL,`profile_picture` = 'images/icons/profile-icon.webp' WHERE `users`.`id` = 2;

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
-- Estructura de tabla para la tabla `user_coupons`
--

CREATE TABLE IF NOT EXISTS `user_coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `stripe_discount_id` varchar(255) DEFAULT NULL,
  `applied_to_subscription` varchar(255) DEFAULT NULL,
  `redeemed_at` timestamp NULL DEFAULT current_timestamp(),
  `discount_amount` int(11) DEFAULT NULL COMMENT 'Actual discount amount applied',
  `expires_at` datetime DEFAULT NULL COMMENT 'When discount expires',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_coupon` (`user_id`,`coupon_id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_inventory`
--

CREATE TABLE IF NOT EXISTS `user_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `acquired_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `item_id` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_inventory`
--

UPDATE `user_inventory` SET `id` = 1,`user_id` = 2,`item_id` = 1,`quantity` = 1,`acquired_at` = '2025-06-03 13:59:15' WHERE `user_inventory`.`id` = 1;
UPDATE `user_inventory` SET `id` = 2,`user_id` = 2,`item_id` = 2,`quantity` = 1,`acquired_at` = '2025-06-03 13:59:15' WHERE `user_inventory`.`id` = 2;
UPDATE `user_inventory` SET `id` = 3,`user_id` = 2,`item_id` = 7,`quantity` = 2,`acquired_at` = '2025-06-03 14:00:44' WHERE `user_inventory`.`id` = 3;
UPDATE `user_inventory` SET `id` = 4,`user_id` = 1,`item_id` = 2,`quantity` = 2,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 4;
UPDATE `user_inventory` SET `id` = 5,`user_id` = 1,`item_id` = 4,`quantity` = 1,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 5;
UPDATE `user_inventory` SET `id` = 6,`user_id` = 1,`item_id` = 1,`quantity` = 2,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 6;
UPDATE `user_inventory` SET `id` = 7,`user_id` = 1,`item_id` = 6,`quantity` = 1,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 7;
UPDATE `user_inventory` SET `id` = 8,`user_id` = 1,`item_id` = 7,`quantity` = 1,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 8;
UPDATE `user_inventory` SET `id` = 9,`user_id` = 1,`item_id` = 9,`quantity` = 1,`acquired_at` = '2025-06-04 20:42:44' WHERE `user_inventory`.`id` = 9;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `webhook_logs`
--

CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_webhook_id` (`webhook_id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_status` (`processing_status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura para la vista `active_subscriptions`
--
DROP TABLE IF EXISTS `active_subscriptions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u343618305_habit`@`127.0.0.1` SQL SECURITY DEFINER VIEW `active_subscriptions`  AS SELECT `u`.`id` AS `user_id`, `u`.`username` AS `username`, `u`.`email` AS `email`, `u`.`subscription_type` AS `subscription_type`, `u`.`subscription_expires` AS `subscription_expires`, `u`.`stripe_customer_id` AS `stripe_customer_id`, `u`.`stripe_subscription_id` AS `stripe_subscription_id`, `u`.`last_payment_intent` AS `last_payment_intent`, `u`.`subscription_created_at` AS `subscription_created_at`, `u`.`payment_failures` AS `payment_failures`, `u`.`last_payment_failure` AS `last_payment_failure`, CASE WHEN `u`.`subscription_expires` > current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'active' WHEN `u`.`subscription_expires` <= current_timestamp() AND `u`.`subscription_type` <> 'free' THEN 'expired' WHEN `u`.`subscription_type` = 'free' THEN 'free' ELSE 'unknown' END AS `subscription_status`, to_days(`u`.`subscription_expires`) - to_days(current_timestamp()) AS `days_until_expiry`, (select count(0) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_payments`, (select sum(`t`.`amount`) from `transactions` `t` where `t`.`user_id` = `u`.`id` and `t`.`reference_type` = 'subscription') AS `total_revenue_cents` FROM `users` AS `u` WHERE `u`.`subscription_type` is not null ;

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
-- Filtros para la tabla `demo_subscriptions`
--
ALTER TABLE `demo_subscriptions`
  ADD CONSTRAINT `demo_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Filtros para la tabla `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupon_codes` (`id`);

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
