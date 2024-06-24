-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.4.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for enterprise_resource_planning
CREATE DATABASE IF NOT EXISTS `enterprise_resource_planning` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `enterprise_resource_planning`;

-- Dumping structure for table enterprise_resource_planning.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `location_id` (`location_id`),
  CONSTRAINT `fk_customer_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.customers: ~2 rows (approximately)
INSERT INTO `customers` (`id`, `customer_name`, `email`, `phone`, `location_id`) VALUES
	(1, 'ABC Company', 'abc@example.com', '555-1234', 1),
	(2, 'XYZ Corporation', 'xyz@example.com', '555-5678', 2);

-- Dumping structure for table enterprise_resource_planning.locations
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.locations: ~2 rows (approximately)
INSERT INTO `locations` (`id`, `location_name`, `address`, `city`, `state`, `country`, `postal_code`) VALUES
	(1, 'Head Office', '123 Main St', 'Anytown', 'CA', 'USA', '12345'),
	(2, 'Branch Office', '456 Elm St', 'Anycity', 'NY', 'USA', '67890');

-- Dumping structure for table enterprise_resource_planning.our_workers
CREATE TABLE IF NOT EXISTS `our_workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `secret_password` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`),
  KEY `location_id` (`location_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `fk_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `worker_roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.our_workers: ~0 rows (approximately)
INSERT INTO `our_workers` (`id`, `first_name`, `last_name`, `date_of_birth`, `email`, `secret_password`, `phone`, `location_id`, `hire_date`, `role_id`) VALUES
	(9, 'Tristán', 'Nouwens', '2000-03-14', 'bami@outlook.com', '585db29613c26a1bac703853ece4facc', '+31 6 24708667', NULL, '2024-06-19', 50);

-- Dumping structure for table enterprise_resource_planning.projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(100) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `fk_project_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.projects: ~2 rows (approximately)
INSERT INTO `projects` (`id`, `project_name`, `start_date`, `end_date`, `description`, `customer_id`) VALUES
	(1, 'Website Redesign', '2023-02-01', '2023-06-30', 'Redesign of company website.', 1),
	(2, 'Mobile App Development', '2023-04-15', '2023-10-31', 'Development of mobile app.', 2);

-- Dumping structure for table enterprise_resource_planning.project_workers
CREATE TABLE IF NOT EXISTS `project_workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `worker_id` (`worker_id`),
  CONSTRAINT `fk_project_worker_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_project_worker_worker` FOREIGN KEY (`worker_id`) REFERENCES `our_workers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.project_workers: ~1 rows (approximately)
INSERT INTO `project_workers` (`id`, `project_id`, `worker_id`) VALUES
	(1, 1, 9);

-- Dumping structure for table enterprise_resource_planning.worker_roles
CREATE TABLE IF NOT EXISTS `worker_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) NOT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.worker_roles: ~4 rows (approximately)
INSERT INTO `worker_roles` (`id`, `role_name`, `hourly_rate`) VALUES
	(1, 'Klant', 0.00),
	(2, 'Software Developer', 35.00),
	(3, 'Salesmedewerker', 40.00),
	(50, 'Owner', 50.00);

-- Dumping structure for table enterprise_resource_planning.worker_times
CREATE TABLE IF NOT EXISTS `worker_times` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `worker_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `clock_in` timestamp NULL DEFAULT NULL,
  `clock_out` timestamp NULL DEFAULT NULL,
  `clock_duration` time DEFAULT NULL,
  `break_duration` time DEFAULT NULL,
  `actual_duration` time DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `worker_id` (`worker_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fk_worker_times_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_worker_times_worker` FOREIGN KEY (`worker_id`) REFERENCES `our_workers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table enterprise_resource_planning.worker_times: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
