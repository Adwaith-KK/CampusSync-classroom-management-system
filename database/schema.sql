-- ========================================================
-- CampusSync — Database Schema
-- Smart Campus Resource & Availability Management System
-- ========================================================

CREATE DATABASE IF NOT EXISTS `campussync` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `campussync`;

-- Disable foreign key checks for clean teardown/rebuild
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `timetable`;
DROP TABLE IF EXISTS `facility_bookings`;
DROP TABLE IF EXISTS `facilities`;
DROP TABLE IF EXISTS `classroom_claims`;
DROP TABLE IF EXISTS `classrooms`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'faculty', 'hod', 'coordinator') NOT NULL,
  `department` VARCHAR(100) NOT NULL DEFAULT 'Computer Applications',
  `phone` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: classrooms
-- --------------------------------------------------------
CREATE TABLE `classrooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_number` VARCHAR(50) NOT NULL UNIQUE,
  `building` VARCHAR(100) NOT NULL,
  `floor` INT NOT NULL DEFAULT 1,
  `capacity` INT NOT NULL DEFAULT 60,
  `type` ENUM('Lecture Room', 'Laboratory', 'Seminar Room', 'Smart Classroom') NOT NULL DEFAULT 'Lecture Room',
  `status` ENUM('available', 'occupied', 'temporarily_claimed', 'scheduled', 'maintenance') NOT NULL DEFAULT 'available',
  `features` VARCHAR(255) DEFAULT 'Projector, Whiteboard, Wi-Fi',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_classrooms_status` (`status`),
  INDEX `idx_classrooms_building` (`building`),
  INDEX `idx_classrooms_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: classroom_claims
-- --------------------------------------------------------
CREATE TABLE `classroom_claims` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `classroom_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `purpose` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'released', 'expired') NOT NULL DEFAULT 'active',
  `released_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_claims_classroom_status` (`classroom_id`, `status`),
  INDEX `idx_claims_user_status` (`user_id`, `status`),
  INDEX `idx_claims_time_window` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: facilities
-- --------------------------------------------------------
CREATE TABLE `facilities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('Auditorium', 'Basketball Court', 'Football Ground', 'Badminton Court', 'Seminar Hall', 'Conference Room', 'Other') NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 100,
  `status` ENUM('available', 'maintenance', 'inactive') NOT NULL DEFAULT 'available',
  `description` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_facilities_status` (`status`),
  INDEX `idx_facilities_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: facility_bookings
-- --------------------------------------------------------
CREATE TABLE `facility_bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `facility_id` INT DEFAULT NULL,
  `classroom_id` INT DEFAULT NULL,
  `booking_type` ENUM('facility', 'classroom') NOT NULL DEFAULT 'facility',
  `user_id` INT NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `participants` INT NOT NULL DEFAULT 1,
  `approver_role` ENUM('hod', 'coordinator') NOT NULL DEFAULT 'coordinator',
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT DEFAULT NULL,
  `reviewed_by` INT DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_fb_facility_date` (`facility_id`, `booking_date`, `status`),
  INDEX `idx_fb_classroom_date` (`classroom_id`, `booking_date`, `status`),
  INDEX `idx_fb_user` (`user_id`),
  INDEX `idx_fb_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: timetable
-- --------------------------------------------------------
CREATE TABLE `timetable` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `classroom_id` INT NOT NULL,
  `faculty_id` INT NOT NULL,
  `course_name` VARCHAR(100) NOT NULL,
  `course_code` VARCHAR(50) NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `semester` VARCHAR(50) NOT NULL DEFAULT 'MCA Semester 3',
  `section` VARCHAR(20) NOT NULL DEFAULT 'A',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`faculty_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_timetable_classroom_day` (`classroom_id`, `day_of_week`),
  INDEX `idx_timetable_faculty_day` (`faculty_id`, `day_of_week`),
  INDEX `idx_timetable_day_time` (`day_of_week`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('claim', 'booking', 'system', 'timetable') NOT NULL DEFAULT 'system',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: audit_logs
-- --------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT DEFAULT NULL,
  `description` TEXT NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_created` (`created_at`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: system_settings
-- --------------------------------------------------------
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Default System Settings
-- --------------------------------------------------------
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('default_claim_duration_minutes', '60', 'Default time duration allocated for an emergency classroom claim'),
('max_claim_duration_minutes', '180', 'Maximum duration in minutes allowed for temporary classroom claim'),
('allow_weekend_claims', 'true', 'Whether claims are permitted on Saturday and Sunday'),
('system_announcement', 'Welcome to CampusSync Smart Campus Resource Management System', 'Global campus broadcast banner');
