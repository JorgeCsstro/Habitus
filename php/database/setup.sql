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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
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
  `is_featured` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `shop_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_items`
--

LOCK TABLES `shop_items` WRITE;
/*!40000 ALTER TABLE `shop_items` DISABLE KEYS */;
INSERT INTO `shop_items` VALUES (1,1,'Wooden Desk','A sturdy oak desk perfect for productivity','images/shop/furniture/wooden-desk.png',150,'common',0,1,'2025-05-22 21:40:42'),(2,1,'Comfy Chair','Ergonomic chair for long work sessions','images/shop/furniture/comfy-chair.png',200,'common',1,1,'2025-05-22 21:40:42'),(4,1,'Gaming Chair','Ultimate comfort for gaming sessions','images/shop/furniture/gaming-chair.png',450,'uncommon',1,1,'2025-05-22 21:40:42'),(5,1,'Standing Desk','Adjustable height for healthy posture','images/shop/furniture/standing-desk.png',600,'rare',0,1,'2025-05-22 21:40:42'),(6,1,'Bean Bag','Casual seating for relaxation','images/shop/furniture/bean-bag.png',120,'common',0,1,'2025-05-22 21:40:42'),(7,1,'Coffee Table','Modern glass coffee table','images/shop/furniture/coffee-table.png',250,'uncommon',0,1,'2025-05-22 21:40:42'),(8,1,'Royal Throne','Sit like royalty','images/shop/furniture/royal-throne.png',2000,'legendary',1,1,'2025-05-22 21:40:42'),(10,3,'Wall Clock','Never lose track of time','images/shop/decorations/wall-clock.png',80,'common',0,1,'2025-05-22 21:40:42'),(11,3,'Motivational Poster','Stay inspired every day','images/shop/decorations/motivational-poster.png',30,'common',1,1,'2025-05-22 21:40:42'),(12,3,'Desk Lamp','Illuminate your workspace','images/shop/decorations/desk-lamp.png',100,'common',0,1,'2025-05-22 21:40:42'),(13,3,'Cat Statue','Lucky cat for good fortune','images/shop/decorations/cat-statue.png',150,'uncommon',0,1,'2025-05-22 21:40:42'),(14,3,'Crystal Ball','Mystical decoration','images/shop/decorations/crystal-ball.png',300,'rare',0,1,'2025-05-22 21:40:42'),(15,3,'Trophy Collection','Display your achievements','images/shop/decorations/trophy-collection.png',500,'epic',1,1,'2025-05-22 21:40:42'),(16,3,'Aquarium','Relaxing fish tank','images/shop/decorations/aquarium.png',400,'rare',0,1,'2025-05-22 21:40:42'),(17,3,'Neon Sign','Custom neon lighting','images/shop/decorations/neon-sign.png',350,'uncommon',0,1,'2025-05-22 21:40:42'),(18,3,'Golden Statue','Prestigious golden decoration','images/shop/decorations/golden-statue.png',1500,'legendary',0,1,'2025-05-22 21:40:42'),(19,2,'Cozy Room','Warm and inviting atmosphere','images/shop/backgrounds/cozy-room.png',300,'common',0,1,'2025-05-22 21:40:42'),(20,2,'Modern Office','Sleek and professional','images/shop/backgrounds/modern-office.png',400,'uncommon',1,1,'2025-05-22 21:40:42'),(21,2,'Beach View','Work with an ocean view','images/shop/backgrounds/beach-view.png',600,'rare',0,1,'2025-05-22 21:40:42'),(22,2,'Mountain Cabin','Rustic mountain retreat','images/shop/backgrounds/mountain-cabin.png',500,'uncommon',0,1,'2025-05-22 21:40:42'),(23,2,'Space Station','Futuristic workspace','images/shop/backgrounds/space-station.png',1000,'epic',0,1,'2025-05-22 21:40:42'),(24,2,'Zen Garden','Peaceful Japanese garden','images/shop/backgrounds/zen-garden.png',800,'rare',1,1,'2025-05-22 21:40:42'),(25,2,'Castle Chamber','Medieval castle room','images/shop/backgrounds/castle-chamber.png',1200,'epic',0,1,'2025-05-22 21:40:42'),(26,2,'Penthouse Suite','Luxury city view','images/shop/backgrounds/penthouse-suite.png',3000,'legendary',0,1,'2025-05-22 21:40:42'),(27,3,'Friendly Cat','A purring companion','images/shop/pets/cat.png',250,'common',1,1,'2025-05-22 21:40:42'),(28,3,'Loyal Dog','Man\'s best friend','images/shop/pets/dog.png',300,'common',0,1,'2025-05-22 21:40:42'),(29,3,'Wise Owl','Night-time companion','images/shop/pets/owl.png',400,'uncommon',0,1,'2025-05-22 21:40:42'),(30,3,'Baby Dragon','Mythical pet','images/shop/pets/dragon.png',2500,'legendary',1,1,'2025-05-22 21:40:42'),(41,1,'Wooden Chair','A comfortable wooden chair','images/items/furniture/wooden_chair.webp',50,'common',1,1,'2025-05-24 20:35:09'),(42,1,'Simple Table','A basic wooden table','images/items/furniture/simple_table.webp',100,'common',1,1,'2025-05-24 20:35:09'),(43,1,'Bookshelf','Store your favorite books','images/items/furniture/bookshelf.webp',150,'common',0,1,'2025-05-24 20:35:09'),(44,1,'Cozy Sofa','A comfortable sofa for relaxing','images/items/furniture/cozy_sofa.webp',300,'uncommon',1,1,'2025-05-24 20:35:09'),(45,1,'Study Desk','Perfect for productivity','images/items/furniture/study_desk.webp',200,'uncommon',0,1,'2025-05-24 20:35:09'),(46,1,'Gaming Chair','Ergonomic gaming chair','images/items/furniture/gaming_chair.webp',250,'uncommon',1,1,'2025-05-24 20:35:09'),(47,1,'Coffee Table','Low wooden coffee table','images/items/furniture/coffee_table.webp',120,'common',0,1,'2025-05-24 20:35:09'),(48,1,'Wardrobe','Spacious wardrobe','images/items/furniture/wardrobe.webp',350,'uncommon',0,1,'2025-05-24 20:35:09'),(49,3,'Potted Plant','Brings life to your room','images/items/decorations/potted_plant.webp',30,'common',1,1,'2025-05-24 20:35:09'),(50,3,'Wall Clock','Keep track of time','images/items/decorations/wall_clock.webp',80,'common',0,1,'2025-05-24 20:35:09'),(51,3,'Floor Lamp','Ambient lighting','images/items/decorations/floor_lamp.webp',120,'uncommon',1,1,'2025-05-24 20:35:09'),(52,3,'Picture Frame','Display your memories','images/items/decorations/picture_frame.webp',40,'common',0,1,'2025-05-24 20:35:09'),(53,3,'Rug','Comfortable floor covering','images/items/decorations/rug.webp',150,'uncommon',1,1,'2025-05-24 20:35:09'),(54,3,'Cactus','Low maintenance plant','images/items/decorations/cactus.webp',25,'common',0,1,'2025-05-24 20:35:09'),(55,3,'Motivational Poster','Stay motivated!','images/items/decorations/poster.webp',35,'common',1,1,'2025-05-24 20:35:09'),(56,3,'Aquarium','Small fish tank','images/items/decorations/aquarium.webp',200,'uncommon',0,1,'2025-05-24 20:35:09'),(57,6,'Wooden Floor','Classic wooden pattern','images/items/floors/wooden_floor.webp',500,'common',0,1,'2025-05-24 20:35:09'),(58,6,'Marble Floor','Elegant marble tiles','images/items/floors/marble_floor.webp',800,'uncommon',0,1,'2025-05-24 20:35:09'),(59,6,'Carpet Floor','Soft carpet flooring','images/items/floors/carpet_floor.webp',400,'common',0,1,'2025-05-24 20:35:09'),(60,7,'White Paint','Clean white walls','images/items/walls/white_paint.webp',200,'common',0,1,'2025-05-24 20:35:09'),(61,7,'Blue Paint','Calming blue walls','images/items/walls/blue_paint.webp',250,'common',0,1,'2025-05-24 20:35:09'),(62,7,'Brick Wall','Industrial brick pattern','images/items/walls/brick_wall.webp',600,'uncommon',0,1,'2025-05-24 20:35:09'),(63,1,'Wooden Chair','A comfortable wooden chair','images/items/furniture/wooden_chair.webp',50,'common',1,1,'2025-05-24 20:36:26'),(64,1,'Simple Table','A basic wooden table','images/items/furniture/simple_table.webp',100,'common',1,1,'2025-05-24 20:36:26'),(65,1,'Bookshelf','Store your favorite books','images/items/furniture/bookshelf.webp',150,'common',0,1,'2025-05-24 20:36:26'),(66,1,'Cozy Sofa','A comfortable sofa for relaxing','images/items/furniture/cozy_sofa.webp',300,'uncommon',1,1,'2025-05-24 20:36:26'),(67,1,'Study Desk','Perfect for productivity','images/items/furniture/study_desk.webp',200,'uncommon',0,1,'2025-05-24 20:36:26'),(68,1,'Gaming Chair','Ergonomic gaming chair','images/items/furniture/gaming_chair.webp',250,'uncommon',1,1,'2025-05-24 20:36:26'),(69,1,'Coffee Table','Low wooden coffee table','images/items/furniture/coffee_table.webp',120,'common',0,1,'2025-05-24 20:36:26'),(70,1,'Wardrobe','Spacious wardrobe','images/items/furniture/wardrobe.webp',350,'uncommon',0,1,'2025-05-24 20:36:26'),(71,3,'Potted Plant','Brings life to your room','images/items/decorations/potted_plant.webp',30,'common',1,1,'2025-05-24 20:36:26'),(72,3,'Wall Clock','Keep track of time','images/items/decorations/wall_clock.webp',80,'common',0,1,'2025-05-24 20:36:26'),(73,3,'Floor Lamp','Ambient lighting','images/items/decorations/floor_lamp.webp',120,'uncommon',1,1,'2025-05-24 20:36:26'),(74,3,'Picture Frame','Display your memories','images/items/decorations/picture_frame.webp',40,'common',0,1,'2025-05-24 20:36:26'),(75,3,'Rug','Comfortable floor covering','images/items/decorations/rug.webp',150,'uncommon',1,1,'2025-05-24 20:36:26'),(76,3,'Cactus','Low maintenance plant','images/items/decorations/cactus.webp',25,'common',0,1,'2025-05-24 20:36:26'),(77,3,'Motivational Poster','Stay motivated!','images/items/decorations/poster.webp',35,'common',1,1,'2025-05-24 20:36:26'),(78,3,'Aquarium','Small fish tank','images/items/decorations/aquarium.webp',200,'uncommon',0,1,'2025-05-24 20:36:26'),(79,6,'Wooden Floor','Classic wooden pattern','images/items/floors/wooden_floor.webp',500,'common',0,1,'2025-05-24 20:36:26'),(80,6,'Marble Floor','Elegant marble tiles','images/items/floors/marble_floor.webp',800,'uncommon',0,1,'2025-05-24 20:36:26'),(81,6,'Carpet Floor','Soft carpet flooring','images/items/floors/carpet_floor.webp',400,'common',0,1,'2025-05-24 20:36:26'),(82,7,'White Paint','Clean white walls','images/items/walls/white_paint.webp',200,'common',0,1,'2025-05-24 20:36:26'),(83,7,'Blue Paint','Calming blue walls','images/items/walls/blue_paint.webp',250,'common',0,1,'2025-05-24 20:36:26'),(84,7,'Brick Wall','Industrial brick pattern','images/items/walls/brick_wall.webp',600,'uncommon',0,1,'2025-05-24 20:36:26'),(85,1,'Wooden Chair','A comfortable wooden chair','images/items/furniture/wooden_chair.webp',50,'common',1,1,'2025-05-24 20:41:56'),(86,1,'Simple Table','A basic wooden table','images/items/furniture/simple_table.webp',100,'common',1,1,'2025-05-24 20:41:56'),(87,1,'Bookshelf','Store your favorite books','images/items/furniture/bookshelf.webp',150,'common',0,1,'2025-05-24 20:41:56'),(88,1,'Cozy Sofa','A comfortable sofa for relaxing','images/items/furniture/cozy_sofa.webp',300,'uncommon',1,1,'2025-05-24 20:41:56'),(89,1,'Study Desk','Perfect for productivity','images/items/furniture/study_desk.webp',200,'uncommon',0,1,'2025-05-24 20:41:56'),(90,3,'Potted Plant','Brings life to your room','images/items/decorations/potted_plant.webp',30,'common',1,1,'2025-05-24 20:41:56'),(91,3,'Wall Clock','Keep track of time','images/items/decorations/wall_clock.webp',80,'common',0,1,'2025-05-24 20:41:56'),(92,3,'Floor Lamp','Ambient lighting','images/items/decorations/floor_lamp.webp',120,'uncommon',1,1,'2025-05-24 20:41:56'),(93,3,'Picture Frame','Display your memories','images/items/decorations/picture_frame.webp',40,'common',0,1,'2025-05-24 20:41:56'),(94,3,'Rug','Comfortable floor covering','images/items/decorations/rug.webp',150,'uncommon',1,1,'2025-05-24 20:41:56');
/*!40000 ALTER TABLE `shop_items` ENABLE KEYS */;
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
  `hcoin_bonus` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
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
INSERT INTO `user_inventory` VALUES (1,1,41,1,'2025-05-24 20:35:09'),(2,1,49,1,'2025-05-24 20:35:09'),(4,1,63,1,'2025-05-24 20:36:26'),(5,1,71,1,'2025-05-24 20:36:26'),(7,1,41,1,'2025-05-24 20:41:56'),(8,1,49,1,'2025-05-24 20:41:56'),(9,1,63,1,'2025-05-24 20:41:56'),(10,1,71,1,'2025-05-24 20:41:56'),(11,1,85,1,'2025-05-24 20:41:56'),(12,1,90,1,'2025-05-24 20:41:56');
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
  `subscription_type` enum('free','premium','pro') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
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
INSERT INTO `users` VALUES (1,'Jorge','jorgecastrot2005@gmail.com','$2y$12$xo9KGsfSo2C8kLddntcOquUyme0CX3IaHX0PUiPbpiZY.Rrb.dIhO',7452,'free',NULL,'light','en','2025-05-16 18:41:14','2025-05-24 09:04:28');
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

-- Dump completed on 2025-05-24 22:52:19
