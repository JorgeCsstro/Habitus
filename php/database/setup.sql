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
INSERT INTO `dailies` VALUES (1,1,1,1,'10:00:00','2025-05-17'),(2,2,1,1,'09:00:00','2025-05-17'),(3,25,0,0,'09:01:00',NULL);
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
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
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
  `type` enum('update','task') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
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
-- Table structure for table `placed_items`
--

DROP TABLE IF EXISTS `placed_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `placed_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `inventory_id` int NOT NULL,
  `grid_x` int NOT NULL DEFAULT '0',
  `grid_y` int NOT NULL DEFAULT '0',
  `rotation` int DEFAULT '0',
  `z_index` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `placed_items_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `placed_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `user_inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `placed_items`
--

LOCK TABLES `placed_items` WRITE;
/*!40000 ALTER TABLE `placed_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `placed_items` ENABLE KEYS */;
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
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int NOT NULL,
  `rarity` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci DEFAULT 'common',
  `grid_width` int DEFAULT '1',
  `grid_height` int DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_grid_size` (`grid_width`,`grid_height`),
  CONSTRAINT `shop_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`),
  CONSTRAINT `chk_grid_size` CHECK (((`grid_width` > 0) and (`grid_height` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_items`
--

LOCK TABLES `shop_items` WRITE;
/*!40000 ALTER TABLE `shop_items` DISABLE KEYS */;
INSERT INTO `shop_items` VALUES (1,1,'Wooden Chair','A comfortable wooden chair','images/items/furniture/wooden_chair.webp',50,'common',1,1,1,1,'2025-05-24 20:35:09'),(2,1,'Simple Table','A basic wooden table','images/items/furniture/simple_table.webp',100,'common',2,2,1,1,'2025-05-24 20:35:09'),(3,1,'Bookshelf','Store your favorite books','images/items/furniture/bookshelf.webp',150,'common',1,2,0,1,'2025-05-24 20:35:09'),(4,1,'Cozy Sofa','A comfortable sofa for relaxing','images/items/furniture/cozy_sofa.webp',300,'uncommon',3,2,1,1,'2025-05-24 20:35:09'),(5,3,'Potted Plant','Brings life to your room','images/items/decorations/potted_plant.webp',30,'common',1,1,1,1,'2025-05-24 20:35:09'),(6,3,'Floor Lamp','Ambient lighting','images/items/decorations/floor_lamp.webp',120,'uncommon',1,1,1,1,'2025-05-24 20:35:09'),(7,3,'Picture Frame','Display your memories','images/items/decorations/picture_frame.webp',40,'common',1,1,0,1,'2025-05-24 20:35:09'),(8,3,'Cactus','Low maintenance plant','images/items/decorations/cactus.webp',25,'common',1,1,0,1,'2025-05-24 20:35:09'),(9,3,'Wall Clock','Keep track of time','images/items/decorations/wall_clock.webp',80,'common',1,1,0,1,'2025-05-24 20:36:26');
/*!40000 ALTER TABLE `shop_items` ENABLE KEYS */;
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
  `plan_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('subscribe','cancel','upgrade','downgrade') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
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
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` int NOT NULL,
  `benefits` text COLLATE utf8mb4_unicode_ci,
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
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
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
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
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
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `difficulty` enum('easy','medium','hard','expert') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
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
  `description` text COLLATE utf8mb4_unicode_ci,
  `transaction_type` enum('earn','spend') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,10,'Completed Daily: Halloo Claude','earn',1,'task','2025-05-17 21:46:34'),(2,1,10,'Completed Daily: Hola 2','earn',2,'task','2025-05-17 22:59:06'),(3,1,23,'Completed Goal: Holaaaa','earn',6,'task','2025-05-18 15:47:34'),(4,1,140,'Completed Challenge: Halloo','earn',10,'task','2025-05-19 20:54:06'),(5,1,80,'Completed Challenge: ffffffffff','earn',15,'task','2025-05-20 21:02:16'),(6,1,140,'Completed Challenge: gfgdg','earn',16,'task','2025-05-20 21:22:00'),(7,1,80,'Completed Challenge: ddddd','earn',21,'task','2025-05-20 21:31:28');
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
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_inventory`
--

LOCK TABLES `user_inventory` WRITE;
/*!40000 ALTER TABLE `user_inventory` DISABLE KEYS */;
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
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hcoin` int DEFAULT '0',
  `subscription_type` enum('free','adfree','premium') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `subscription_expires` datetime DEFAULT NULL,
  `theme` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'light',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Jorge','jorgecastrot2005@gmail.com','$2y$12$xo9KGsfSo2C8kLddntcOquUyme0CX3IaHX0PUiPbpiZY.Rrb.dIhO',7452,'free',NULL,'light','en','2025-05-16 18:41:14','2025-05-25 07:58:35');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'u343618305_habitus_zone'
--

--
-- Dumping routines for database 'u343618305_habitus_zone'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-26 20:32:05
