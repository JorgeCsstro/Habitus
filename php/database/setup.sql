CREATE DATABASE  IF NOT EXISTS `u343618305_habitus_zone` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `u343618305_habitus_zone`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: u343618305_habitus_zone
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary view structure for view `active_subscriptions`
--

DROP TABLE IF EXISTS `active_subscriptions`;
/*!50001 DROP VIEW IF EXISTS `active_subscriptions`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `active_subscriptions` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `email`,
 1 AS `subscription_type`,
 1 AS `subscription_expires`,
 1 AS `stripe_customer_id`,
 1 AS `stripe_subscription_id`,
 1 AS `status`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `use_subtasks` tinyint(1) DEFAULT '1',
  `completed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES (5,16,'2025-05-22','2025-05-28',1,1,0),(6,21,'2025-05-16','2025-05-30',1,1,0),(7,24,'2025-05-20','2025-05-31',0,1,0),(8,27,'2025-05-22','2025-05-31',0,1,0),(9,28,'2025-05-16','2025-05-31',0,1,0),(10,29,'2025-05-21','2025-05-31',0,1,0);
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_codes`
--

DROP TABLE IF EXISTS `coupon_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_coupon_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_percent` int DEFAULT NULL COMMENT 'Percentage off',
  `discount_amount` int DEFAULT NULL COMMENT 'Fixed amount off in cents',
  `duration` enum('once','repeating','forever') COLLATE utf8mb4_unicode_ci DEFAULT 'once',
  `duration_in_months` int DEFAULT NULL COMMENT 'For repeating coupons',
  `max_redemptions` int DEFAULT NULL,
  `times_redeemed` int DEFAULT '0',
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_codes`
--

LOCK TABLES `coupon_codes` WRITE;
/*!40000 ALTER TABLE `coupon_codes` DISABLE KEYS */;
INSERT INTO `coupon_codes` VALUES (1,'WELCOME20',NULL,20,NULL,'once',NULL,100,0,'2025-08-30 16:42:04',1,'2025-05-30 16:42:04'),(2,'BETA50',NULL,50,NULL,'once',NULL,50,0,'2025-06-30 16:42:04',1,'2025-05-30 16:42:04'),(3,'FRIEND15',NULL,15,NULL,'repeating',NULL,NULL,0,NULL,1,'2025-05-30 16:42:04');
/*!40000 ALTER TABLE `coupon_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dailies`
--

DROP TABLE IF EXISTS `dailies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dailies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `current_streak` int DEFAULT '0',
  `highest_streak` int DEFAULT '0',
  `reset_time` time DEFAULT '00:00:00',
  `last_completed` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `dailies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dailies`
--

LOCK TABLES `dailies` WRITE;
/*!40000 ALTER TABLE `dailies` DISABLE KEYS */;
INSERT INTO `dailies` VALUES (1,1,1,1,'10:00:00','2025-05-17'),(2,2,1,1,'09:00:00','2025-05-30'),(3,25,1,1,'09:01:00','2025-05-30');
/*!40000 ALTER TABLE `dailies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_layouts`
--

DROP TABLE IF EXISTS `dashboard_layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_layouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `layout_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dashboard_layouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dashboard_layouts_chk_1` CHECK (json_valid(`layout_json`))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_layouts`
--

LOCK TABLES `dashboard_layouts` WRITE;
/*!40000 ALTER TABLE `dashboard_layouts` DISABLE KEYS */;
INSERT INTO `dashboard_layouts` VALUES (1,1,'{\"panels\":{\"dailies\":{\"x\":0,\"y\":0,\"w\":1,\"h\":1},\"goals\":{\"x\":0,\"y\":1,\"w\":1,\"h\":1},\"challenges\":{\"x\":1,\"y\":1,\"w\":1,\"h\":1},\"shop\":{\"x\":1,\"y\":0,\"w\":1,\"h\":1},\"habitus\":{\"x\":2,\"y\":0,\"w\":1,\"h\":2}}}');
/*!40000 ALTER TABLE `dashboard_layouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goals`
--

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `deadline` date DEFAULT NULL,
  `use_subtasks` tinyint(1) DEFAULT '1',
  `progress` int DEFAULT '0',
  `total_steps` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goals`
--

LOCK TABLES `goals` WRITE;
/*!40000 ALTER TABLE `goals` DISABLE KEYS */;
INSERT INTO `goals` VALUES (8,17,'2025-05-31',1,0,1),(9,20,'2025-05-23',1,0,1),(10,22,'2025-05-23',1,0,1),(11,23,'2025-05-25',1,0,1),(12,26,'2025-05-24',1,0,1);
/*!40000 ALTER TABLE `goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_categories`
--

DROP TABLE IF EXISTS `item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_categories`
--

LOCK TABLES `item_categories` WRITE;
/*!40000 ALTER TABLE `item_categories` DISABLE KEYS */;
INSERT INTO `item_categories` VALUES (1,'Furniture','Items to decorate your room'),(2,'Backgrounds','Room background themes'),(3,'Decorations','Small decorative items'),(4,'Furniture','Chairs, tables, desks, and other furniture'),(5,'Decorations','Plants, lamps, paintings, and decorative items'),(6,'Floors','Floor patterns and materials'),(7,'Walls','Wall colors and patterns'),(8,'Floors','Floor patterns and materials'),(9,'Walls','Wall colors and patterns'),(10,'Floors','Floor patterns and materials'),(11,'Walls','Wall colors and patterns');
/*!40000 ALTER TABLE `item_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('update','task') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stripe_payment_method_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'card, apple_pay, google_pay, etc.',
  `card_brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'visa, mastercard, amex, etc.',
  `card_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_exp_month` int DEFAULT NULL,
  `card_exp_year` int DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payment_method` (`stripe_payment_method_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `placed_items`
--

DROP TABLE IF EXISTS `placed_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `placed_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `inventory_id` int NOT NULL,
  `surface` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'floor' COMMENT 'Surface where item is placed: floor, wall-left, or wall-right',
  `grid_x` int NOT NULL DEFAULT '0',
  `grid_y` int NOT NULL DEFAULT '0',
  `rotation` int DEFAULT '0',
  `z_index` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `idx_placed_items_surface` (`surface`),
  CONSTRAINT `placed_items_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `placed_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `user_inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `placed_items`
--

LOCK TABLES `placed_items` WRITE;
/*!40000 ALTER TABLE `placed_items` DISABLE KEYS */;
INSERT INTO `placed_items` VALUES (14,1,15,'floor',3,4,180,2,'2025-05-30 21:44:10');
/*!40000 ALTER TABLE `placed_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `stripe_refund_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL COMMENT 'Amount in cents',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refunded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_refund` (`stripe_refund_id`),
  KEY `user_id` (`user_id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#FFD700',
  `wall_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#E0E0E0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,1,'My First Room','#FFD700','#E0E0E0','2025-05-25 08:21:40','2025-05-25 08:21:40');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_items`
--

DROP TABLE IF EXISTS `shop_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rotation_variants` json DEFAULT NULL COMMENT 'JSON array of available rotation image paths',
  `price` int NOT NULL,
  `rarity` enum('common','uncommon','rare','epic','legendary') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'common',
  `grid_width` int DEFAULT '1',
  `grid_height` int DEFAULT '1',
  `allowed_surfaces` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'floor' COMMENT 'Comma-separated list of allowed surfaces for this item',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_grid_size` (`grid_width`,`grid_height`),
  CONSTRAINT `shop_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`),
  CONSTRAINT `chk_grid_size` CHECK (((`grid_width` > 0) and (`grid_height` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_items`
--

LOCK TABLES `shop_items` WRITE;
/*!40000 ALTER TABLE `shop_items` DISABLE KEYS */;
INSERT INTO `shop_items` VALUES (1,1,'Wooden Chair','A comfortable wooden chair','images/items/furniture/wooden_chair.webp','[\"images/items/furniture/wooden_chair-back-right.webp\", \"images/items/furniture/wooden_chair-back-left.webp\", \"images/items/furniture/wooden_chair-front-left.webp\", \"images/items/furniture/wooden_chair-front-right.webp\"]',50,'common',1,1,'floor',1,1,'2025-05-24 20:35:09'),(2,1,'Simple Table','A basic wooden table','images/items/furniture/simple_table.webp','[\"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\", \"images/items/furniture/simple_table-horizontal.webp\", \"images/items/furniture/simple_table-vertical.webp\"]',100,'common',2,2,'floor',1,1,'2025-05-24 20:35:09'),(3,1,'Bookshelf','Store your favorite books','images/items/furniture/bookshelf.webp','[\"images/items/furniture/bookshelf-back-right.webp\", \"images/items/furniture/bookshelf-back-left.webp\", \"images/items/furniture/bookshelf-front-left.webp\", \"images/items/furniture/bookshelf-front-right.webp\"]',150,'common',1,2,'floor',0,1,'2025-05-24 20:35:09'),(4,1,'Cozy Sofa','A comfortable sofa for relaxing','images/items/furniture/cozy_sofa.webp','[\"images/items/furniture/cozy_sofa-back-right.webp\", \"images/items/furniture/cozy_sofa-back-left.webp\", \"images/items/furniture/cozy_sofa-front-left.webp\", \"images/items/furniture/cozy_sofa-front-right.webp\"]',300,'uncommon',3,2,'floor',1,1,'2025-05-24 20:35:09'),(5,3,'Potted Plant','Brings life to your room','images/items/decorations/potted_plant.webp',NULL,30,'common',1,1,'floor',1,1,'2025-05-24 20:35:09'),(6,3,'Floor Lamp','Ambient lighting','images/items/decorations/floor_lamp.webp',NULL,120,'uncommon',1,1,'floor',1,1,'2025-05-24 20:35:09'),(7,3,'Picture Frame','Display your memories','images/items/decorations/picture_frame.webp','[\"images/items/decorations/picture_frame-right.webp\", \"images/items/decorations/picture_frame-left.webp\", \"images/items/decorations/picture_frame-front-left.webp\", \"images/items/decorations/picture_frame-front-right.webp\"]',40,'common',1,1,'wall-left,wall-right',0,1,'2025-05-24 20:35:09'),(8,3,'Cactus','Low maintenance plant','images/items/decorations/cactus.webp',NULL,25,'common',1,1,'floor',0,1,'2025-05-24 20:35:09'),(9,3,'Wall Clock','Keep track of time','images/items/decorations/wall_clock.webp','[\"images/items/decorations/wall_clock-right.webp\", \"images/items/decorations/wall_clock-left.webp\", \"images/items/decorations/picture_frame-front-left.webp\", \"images/items/decorations/picture_frame-front-right.webp\"]',80,'common',1,1,'wall-left,wall-right',0,1,'2025-05-24 20:36:26'),(96,3,'Wall Mirror','Reflects light and makes room feel bigger','images/items/decorations/wall_mirror.webp',NULL,60,'common',1,1,'wall-left,wall-right',0,1,'2025-05-29 17:04:03'),(97,3,'Wall Shelf','Small shelf for decorative items','images/items/decorations/wall_shelf.webp',NULL,45,'common',2,1,'wall-left,wall-right',0,1,'2025-05-29 17:04:03'),(98,3,'Painting','Beautiful landscape painting','images/items/decorations/painting.webp',NULL,90,'uncommon',2,1,'wall-left,wall-right',0,1,'2025-05-29 17:04:03');
/*!40000 ALTER TABLE `shop_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stripe_events`
--

DROP TABLE IF EXISTS `stripe_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stripe_event_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event` (`stripe_event_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stripe_events`
--

LOCK TABLES `stripe_events` WRITE;
/*!40000 ALTER TABLE `stripe_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `stripe_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `plan_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('subscribe','cancel','upgrade','downgrade') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_invoice_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_payment_intent` (`payment_intent_id`),
  CONSTRAINT `subscription_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_history`
--

LOCK TABLES `subscription_history` WRITE;
/*!40000 ALTER TABLE `subscription_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_invoices`
--

DROP TABLE IF EXISTS `subscription_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stripe_invoice_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_subscription_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_paid` int NOT NULL COMMENT 'Amount in cents',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'eur',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_pdf` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invoice` (`stripe_invoice_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_subscription` (`stripe_subscription_id`),
  CONSTRAINT `subscription_invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_invoices`
--

LOCK TABLES `subscription_invoices` WRITE;
/*!40000 ALTER TABLE `subscription_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int NOT NULL,
  `benefits` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'adfree',1.00,30,'No ADs'),(2,'premium',5.00,30,'No ADs, Exclusive items and new QQLs features');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subtasks`
--

DROP TABLE IF EXISTS `subtasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subtasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_task_id` int NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_completed` tinyint(1) DEFAULT '0',
  `order_position` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_task_id` (`parent_task_id`),
  CONSTRAINT `subtasks_ibfk_1` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subtasks`
--

LOCK TABLES `subtasks` WRITE;
/*!40000 ALTER TABLE `subtasks` DISABLE KEYS */;
INSERT INTO `subtasks` VALUES (4,16,'gfdgd','gdfgdf',1,0,'2025-05-20 21:09:22'),(5,16,'gfdg','gfdgfd',1,1,'2025-05-20 21:09:24'),(6,21,'dddd','ddddd',1,0,'2025-05-20 21:19:47'),(7,21,'dddd','dddd',1,1,'2025-05-20 21:19:49'),(8,24,'fdsf','fdsfs',0,0,'2025-05-21 20:47:44'),(10,27,'dsad','dsadads',0,1,'2025-05-21 21:08:36');
/*!40000 ALTER TABLE `subtasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_types`
--

DROP TABLE IF EXISTS `task_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hcoin_multiplier` float DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_types`
--

LOCK TABLES `task_types` WRITE;
/*!40000 ALTER TABLE `task_types` DISABLE KEYS */;
INSERT INTO `task_types` VALUES (1,'Daily','Tasks that reset every day',1),(2,'Goal','Long-term objectives with multiple steps',1.5),(3,'Challenge','Time-limited special tasks with higher rewards',2);
/*!40000 ALTER TABLE `task_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type_id` int NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `difficulty` enum('easy','medium','hard','expert') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `duration` int DEFAULT NULL,
  `hcoin_reward` int NOT NULL,
  `is_custom` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `duration_backup` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `task_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,1,'Halloo Claude','Halloo Claude','easy',1,10,1,'2025-05-17 16:38:48',1),(2,1,1,'Hola 2','','easy',1,10,1,'2025-05-17 21:48:47',1),(16,1,3,'gfgdg','gdfgd','hard',NULL,70,1,'2025-05-20 21:09:14',15),(17,1,2,'Yooo','hi','medium',NULL,30,1,'2025-05-20 21:18:31',15),(20,1,2,'hhhhhhhhhhh','hhhhhhhhhhh','medium',NULL,30,1,'2025-05-20 21:19:15',15),(21,1,3,'ddddd','dddd','medium',NULL,40,1,'2025-05-20 21:19:36',15),(22,1,2,'Hi Claude','Hi Claude','hard',NULL,53,1,'2025-05-20 21:28:16',15),(23,1,2,'vvvv','vvvvvv','hard',NULL,53,1,'2025-05-21 20:44:51',15),(24,1,3,'fdsfs','fdsfsd','expert',NULL,100,1,'2025-05-21 20:47:33',15),(25,1,1,'fsdds','fdsfsdf','medium',15,20,1,'2025-05-21 20:48:05',15),(26,1,2,'fdfds','fdsfsdfsdsf','medium',NULL,30,1,'2025-05-21 20:58:34',15),(27,1,3,'fdfdf','fdfdfd','hard',NULL,70,1,'2025-05-21 21:08:20',NULL),(28,1,3,'fdfddfd','fdfddf','medium',NULL,40,1,'2025-05-21 21:13:05',NULL),(29,1,3,'dsada','dsadssasdsda','hard',NULL,70,1,'2025-05-21 21:16:33',NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` int NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `transaction_type` enum('earn','spend') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_charge_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'eur',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_stripe_charge` (`stripe_charge_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,10,'Completed Daily: Halloo Claude','earn',1,'task',NULL,NULL,'eur','2025-05-17 21:46:34'),(2,1,10,'Completed Daily: Hola 2','earn',2,'task',NULL,NULL,'eur','2025-05-17 22:59:06'),(3,1,23,'Completed Goal: Holaaaa','earn',6,'task',NULL,NULL,'eur','2025-05-18 15:47:34'),(4,1,140,'Completed Challenge: Halloo','earn',10,'task',NULL,NULL,'eur','2025-05-19 20:54:06'),(5,1,80,'Completed Challenge: ffffffffff','earn',15,'task',NULL,NULL,'eur','2025-05-20 21:02:16'),(6,1,140,'Completed Challenge: gfgdg','earn',16,'task',NULL,NULL,'eur','2025-05-20 21:22:00'),(7,1,80,'Completed Challenge: ddddd','earn',21,'task',NULL,NULL,'eur','2025-05-20 21:31:28'),(8,1,50,'Purchased: Wooden Chair','spend',1,'shop',NULL,NULL,'eur','2025-05-27 17:58:32'),(9,1,300,'Purchased: Cozy Sofa','spend',4,'shop',NULL,NULL,'eur','2025-05-28 17:15:17'),(10,1,100,'Purchased: Simple Table','spend',2,'shop',NULL,NULL,'eur','2025-05-28 17:15:17'),(11,1,50,'Purchased: Wooden Chair','spend',1,'shop',NULL,NULL,'eur','2025-05-28 17:15:17'),(12,1,40,'Purchased: Picture Frame','spend',7,'shop',NULL,NULL,'eur','2025-05-29 16:53:31'),(13,1,10,'Completed Daily: Hola 2','earn',2,'task',NULL,NULL,'eur','2025-05-30 18:26:54'),(14,1,300,'Purchased: Cozy Sofa','spend',4,'shop',NULL,NULL,'eur','2025-05-30 18:28:20'),(15,1,50,'Purchased: Wooden Chair','spend',1,'shop',NULL,NULL,'eur','2025-05-30 18:28:20'),(16,1,100,'Purchased: Simple Table','spend',2,'shop',NULL,NULL,'eur','2025-05-30 18:28:20'),(17,1,20,'Completed Daily: fsdds','earn',25,'task',NULL,NULL,'eur','2025-05-30 18:31:33');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `updates`
--

DROP TABLE IF EXISTS `updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `updates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `updates`
--

LOCK TABLES `updates` WRITE;
/*!40000 ALTER TABLE `updates` DISABLE KEYS */;
/*!40000 ALTER TABLE `updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_coupons`
--

DROP TABLE IF EXISTS `user_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `coupon_id` int NOT NULL,
  `stripe_discount_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_to_subscription` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redeemed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_coupon` (`user_id`,`coupon_id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupon_codes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_coupons`
--

LOCK TABLES `user_coupons` WRITE;
/*!40000 ALTER TABLE `user_coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_inventory`
--

DROP TABLE IF EXISTS `user_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `acquired_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `user_inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_inventory_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_inventory`
--

LOCK TABLES `user_inventory` WRITE;
/*!40000 ALTER TABLE `user_inventory` DISABLE KEYS */;
INSERT INTO `user_inventory` VALUES (14,1,1,3,'2025-05-27 17:58:32'),(15,1,4,2,'2025-05-28 17:15:17'),(16,1,2,2,'2025-05-28 17:15:17'),(17,1,7,1,'2025-05-29 16:53:31');
/*!40000 ALTER TABLE `user_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hcoin` int DEFAULT '0',
  `subscription_type` enum('free','adfree','premium') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `subscription_expires` datetime DEFAULT NULL,
  `theme` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'light',
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `stripe_customer_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_subscription_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_payment_intent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_failures` int DEFAULT '0',
  `last_payment_failure` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_stripe_customer` (`stripe_customer_id`),
  KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  KEY `idx_subscription_expires` (`subscription_expires`),
  KEY `idx_subscription_type` (`subscription_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Jorge','jorgecastrot2005@gmail.com','$2y$12$xo9KGsfSo2C8kLddntcOquUyme0CX3IaHX0PUiPbpiZY.Rrb.dIhO',6492,'free',NULL,'light','en','2025-05-16 18:41:14','2025-05-31 07:10:34',NULL,NULL,NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'u343618305_habitus_zone'
--

--
-- Dumping routines for database 'u343618305_habitus_zone'
--

--
-- Final view structure for view `active_subscriptions`
--

/*!50001 DROP VIEW IF EXISTS `active_subscriptions`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `active_subscriptions` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,`u`.`email` AS `email`,`u`.`subscription_type` AS `subscription_type`,`u`.`subscription_expires` AS `subscription_expires`,`u`.`stripe_customer_id` AS `stripe_customer_id`,`u`.`stripe_subscription_id` AS `stripe_subscription_id`,(case when (`u`.`subscription_expires` > now()) then 'active' when (`u`.`subscription_expires` <= now()) then 'expired' else 'free' end) AS `status` from `users` `u` where (`u`.`subscription_type` <> 'free') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31  9:29:35
