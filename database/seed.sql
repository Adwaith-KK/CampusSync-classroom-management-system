-- ========================================================
-- CampusSync — Seed Demo Data
-- Default password for all seed accounts is: password123
-- Hash: $2a$10$Df8QydcH8rqyKFr1emgSP.R81fCDSvptIcOHs2P1aZqgiIccg1rvm
-- ========================================================

USE `campussync`;

-- Clean existing data
DELETE FROM `audit_logs`;
DELETE FROM `notifications`;
DELETE FROM `timetable`;
DELETE FROM `facility_bookings`;
DELETE FROM `classroom_claims`;
DELETE FROM `facilities`;
DELETE FROM `classrooms`;
DELETE FROM `users`;

-- --------------------------------------------------------
-- Seed Users (Four primary roles)
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `department`, `phone`, `status`) VALUES
-- 1. Head of Department (HOD)
(1, 'Dr. Muruaganantham A', 'hod@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'hod', 'Computer Applications', '+91 98765 43210', 'active'),

-- 2. Program Coordinator
(2, 'Dr. Velmurugan R', 'coordinator@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'coordinator', 'Computer Applications', '+91 98765 43211', 'active'),

-- 3. Faculty Members
(3, 'Mrs. Vimala Rosilin', 'faculty1@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'faculty', 'Computer Applications', '+91 98765 43212', 'active'),
(4, 'Prof. Grace Hopper', 'faculty2@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'faculty', 'Information Technology', '+91 98765 43213', 'active'),
(5, 'Dr. Donald Knuth', 'faculty3@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'faculty', 'Computer Applications', '+91 98765 43214', 'active'),

-- 4. Students
(6, 'Adwaith Krishna K', 'student1@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'student', 'Computer Applications', '+91 98765 43220', 'active'),
(7, 'Priya Patel', 'student2@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'student', 'Computer Applications', '+91 98765 43221', 'active'),
(8, 'Rahul Verma', 'student3@campussync.edu', '$2a$10$q0.INYE9SfY8/BaLqDF6VuWRfK/GRNQBf02Ok.fRHkmFidPp3gEe.', 'student', 'Information Technology', '+91 98765 43222', 'active');

-- --------------------------------------------------------
-- Seed Classrooms
-- --------------------------------------------------------
INSERT INTO `classrooms` (`id`, `room_number`, `building`, `floor`, `capacity`, `type`, `status`, `features`) VALUES
(1, 'A-101', 'A block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(2, 'A-102', 'A block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(3, 'A-103', 'A block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(4, 'A-201', 'A block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(5, 'A-202', 'A block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(6, 'A-203', 'A block', 2, 90, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(7, 'B-101', 'B block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(8, 'B-102', 'B block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(9, 'B-103', 'B block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(10, 'B-201', 'B block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(11, 'B-202', 'B block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(12, 'B-203', 'B block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(13, 'C-101', 'C block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(14, 'C-102', 'C block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(15, 'C-103', 'C block', 1, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(16, 'C-201', 'C block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(17, 'C-202', 'C block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(18, 'C-203', 'C block', 2, 60, 'Lecture Room', 'available', 'Projector, Wi-Fi, Whiteboard'),
(19, 'LAB-301', 'B block', 3, 45, 'Laboratory', 'available', 'Computer workstations, LAN, AC'),
(20, 'LAB-302', 'B block', 3, 40, 'Laboratory', 'available', 'Computer workstations, LAN, AC');

-- --------------------------------------------------------
-- Seed Facilities
-- --------------------------------------------------------
INSERT INTO `facilities` (`id`, `name`, `type`, `location`, `capacity`, `status`, `description`) VALUES
(1, 'Basketball Court', 'Basketball Court', 'Campus', 50, 'available', NULL),
(2, 'Volleyball Court', 'Other', 'Campus', 100, 'available', NULL),
(3, 'A1 Auditorium', 'Auditorium', 'Campus', 500, 'available', NULL),
(4, 'A2 Audi', 'Auditorium', 'Campus', 100, 'available', NULL),
(5, 'A3 Audi', 'Auditorium', 'Campus', 100, 'available', NULL),
(6, 'A5 Audi', 'Auditorium', 'Campus', 100, 'available', NULL),
(7, 'Quadrangle', 'Other', 'Campus', 100, 'available', NULL),
(8, 'Conf Hall', 'Conference Room', 'Campus', 100, 'available', NULL);

-- --------------------------------------------------------
-- Seed Timetable Entries (Official Schedules)
-- --------------------------------------------------------
INSERT INTO `timetable` (`classroom_id`, `faculty_id`, `course_name`, `course_code`, `day_of_week`, `start_time`, `end_time`, `semester`, `section`) VALUES
-- Monday
(1, 3, 'Advanced Database Management Systems', 'MCA301', 'Monday', '09:00:00', '10:30:00', 'MCA Semester 3', 'A'),
(2, 4, 'Cloud Computing & DevOps Architecture', 'MCA302', 'Monday', '10:30:00', '12:00:00', 'MCA Semester 3', 'A'),
(3, 3, 'DBMS Practical Lab', 'MCA306', 'Monday', '13:00:00', '15:00:00', 'MCA Semester 3', 'Lab-Group 1'),
-- Tuesday
(1, 5, 'Full-Stack Web Engineering', 'MCA303', 'Tuesday', '09:00:00', '10:30:00', 'MCA Semester 3', 'A'),
(5, 4, 'Machine Learning Foundations', 'MCA304', 'Tuesday', '11:00:00', '12:30:00', 'MCA Semester 3', 'A'),
(4, 5, 'Web Technologies Lab', 'MCA307', 'Tuesday', '14:00:00', '16:00:00', 'MCA Semester 3', 'Lab-Group 2'),
-- Wednesday
(2, 3, 'Advanced Software Engineering', 'MCA305', 'Wednesday', '09:30:00', '11:00:00', 'MCA Semester 3', 'A'),
(6, 5, 'Technical Seminar & Research Colloquium', 'MCA308', 'Wednesday', '14:00:00', '16:00:00', 'MCA Semester 3', 'All'),
-- Thursday
(1, 4, 'Information & Cyber Security', 'MCA309', 'Thursday', '10:00:00', '11:30:00', 'MCA Semester 3', 'A'),
(3, 4, 'Network Security Lab', 'MCA310', 'Thursday', '13:30:00', '15:30:00', 'MCA Semester 3', 'Lab-Group 1'),
-- Friday
(5, 5, 'Artificial Intelligence in Practice', 'MCA311', 'Friday', '09:30:00', '11:00:00', 'MCA Semester 3', 'A'),
(2, 3, 'Distributed Computing Systems', 'MCA312', 'Friday', '11:30:00', '13:00:00', 'MCA Semester 3', 'A');

-- --------------------------------------------------------
-- Seed Facility Bookings (Requests & Approvals)
-- --------------------------------------------------------
INSERT INTO `facility_bookings` (`id`, `facility_id`, `classroom_id`, `booking_type`, `user_id`, `purpose`, `description`, `booking_date`, `start_time`, `end_time`, `participants`, `approver_role`, `status`, `rejection_reason`, `reviewed_by`, `reviewed_at`) VALUES
-- Approved Auditorium Booking
(1, 3, NULL, 'facility', 3, 'National Tech Symposium Keynote', 'Annual MCA Tech Conclave featuring national keynote speakers.', DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY), '10:00:00', '13:00:00', 350, 'coordinator', 'approved', NULL, 2, CURRENT_TIMESTAMP),

-- Pending Basketball Court Booking
(2, 1, NULL, 'facility', 4, 'Inter-Department Faculty Basketball Tournament', 'Annual wellness tournament between CS and IT faculty.', DATE_ADD(CURRENT_DATE(), INTERVAL 3 DAY), '16:00:00', '18:00:00', 16, 'coordinator', 'pending', NULL, NULL, NULL),

-- Planned Future Classroom Booking (Requires HOD approval)
(3, NULL, 6, 'classroom', 5, 'Special MCA Placement Hackathon Prep', 'Two-day bootcamp on Data Structures & Competitive Coding.', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '14:00:00', '17:00:00', 70, 'hod', 'pending', NULL, NULL, NULL),

-- Rejected Facility Booking Example
(4, 6, NULL, 'facility', 4, 'Alumni Mentorship Circle', 'Interactive session with alumni working in cloud architecture.', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), '11:00:00', '13:00:00', 60, 'coordinator', 'rejected', 'Conflicted with previously scheduled Department Accreditation Visit.', 2, CURRENT_TIMESTAMP);

-- --------------------------------------------------------
-- Seed Notifications
-- --------------------------------------------------------
INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `is_read`) VALUES
(3, 'Booking Approved', 'Your booking request for A1 Auditorium on the symposium date has been APPROVED by Prof. Sunita Rao.', 'booking', 1),
(1, 'New Approval Pending (HOD)', 'Dr. Donald Knuth submitted a planned classroom request for A-203 requiring HOD approval.', 'booking', 0),
(2, 'New Facility Booking Pending', 'Prof. Grace Hopper submitted a booking request for Basketball Court.', 'booking', 0),
(6, 'Timetable Announcement', 'Official timetable for MCA Semester 3 has been updated and synchronized in CampusSync.', 'timetable', 0),
(7, 'Campus Maintenance Notice', 'A classroom is currently under scheduled maintenance for projector calibration and cooling servicing.', 'system', 0);

-- --------------------------------------------------------
-- Seed Audit Logs
-- --------------------------------------------------------
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`) VALUES
(2, 'SYSTEM_INIT', 'system', NULL, 'CampusSync database schema and seed data initialized successfully.', '127.0.0.1'),
(3, 'FACILITY_BOOKING_REQUESTED', 'facility_bookings', 1, 'Faculty Dr. Alan Turing requested A1 Auditorium.', '127.0.0.1'),
(2, 'FACILITY_BOOKING_APPROVED', 'facility_bookings', 1, 'Coordinator Prof. Sunita Rao approved booking for A1 Auditorium.', '127.0.0.1'),
(4, 'FACILITY_BOOKING_REJECTED', 'facility_bookings', 4, 'Coordinator Prof. Sunita Rao rejected request for A5 Audi.', '127.0.0.1'),
(5, 'CLASSROOM_BOOKING_REQUESTED', 'facility_bookings', 3, 'Dr. Donald Knuth requested A-203 for Hackathon prep requiring HOD approval.', '127.0.0.1');
