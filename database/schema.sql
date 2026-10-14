-- EnrollEase enrollment appointment system
-- MySQL 8.0+ / InnoDB. Apply through a reviewed migration in production.
-- Enforce role, department, and record-level authorization in the PHP API;
-- frontend filtering is for presentation only and is not a security boundary.

CREATE DATABASE IF NOT EXISTS enrolle_enrollment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE enrolle_enrollment;

CREATE TABLE roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_key VARCHAR(40) NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_key (role_key)
) ENGINE=InnoDB;

CREATE TABLE departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_code VARCHAR(40) NOT NULL,
  department_name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (department_code),
  UNIQUE KEY uq_departments_name (department_name)
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(32) NULL,
  account_type ENUM('student', 'admin') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_type_active (account_type, is_active)
) ENGINE=InnoDB;

CREATE TABLE students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  student_number VARCHAR(40) NOT NULL,
  program VARCHAR(150) NOT NULL,
  year_level VARCHAR(40) NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  academic_status ENUM('applicant', 'enrolling', 'enrolled', 'inactive') NOT NULL DEFAULT 'applicant',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_user (user_id),
  UNIQUE KEY uq_students_number (student_number),
  KEY ix_students_department_status (department_id, academic_status),
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_students_department FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_permissions (role_id, permission_key),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  deactivated_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_user (user_id),
  KEY ix_admins_department_active (department_id, is_active),
  CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_admins_role FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT fk_admins_department FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_admins_created_by FOREIGN KEY (created_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_system_settings_admin FOREIGN KEY (updated_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE appointment_status (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_code VARCHAR(32) NOT NULL,
  status_name VARCHAR(60) NOT NULL,
  is_terminal TINYINT(1) NOT NULL DEFAULT 0,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointment_status_code (status_code)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  appointment_status_id SMALLINT UNSIGNED NOT NULL,
  appointment_type VARCHAR(100) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  student_note TEXT NULL,
  admin_note TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointments_public_id (public_id),
  KEY ix_appointments_department_schedule (department_id, scheduled_at),
  KEY ix_appointments_student_schedule (student_id, scheduled_at),
  KEY ix_appointments_status_schedule (appointment_status_id, scheduled_at),
  CONSTRAINT fk_appointments_student FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT fk_appointments_department FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_appointments_status FOREIGN KEY (appointment_status_id) REFERENCES appointment_status (id),
  CONSTRAINT fk_appointments_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_appointments_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE appointment_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id BIGINT UNSIGNED NOT NULL,
  from_status_id SMALLINT UNSIGNED NULL,
  to_status_id SMALLINT UNSIGNED NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_appointment_history_appointment (appointment_id, created_at),
  CONSTRAINT fk_appointment_history_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_history_from_status FOREIGN KEY (from_status_id) REFERENCES appointment_status (id),
  CONSTRAINT fk_appointment_history_to_status FOREIGN KEY (to_status_id) REFERENCES appointment_status (id),
  CONSTRAINT fk_appointment_history_user FOREIGN KEY (changed_by) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE enrollment_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  academic_year VARCHAR(9) NOT NULL,
  semester ENUM('first', 'second', 'summer') NOT NULL,
  enrollment_status ENUM('in_progress', 'requirements_pending', 'completed', 'rejected') NOT NULL DEFAULT 'in_progress',
  registrar_admin_id BIGINT UNSIGNED NULL,
  confirmed_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollment_student_term (student_id, academic_year, semester),
  KEY ix_enrollment_status_term (enrollment_status, academic_year, semester),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT fk_enrollment_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
  CONSTRAINT fk_enrollment_registrar FOREIGN KEY (registrar_admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE requirements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  requirement_code VARCHAR(60) NOT NULL,
  requirement_name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_requirements_department_code (department_id, requirement_code),
  CONSTRAINT fk_requirements_department FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB;

CREATE TABLE clearance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  requirement_id BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  clearance_status ENUM('pending', 'cleared', 'not_cleared', 'referred') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clearance_student_requirement (student_id, requirement_id),
  KEY ix_clearances_requirement_status (requirement_id, clearance_status),
  CONSTRAINT fk_clearances_student FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT fk_clearances_requirement FOREIGN KEY (requirement_id) REFERENCES requirements (id),
  CONSTRAINT fk_clearances_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
  CONSTRAINT fk_clearances_reviewer FOREIGN KEY (reviewed_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  receipt_number VARCHAR(80) NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  payment_status ENUM('pending', 'paid', 'unpaid', 'refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(60) NULL,
  recorded_by BIGINT UNSIGNED NULL,
  paid_at DATETIME NULL,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_receipt (receipt_number),
  KEY ix_payments_student_status (student_id, payment_status),
  CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students (id),
  CONSTRAINT fk_payments_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_admin FOREIGN KEY (recorded_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  notification_type VARCHAR(60) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  delivery_channel ENUM('in_app', 'email') NOT NULL DEFAULT 'in_app',
  delivery_status ENUM('queued', 'sent', 'failed', 'read') NOT NULL DEFAULT 'queued',
  read_at DATETIME NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user_created (user_id, created_at),
  KEY ix_notifications_delivery (delivery_channel, delivery_status, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  published_at DATETIME NULL,
  expires_at DATETIME NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_announcements_publication (is_published, published_at, expires_at),
  CONSTRAINT fk_announcements_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT fk_announcements_admin FOREIGN KEY (created_by) REFERENCES admins (id)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  actor_role_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,
  action_key VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_activity_department_created (department_id, created_at),
  KEY ix_activity_actor_created (actor_user_id, created_at),
  KEY ix_activity_entity (entity_type, entity_id),
  CONSTRAINT fk_activity_user FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_role FOREIGN KEY (actor_role_id) REFERENCES roles (id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO roles (role_key, role_name, description) VALUES
  ('MIS', 'Main Admin', 'Full system access and cross-department administration'),
  ('SSG_ADMIN', 'SSG Admin', 'SSG appointments, assigned student information, and announcements'),
  ('CODETECH_ADMIN', 'CodeTech Admin', 'CodeTech appointments, students, and document verification'),
  ('COED_ADMIN', 'COED Admin', 'COED appointments, students, and document verification'),
  ('HM_ADMIN', 'HM Admin', 'HM appointments, students, and document verification'),
  ('BIT_ADMIN', 'BIT Admin', 'BIT appointments, students, and document verification'),
  ('REGISTRAR_ADMIN', 'Registrar Admin', 'Enrollment records, requirements, and student documents'),
  ('CLINIC_ADMIN', 'Clinic Admin', 'Medical clearance records only'),
  ('CASHIER_ADMIN', 'Cashier Admin', 'Payment records and payment history only'),
  ('GUIDANCE_ADMIN', 'Guidance Admin', 'Guidance clearance records only');

INSERT INTO departments (department_code, department_name) VALUES
  ('SSG', 'SSG'),
  ('CodeTech', 'CodeTech'),
  ('COED', 'COED'),
  ('HM', 'HM'),
  ('BIT', 'BIT'),
  ('Registrar', 'Registrar'),
  ('Clinic', 'Clinic'),
  ('Cashier', 'Cashier'),
  ('Guidance', 'Guidance');

INSERT INTO appointment_status (status_code, status_name, is_terminal, sort_order) VALUES
  ('submitted', 'Submitted', 0, 1),
  ('pending', 'Pending', 0, 2),
  ('approved', 'Approved', 0, 3),
  ('rescheduled', 'Rescheduled', 0, 4),
  ('rejected', 'Rejected', 1, 5),
  ('completed', 'Completed', 1, 6),
  ('cancelled', 'Cancelled', 1, 7);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles AS r
JOIN (
  SELECT 'MIS' AS role_key, 'system.*' AS permission_key UNION ALL
  SELECT 'MIS', 'appointments.*' UNION ALL
  SELECT 'MIS', 'students.*' UNION ALL
  SELECT 'MIS', 'admins.*' UNION ALL
  SELECT 'MIS', 'roles.assign' UNION ALL
  SELECT 'MIS', 'enrollment_records.*' UNION ALL
  SELECT 'MIS', 'clearances.*' UNION ALL
  SELECT 'MIS', 'payments.*' UNION ALL
  SELECT 'MIS', 'reports.read' UNION ALL
  SELECT 'MIS', 'activity_logs.read' UNION ALL
  SELECT 'MIS', 'announcements.*' UNION ALL
  SELECT 'SSG_ADMIN', 'appointments.read.assigned' UNION ALL
  SELECT 'SSG_ADMIN', 'appointments.update.assigned' UNION ALL
  SELECT 'SSG_ADMIN', 'students.read.assigned' UNION ALL
  SELECT 'SSG_ADMIN', 'announcements.manage' UNION ALL
  SELECT 'CODETECH_ADMIN', 'appointments.read.assigned' UNION ALL
  SELECT 'CODETECH_ADMIN', 'appointments.update.assigned' UNION ALL
  SELECT 'CODETECH_ADMIN', 'students.read.assigned' UNION ALL
  SELECT 'CODETECH_ADMIN', 'documents.verify.assigned' UNION ALL
  SELECT 'COED_ADMIN', 'appointments.read.assigned' UNION ALL
  SELECT 'COED_ADMIN', 'appointments.update.assigned' UNION ALL
  SELECT 'COED_ADMIN', 'students.read.assigned' UNION ALL
  SELECT 'COED_ADMIN', 'documents.verify.assigned' UNION ALL
  SELECT 'HM_ADMIN', 'appointments.read.assigned' UNION ALL
  SELECT 'HM_ADMIN', 'appointments.update.assigned' UNION ALL
  SELECT 'HM_ADMIN', 'students.read.assigned' UNION ALL
  SELECT 'HM_ADMIN', 'documents.verify.assigned' UNION ALL
  SELECT 'BIT_ADMIN', 'appointments.read.assigned' UNION ALL
  SELECT 'BIT_ADMIN', 'appointments.update.assigned' UNION ALL
  SELECT 'BIT_ADMIN', 'students.read.assigned' UNION ALL
  SELECT 'BIT_ADMIN', 'documents.verify.assigned' UNION ALL
  SELECT 'REGISTRAR_ADMIN', 'students.read' UNION ALL
  SELECT 'REGISTRAR_ADMIN', 'enrollment_records.read' UNION ALL
  SELECT 'REGISTRAR_ADMIN', 'enrollment_records.update' UNION ALL
  SELECT 'REGISTRAR_ADMIN', 'documents.review' UNION ALL
  SELECT 'CLINIC_ADMIN', 'clearances.medical.read' UNION ALL
  SELECT 'CLINIC_ADMIN', 'clearances.medical.update' UNION ALL
  SELECT 'CASHIER_ADMIN', 'payments.read' UNION ALL
  SELECT 'CASHIER_ADMIN', 'payments.update' UNION ALL
  SELECT 'GUIDANCE_ADMIN', 'clearances.guidance.read' UNION ALL
  SELECT 'GUIDANCE_ADMIN', 'clearances.guidance.update'
) AS p ON p.role_key = r.role_key;

INSERT INTO requirements (department_id, requirement_code, requirement_name, description, sort_order)
SELECT d.id, r.requirement_code, r.requirement_name, r.description, r.sort_order
FROM departments AS d
JOIN (
  SELECT 'Registrar' AS department_name, 'ENROLLMENT_RECORD' AS requirement_code, 'Enrollment record review' AS requirement_name, 'Verify enrollment record and confirm completed requirements.' AS description, 1 AS sort_order UNION ALL
  SELECT 'Clinic', 'MEDICAL_CLEARANCE', 'Medical clearance', 'Record medical clearance as cleared, pending, or not cleared.', 1 UNION ALL
  SELECT 'Guidance', 'GUIDANCE_CLEARANCE', 'Guidance clearance', 'Record guidance clearance as cleared, pending, or referred.', 1 UNION ALL
  SELECT 'Cashier', 'PAYMENT_REQUIREMENT', 'Enrollment payment', 'Record payment as paid, pending, or unpaid.', 1 UNION ALL
  SELECT 'CodeTech', 'DOCUMENT_VERIFICATION', 'Required documents', 'Verify required enrollment documents for CodeTech.', 1 UNION ALL
  SELECT 'COED', 'DOCUMENT_VERIFICATION', 'Required documents', 'Verify required enrollment documents for COED.', 1 UNION ALL
  SELECT 'HM', 'DOCUMENT_VERIFICATION', 'Required documents', 'Verify required enrollment documents for HM.', 1 UNION ALL
  SELECT 'BIT', 'DOCUMENT_VERIFICATION', 'Required documents', 'Verify required enrollment documents for BIT.', 1
) AS r ON r.department_name = d.department_name;

-- SMTP/PHPMailer integration: enqueue email notifications in notifications,
-- then let a PHP worker send queued rows and update delivery_status/sent_at.
-- Keep SMTP usernames/passwords in server-side environment or secret storage;
-- do not store them in system_settings or expose them to the frontend.
