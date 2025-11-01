-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: antigaspi_fresh
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `analytics_daily`
--

DROP TABLE IF EXISTS `analytics_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analytics_daily` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `merchant_id` bigint(20) unsigned DEFAULT NULL,
  `total_reservations` int(10) unsigned NOT NULL DEFAULT 0,
  `total_revenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `products_saved_from_waste` int(10) unsigned NOT NULL DEFAULT 0,
  `new_users` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `analytics_daily_date_merchant_id_unique` (`date`,`merchant_id`),
  KEY `analytics_daily_merchant_id_foreign` (`merchant_id`),
  CONSTRAINT `analytics_daily_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_daily`
--

LOCK TABLES `analytics_daily` WRITE;
/*!40000 ALTER TABLE `analytics_daily` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_daily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-5210a5ff37c1adf5db1b3c6d03bff28b','i:1;',1761853250),('laravel-cache-5210a5ff37c1adf5db1b3c6d03bff28b:timer','i:1761853250;',1761853250),('laravel-cache-a75f3f172bfb296f2e10cbfc6dfc1883','i:4;',1761907424),('laravel-cache-a75f3f172bfb296f2e10cbfc6dfc1883:timer','i:1761907424;',1761907424),('laravel-cache-b05f0172f751480edfc9251bfd6cf08b','i:1;',1761853175),('laravel-cache-b05f0172f751480edfc9251bfd6cf08b:timer','i:1761853175;',1761853175),('laravel-cache-categories.active','O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:9:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:1;s:4:\"name\";s:11:\"Boulangerie\";s:11:\"description\";s:36:\"Pains, viennoiseries et pâtisseries\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:1;s:4:\"name\";s:11:\"Boulangerie\";s:11:\"description\";s:36:\"Pains, viennoiseries et pâtisseries\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:2;s:4:\"name\";s:18:\"Fruits et Légumes\";s:11:\"description\";s:24:\"Produits frais de saison\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:2;s:4:\"name\";s:18:\"Fruits et Légumes\";s:11:\"description\";s:24:\"Produits frais de saison\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:3;s:4:\"name\";s:17:\"Produits Laitiers\";s:11:\"description\";s:23:\"Lait, yaourts, fromages\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:3;s:4:\"name\";s:17:\"Produits Laitiers\";s:11:\"description\";s:23:\"Lait, yaourts, fromages\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:4;s:4:\"name\";s:9:\"Épicerie\";s:11:\"description\";s:26:\"Produits secs et conserves\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:4;s:4:\"name\";s:9:\"Épicerie\";s:11:\"description\";s:26:\"Produits secs et conserves\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:4;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:5;s:4:\"name\";s:17:\"Viande et Poisson\";s:11:\"description\";s:33:\"Produits carnés et fruits de mer\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:5;s:4:\"name\";s:17:\"Viande et Poisson\";s:11:\"description\";s:33:\"Produits carnés et fruits de mer\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:5;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:6;s:4:\"name\";s:8:\"Boissons\";s:11:\"description\";s:27:\"Boissons chaudes et froides\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:6;s:4:\"name\";s:8:\"Boissons\";s:11:\"description\";s:27:\"Boissons chaudes et froides\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:6;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:7;s:4:\"name\";s:11:\"Pâtisserie\";s:11:\"description\";s:20:\"Gâteaux et desserts\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:7;s:4:\"name\";s:11:\"Pâtisserie\";s:11:\"description\";s:20:\"Gâteaux et desserts\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:7;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:8;s:4:\"name\";s:8:\"Traiteur\";s:11:\"description\";s:25:\"Plats préparés et repas\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:8;s:4:\"name\";s:8:\"Traiteur\";s:11:\"description\";s:25:\"Plats préparés et repas\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:8;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:3:{s:2:\"id\";i:9;s:4:\"name\";s:5:\"Autre\";s:11:\"description\";s:28:\"Autres produits alimentaires\";}s:11:\"\0*\0original\";a:3:{s:2:\"id\";i:9;s:4:\"name\";s:5:\"Autre\";s:11:\"description\";s:28:\"Autres produits alimentaires\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:1:{s:9:\"is_active\";s:7:\"boolean\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:4:\"name\";i:1;s:11:\"description\";i:2;s:4:\"icon\";i:3;s:9:\"is_active\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}',1761910373),('laravel-cache-e45444ecc678a271a6330f468a373360','i:2;',1761906828),('laravel-cache-e45444ecc678a271a6330f468a373360:timer','i:1761906828;',1761906828);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cart_items_cart_id_index` (`cart_id`),
  KEY `cart_items_product_id_index` (`product_id`),
  CONSTRAINT `cart_items_cart_id_foreign` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `merchant_id` bigint(20) unsigned DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `carts_user_id_index` (`user_id`),
  KEY `carts_merchant_id_index` (`merchant_id`),
  CONSTRAINT `carts_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `carts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Boulangerie','Pains, viennoiseries et pâtisseries','🥖',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(2,'Fruits et Légumes','Produits frais de saison','🍎',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(3,'Produits Laitiers','Lait, yaourts, fromages','🧀',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(4,'Épicerie','Produits secs et conserves','🛒',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(5,'Viande et Poisson','Produits carnés et fruits de mer','🥩',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(6,'Boissons','Boissons chaudes et froides','☕',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(7,'Pâtisserie','Gâteaux et desserts','🍰',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(8,'Traiteur','Plats préparés et repas','🍱',1,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(9,'Autre','Autres produits alimentaires','📦',1,'2025-10-29 11:01:17','2025-10-29 11:01:17');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `consumer_id` bigint(20) unsigned NOT NULL,
  `merchant_id` bigint(20) unsigned NOT NULL,
  `archived_by_consumer` tinyint(1) NOT NULL DEFAULT 0,
  `archived_by_merchant` tinyint(1) NOT NULL DEFAULT 0,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `last_message_preview` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversations_consumer_id_merchant_id_unique` (`consumer_id`,`merchant_id`),
  KEY `conversations_merchant_id_foreign` (`merchant_id`),
  KEY `conversations_last_message_at_index` (`last_message_at`),
  CONSTRAINT `conversations_consumer_id_foreign` FOREIGN KEY (`consumer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorites` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_id_product_id_unique` (`user_id`,`product_id`),
  KEY `favorites_user_id_index` (`user_id`),
  KEY `favorites_product_id_index` (`product_id`),
  KEY `favorites_created_at_index` (`created_at`),
  KEY `favorites_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `favorites_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,3,2,'2025-10-30 19:38:35','2025-10-30 19:38:35');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_movements`
--

DROP TABLE IF EXISTS `inventory_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_movements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `merchant_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `movement_type` varchar(255) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_after` int(10) unsigned NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_movements_product_id_foreign` (`product_id`),
  KEY `inventory_movements_merchant_id_foreign` (`merchant_id`),
  KEY `inventory_movements_user_id_foreign` (`user_id`),
  CONSTRAINT `inventory_movements_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_movements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_movements`
--

LOCK TABLES `inventory_movements` WRITE;
/*!40000 ALTER TABLE `inventory_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_points`
--

DROP TABLE IF EXISTS `loyalty_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loyalty_points` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `points` int(11) NOT NULL,
  `earned_from` enum('reservation','review','referral','bonus','redemption') NOT NULL,
  `reference_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loyalty_points_user_id_earned_from_index` (`user_id`,`earned_from`),
  KEY `loyalty_points_expires_at_index` (`expires_at`),
  KEY `loyalty_points_user_id_index` (`user_id`),
  KEY `loyalty_points_earned_from_index` (`earned_from`),
  KEY `loyalty_points_user_expires_index` (`user_id`,`expires_at`),
  KEY `loyalty_points_created_at_index` (`created_at`),
  CONSTRAINT `loyalty_points_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_points`
--

LOCK TABLES `loyalty_points` WRITE;
/*!40000 ALTER TABLE `loyalty_points` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchants`
--

DROP TABLE IF EXISTS `merchants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `merchants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `business_type` varchar(255) DEFAULT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `siret` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `opening_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`opening_hours`)),
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_date` timestamp NULL DEFAULT NULL,
  `total_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchants_user_id_unique` (`user_id`),
  UNIQUE KEY `merchants_siret_unique` (`siret`),
  KEY `merchants_user_id_index` (`user_id`),
  KEY `merchants_location_index` (`latitude`,`longitude`),
  KEY `merchants_category_id_foreign` (`category_id`),
  CONSTRAINT `merchants_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `merchants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchants`
--

LOCK TABLES `merchants` WRITE;
/*!40000 ALTER TABLE `merchants` DISABLE KEYS */;
INSERT INTO `merchants` VALUES (1,2,'Boulangerie du Centre','bakery',NULL,NULL,NULL,'12345678901234',45.7640430,4.8356590,'{\"monday\":[\"07:30\",\"19:00\"],\"tuesday\":[\"07:30\",\"19:00\"],\"wednesday\":[\"07:30\",\"19:00\"],\"thursday\":[\"07:30\",\"19:00\"],\"friday\":[\"07:30\",\"19:00\"],\"saturday\":[\"08:00\",\"18:00\"]}',1,'2025-10-19 11:01:16',15000.00,'2025-10-29 11:01:16','2025-10-29 11:01:16');
/*!40000 ALTER TABLE `merchants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint(20) unsigned NOT NULL,
  `sender_id` bigint(20) unsigned NOT NULL,
  `content` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_foreign` (`sender_id`),
  KEY `messages_conversation_id_created_at_index` (`conversation_id`,`created_at`),
  KEY `messages_read_at_index` (`read_at`),
  CONSTRAINT `messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2025_09_10_100050_create_categories_table',1),(5,'2025_09_10_100100_create_merchants_table',1),(6,'2025_09_10_100200_create_products_table',1),(7,'2025_09_10_100400_create_loyalty_points_table',1),(8,'2025_09_14_204420_modify_products_image_url_column',1),(9,'2025_09_16_122241_create_reviews_table',1),(10,'2025_09_16_125931_add_approval_columns_to_reviews_table',1),(11,'2025_09_17_175121_create_refresh_tokens_table',1),(12,'2025_09_17_175702_add_status_column_to_users_table',1),(13,'2025_09_17_180733_add_merchant_response_to_reviews_table',1),(14,'2025_09_17_181648_create_review_reports_table',1),(15,'2025_09_18_163158_add_redemption_to_loyalty_points_earned_from',1),(16,'2025_09_19_100300_create_reservations_table',1),(17,'2025_09_19_100500_create_notifications_table',1),(18,'2025_09_19_100600_create_payments_table',1),(19,'2025_09_19_100700_create_analytics_daily_table',1),(20,'2025_09_19_202235_add_performance_indexes_to_tables',1),(21,'2025_09_20_120000_add_surprise_basket_fields_to_products_table',1),(22,'2025_09_21_000100_add_notification_preferences_to_users_table',1),(23,'2025_09_22_100000_update_payments_table_for_gateways',1),(24,'2025_10_07_120000_create_search_queries_table',1),(25,'2025_10_10_000200_add_notification_settings_to_users_table',1),(26,'2025_10_15_113233_add_photo_url_to_merchants_table',1),(27,'2025_10_16_091500_add_core_fields_to_reservations_table',1),(28,'2025_10_16_100735_create_favorites_table',1),(29,'2025_10_18_120000_add_photo_url_to_users_table',1),(30,'2025_10_18_204931_add_category_id_to_merchants_table',1),(31,'2025_10_20_000100_create_carts_tables',1),(32,'2025_10_21_120000_create_inventory_movements_table',1),(33,'2025_10_21_120100_add_inventory_fields_to_products_table',1),(34,'2025_10_22_163827_create_settings_table',1),(35,'2025_10_24_232133_add_created_at_index_to_favorites_table',1),(36,'2025_10_25_090000_create_conversations_table',1),(37,'2025_10_25_090100_create_messages_table',1),(38,'2025_10_26_053955_create_carts_table',2),(39,'2025_10_26_054003_create_cart_items_table',2),(40,'2025_10_26_181709_create_surprise_basket_items_table',2),(41,'2025_10_26_193925_add_pickup_and_payment_fields_to_reservations_table',2);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_via` varchar(255) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_is_read_index` (`user_id`,`is_read`),
  KEY `notifications_sent_at_index` (`sent_at`),
  KEY `notifications_user_id_index` (`user_id`),
  KEY `notifications_created_at_index` (`created_at`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(8,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `payment_method` enum('flooz','tmoney','paystack','orange_money','mtn_momo','on_site','wallet') DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','success','failed','on_site','refunded') NOT NULL DEFAULT 'pending',
  `provider` varchar(255) DEFAULT NULL,
  `checkout_url` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(32) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_reservation_id_status_index` (`reservation_id`,`status`),
  KEY `payments_reference_index` (`reference`),
  KEY `payments_transaction_id_index` (`transaction_id`),
  CONSTRAINT `payments_reservation_id_foreign` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `merchant_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `original_price` decimal(8,2) NOT NULL,
  `discounted_price` decimal(8,2) NOT NULL,
  `quantity_available` int(10) unsigned NOT NULL,
  `low_stock_threshold` int(10) unsigned NOT NULL DEFAULT 5,
  `last_low_stock_alert_at` timestamp NULL DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `image_url` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_surprise_basket` tinyint(1) NOT NULL DEFAULT 0,
  `min_items` int(10) unsigned DEFAULT NULL,
  `max_items` int(10) unsigned DEFAULT NULL,
  `total_original_value` decimal(10,2) DEFAULT NULL,
  `surprise_description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `products_merchant_id_is_active_index` (`merchant_id`,`is_active`),
  KEY `products_category_id_is_active_index` (`category_id`,`is_active`),
  KEY `products_expiration_date_index` (`expiration_date`),
  KEY `products_merchant_id_index` (`merchant_id`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_is_active_index` (`is_active`),
  KEY `products_active_expiration_index` (`is_active`,`expiration_date`),
  KEY `products_merchant_active_index` (`merchant_id`,`is_active`),
  KEY `products_created_at_index` (`created_at`),
  KEY `products_merchant_id_is_surprise_basket_is_active_index` (`merchant_id`,`is_surprise_basket`,`is_active`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'Pain complet artisanal','Pain complet frais de la journée, légèrement rassis mais parfait pour accompagner vos repas.',500.00,250.00,10,5,NULL,'2025-10-30','https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(2,1,1,'Croissants artisanaux (x5)','Lot de 5 croissants pur beurre de la veille, encore délicieux pour le petit-déjeuner.',250.00,100.00,8,5,NULL,'2025-10-30','https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(3,1,1,'Baguette tradition','Baguette tradition française, cuite le matin même.',300.00,150.00,15,5,NULL,'2025-10-30','https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(4,1,7,'Tarte aux pommes','Tarte aux pommes maison, à consommer rapidement.',1500.00,750.00,3,5,NULL,'2025-10-31','https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(5,1,1,'Pain au chocolat (x3)','Lot de 3 pains au chocolat pur beurre.',350.00,200.00,5,5,NULL,'2025-10-30','https://images.unsplash.com/photo-1623334044303-241021148842?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17'),(6,1,8,'Sandwich jambon-beurre','Sandwich fait maison avec baguette fraîche, jambon de qualité et beurre.',800.00,400.00,6,5,NULL,'2025-10-29','https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&h=600&fit=crop',1,0,NULL,NULL,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `jti` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_unique` (`token`),
  KEY `refresh_tokens_user_id_revoked_index` (`user_id`,`revoked`),
  KEY `refresh_tokens_token_revoked_index` (`token`,`revoked`),
  KEY `refresh_tokens_expires_at_index` (`expires_at`),
  KEY `refresh_tokens_jti_index` (`jti`),
  CONSTRAINT `refresh_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reservations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity_reserved` int(10) unsigned NOT NULL,
  `total_amount` decimal(8,2) NOT NULL,
  `status` enum('pending','confirmed','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','success','failed','on_site','refunded') NOT NULL DEFAULT 'pending',
  `latest_payment_id` bigint(20) unsigned DEFAULT NULL,
  `reservation_code` varchar(255) NOT NULL,
  `reserved_at` timestamp NULL DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `pickup_date` date DEFAULT NULL,
  `pickup_time` time DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `merchant_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservations_reservation_code_unique` (`reservation_code`),
  KEY `reservations_user_id_status_index` (`user_id`,`status`),
  KEY `reservations_product_id_status_index` (`product_id`,`status`),
  KEY `reservations_expires_at_index` (`expires_at`),
  KEY `reservations_user_id_index` (`user_id`),
  KEY `reservations_product_id_index` (`product_id`),
  KEY `reservations_status_index` (`status`),
  KEY `reservations_user_status_index` (`user_id`,`status`),
  KEY `reservations_product_status_index` (`product_id`,`status`),
  KEY `reservations_reserved_at_index` (`reserved_at`),
  KEY `reservations_created_at_index` (`created_at`),
  CONSTRAINT `reservations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,3,1,2,500.00,'pending','pending',NULL,'RES-USLJ5MOH','2025-10-29 09:01:17',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 09:01:17','2025-10-29 09:01:17'),(2,3,2,1,100.00,'pending','pending',NULL,'RES-ICZIGNRB','2025-10-29 10:01:17',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 10:01:17','2025-10-29 10:01:17'),(3,3,3,3,450.00,'confirmed','pending',NULL,'RES-UACFF7G0','2025-10-29 06:01:17','2025-10-29 07:01:17',NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 06:01:17','2025-10-29 06:01:17'),(4,3,4,1,750.00,'confirmed','pending',NULL,'RES-RRID5S5H','2025-10-29 08:01:17','2025-10-29 09:01:17',NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 08:01:17','2025-10-29 08:01:17'),(5,3,5,2,400.00,'ready','pending',NULL,'RES-OZPO5UEY','2025-10-29 05:01:17','2025-10-29 06:01:17',NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 05:01:17','2025-10-29 05:01:17'),(6,3,1,1,250.00,'completed','pending',NULL,'RES-QSII7Z8V','2025-10-28 11:01:17','2025-10-28 12:01:17',NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-28 11:01:17','2025-10-28 14:01:17'),(7,3,2,2,200.00,'completed','pending',NULL,'RES-O0OOYK8M','2025-10-27 11:01:17','2025-10-27 12:01:17',NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-27 11:01:17','2025-10-27 13:01:17'),(8,3,3,1,150.00,'cancelled','pending',NULL,'RES-UJJJ9QFD','2025-10-29 03:01:17',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-30 11:01:17',NULL,NULL,'2025-10-29 03:01:17','2025-10-29 03:01:17');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_reports`
--

DROP TABLE IF EXISTS `review_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `review_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `review_id` bigint(20) unsigned NOT NULL,
  `reported_by` bigint(20) unsigned NOT NULL,
  `reason` enum('inappropriate_content','spam','fake_review','offensive_language','harassment','copyright_violation','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `review_reports_reported_by_foreign` (`reported_by`),
  KEY `review_reports_reviewed_by_foreign` (`reviewed_by`),
  KEY `review_reports_status_created_at_index` (`status`,`created_at`),
  KEY `review_reports_review_id_reported_by_index` (`review_id`,`reported_by`),
  CONSTRAINT `review_reports_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_reports_review_id_foreign` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_reports_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_reports`
--

LOCK TABLES `review_reports` WRITE;
/*!40000 ALTER TABLE `review_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `merchant_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `rating` tinyint(3) unsigned NOT NULL COMMENT 'Rating from 1 to 5',
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `merchant_response` text DEFAULT NULL,
  `merchant_response_at` timestamp NULL DEFAULT NULL,
  `merchant_response_updated_at` timestamp NULL DEFAULT NULL,
  `is_verified_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_merchant_id_index` (`merchant_id`),
  KEY `reviews_product_id_index` (`product_id`),
  KEY `reviews_user_id_index` (`user_id`),
  KEY `reviews_rating_index` (`rating`),
  KEY `reviews_merchant_id_is_approved_index` (`merchant_id`,`is_approved`),
  KEY `reviews_product_id_is_approved_index` (`product_id`,`is_approved`),
  KEY `reviews_created_at_index` (`created_at`),
  CONSTRAINT `reviews_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,3,1,1,5,'Excellent pain frais!','Le pain était vraiment délicieux et encore chaud. Merci pour cette belle initiative anti-gaspi!',NULL,NULL,NULL,1,1,'2025-10-27 11:01:17','2025-10-27 11:01:17','2025-10-27 11:01:17'),(2,3,1,2,5,'Croissants parfaits','Croissants excellents, croustillants à l\'extérieur et moelleux à l\'intérieur. Prix imbattable!','Merci beaucoup pour ce retour positif! Nous sommes ravis que nos croissants vous aient plu. À bientôt!','2025-10-27 16:01:17',NULL,1,1,'2025-10-26 11:01:17','2025-10-26 11:01:17','2025-10-26 11:01:17'),(3,3,1,1,4,'Très bon rapport qualité/prix','Pain de bonne qualité même en fin de journée. Une petite étoile en moins car il manquait un peu de croustillant.',NULL,NULL,NULL,1,1,'2025-10-24 11:01:17','2025-10-24 11:01:17','2025-10-24 11:01:17'),(4,3,1,3,5,'Super concept!','J\'adore pouvoir acheter des produits frais à prix réduit. C\'est bon pour le portefeuille et pour la planète!','Merci infiniment! C\'est exactement notre mission: réduire le gaspillage tout en rendant les bons produits accessibles. 🌍','2025-10-23 14:01:17',NULL,1,1,'2025-10-22 11:01:17','2025-10-22 11:01:17','2025-10-22 11:01:17'),(5,3,1,2,3,'Correct mais pas exceptionnel','Les croissants étaient bons mais un peu secs. Peut-être un peu trop vieux?',NULL,NULL,NULL,1,1,'2025-10-19 11:01:17','2025-10-19 11:01:17','2025-10-19 11:01:17'),(6,3,1,4,5,'Top!','Livraison rapide, produits frais. Je recommande vivement cette boulangerie!',NULL,NULL,NULL,1,1,'2025-10-28 11:01:17','2025-10-28 11:01:17','2025-10-28 11:01:17'),(7,3,1,1,4,'Bien','Bonne initiative. Le pain est de qualité et le prix est très attractif.','Merci pour votre avis! N\'hésitez pas à revenir nous voir. Nous mettons en ligne de nouveaux produits chaque jour.','2025-10-26 19:01:17',NULL,0,1,'2025-10-25 11:01:17','2025-10-25 11:01:17','2025-10-25 11:01:17'),(8,3,1,3,5,'Parfait pour moi!','Je suis une maman de 3 enfants et ces prix me permettent d\'acheter du pain frais tous les jours. Merci!',NULL,NULL,NULL,1,1,'2025-10-28 23:01:17','2025-10-28 23:01:17','2025-10-28 23:01:17'),(9,3,1,5,4,'Satisfait','Produit conforme à la description. Je reviendrai.',NULL,NULL,NULL,1,1,'2025-10-29 05:01:17','2025-10-29 05:01:17','2025-10-29 05:01:17'),(10,3,1,2,5,'Meilleurs croissants de Lomé!','Sérieusement, ces croissants sont incroyables. Et en plus à moitié prix? C\'est un rêve!',NULL,NULL,NULL,1,1,'2025-10-21 11:01:17','2025-10-21 11:01:17','2025-10-21 11:01:17');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `search_queries`
--

DROP TABLE IF EXISTS `search_queries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `search_queries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `query` varchar(255) NOT NULL,
  `search_count` int(10) unsigned NOT NULL DEFAULT 1,
  `last_results_count` int(10) unsigned DEFAULT NULL,
  `last_searched_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `search_queries_user_id_query_unique` (`user_id`,`query`),
  KEY `search_queries_query_index` (`query`),
  CONSTRAINT `search_queries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_queries`
--

LOCK TABLES `search_queries` WRITE;
/*!40000 ALTER TABLE `search_queries` DISABLE KEYS */;
/*!40000 ALTER TABLE `search_queries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `type` enum('string','integer','boolean','decimal','json') NOT NULL DEFAULT 'string',
  `group` varchar(255) NOT NULL DEFAULT 'general',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`),
  KEY `settings_group_index` (`group`),
  KEY `settings_key_index` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'site_name','Antigaspi','string','general','Nom de la plateforme','2025-10-29 11:00:30','2025-10-29 11:00:30'),(2,'site_description','Plateforme Anti-Gaspillage Alimentaire pour l\'Afrique de l\'Ouest','string','general','Description courte de la plateforme','2025-10-29 11:00:30','2025-10-29 11:00:30'),(3,'contact_email','contact@antigaspi.com','string','general','Email de contact principal','2025-10-29 11:00:30','2025-10-29 11:00:30'),(4,'support_phone','+228 90 00 00 00','string','general','Numéro de téléphone support','2025-10-29 11:00:30','2025-10-29 11:00:30'),(5,'commission_rate','10','decimal','commission','Taux de commission plateforme (%)','2025-10-29 11:00:30','2025-10-29 11:00:30'),(6,'min_commission_amount','50','integer','commission','Commission minimum en XOF','2025-10-29 11:00:30','2025-10-29 11:00:30'),(7,'currency','XOF','string','commission','Devise de la plateforme','2025-10-29 11:00:30','2025-10-29 11:00:30'),(8,'max_reservation_duration','24','integer','reservation','Durée maximale d\'une réservation (heures)','2025-10-29 11:00:30','2025-10-29 11:00:30'),(9,'auto_cancel_pending_after','2','integer','reservation','Annulation automatique après X heures','2025-10-29 11:00:30','2025-10-29 11:00:30'),(10,'notifications_enabled','1','boolean','notifications','Activer les notifications système','2025-10-29 11:00:30','2025-10-29 11:00:30'),(11,'email_notifications','1','boolean','notifications','Activer les notifications par email','2025-10-29 11:00:30','2025-10-29 11:00:30'),(12,'sms_notifications','0','boolean','notifications','Activer les notifications par SMS','2025-10-29 11:00:30','2025-10-29 11:00:30'),(13,'maintenance_mode','0','boolean','maintenance','Activer le mode maintenance','2025-10-29 11:00:30','2025-10-29 11:00:30'),(14,'maintenance_message','La plateforme est en maintenance. Nous serons de retour bientôt.','string','maintenance','Message affiché pendant la maintenance','2025-10-29 11:00:30','2025-10-29 11:00:30'),(15,'max_upload_size_mb','5','integer','limits','Taille maximale des fichiers (MB)','2025-10-29 11:00:30','2025-10-29 11:00:30'),(16,'max_products_per_merchant','100','integer','limits','Nombre maximum de produits par commerçant','2025-10-29 11:00:30','2025-10-29 11:00:30');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surprise_basket_items`
--

DROP TABLE IF EXISTS `surprise_basket_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `surprise_basket_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `surprise_basket_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `surprise_basket_items_surprise_basket_id_index` (`surprise_basket_id`),
  KEY `surprise_basket_items_product_id_index` (`product_id`),
  CONSTRAINT `surprise_basket_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `surprise_basket_items_surprise_basket_id_foreign` FOREIGN KEY (`surprise_basket_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surprise_basket_items`
--

LOCK TABLES `surprise_basket_items` WRITE;
/*!40000 ALTER TABLE `surprise_basket_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `surprise_basket_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` enum('consumer','merchant','admin') NOT NULL DEFAULT 'consumer',
  `status` enum('active','inactive','suspended','banned') NOT NULL DEFAULT 'active',
  `city` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `prefers_email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `prefers_sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `prefers_push_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `notification_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_settings`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`),
  KEY `users_role_status_index` (`role`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','System','Admin System','admin@antigaspi.com','2025-10-29 11:01:16','$2y$12$jt7ojdT6Dw3lr4tTn7YeY.hcni19D4so.O0sF8NNAAwVYVm7K8bhq','+33100000001','admin','active','Paris','1 Avenue de la République, Paris',NULL,1,NULL,NULL,'2025-10-29 11:01:16','2025-10-29 11:01:16',1,0,0,NULL),(2,'Martin','Boulanger','Martin Boulanger','boulangerie.martin@email.com','2025-10-29 11:01:16','$2y$12$6o5ufpKrZJUWWPW636EfHu2wyjr6QJMthwq0iEPhTxy7aRRAdxT/y','+22890123456','merchant','active','Lomé','15 Boulevard du 13 Janvier, Lomé',NULL,1,NULL,NULL,'2025-10-29 11:01:16','2025-10-29 11:01:16',1,0,0,NULL),(3,'Jean','Dupont','Jean Dupont','jean.dupont@email.com','2025-10-29 11:01:17','$2y$12$pcMDit6sULnQOhoeqKpjxepCV3lw6/4FRBTHbn8zf9JuWvSrnNQzi','+22890654321','consumer','active','Lomé','25 Rue de la Paix, Lomé',NULL,1,NULL,NULL,'2025-10-29 11:01:17','2025-10-29 11:01:17',1,0,0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-01  6:44:48
