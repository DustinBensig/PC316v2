-- Apply once to an existing application database before using enrollment booking.
-- Change this USE statement if the current installation uses another database name.
USE enrollment_system;

ALTER TABLE students
  MODIFY student_number VARCHAR(40) NULL,
  MODIFY academic_status ENUM(
    'applicant', 'active', 'inactive', 'graduated', 'dropped',
    'suspended', 'enrolling', 'enrolled'
  ) NOT NULL DEFAULT 'applicant',
  AUTO_INCREMENT = 8240000;

CREATE TABLE IF NOT EXISTS enrollment_schedules (
  schedule_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  year_level ENUM('First Year', 'Second Year', 'Third Year', 'Fourth Year') NOT NULL,
  week_number TINYINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (schedule_id),
  UNIQUE KEY uq_enrollment_schedule_year_week (year_level, week_number),
  KEY ix_enrollment_schedule_dates (status, start_date, end_date),
  CONSTRAINT chk_enrollment_schedule_week CHECK (
    (year_level = 'First Year' AND week_number = 1) OR
    (year_level = 'Second Year' AND week_number = 2) OR
    (year_level = 'Third Year' AND week_number = 3) OR
    (year_level = 'Fourth Year' AND week_number = 4)
  ),
  CONSTRAINT chk_enrollment_schedule_dates CHECK (start_date <= end_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollment_daily_capacity (
  appointment_date DATE NOT NULL,
  daily_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 150,
  is_open TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (appointment_date),
  CONSTRAINT chk_enrollment_daily_capacity CHECK (daily_capacity = 150)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollment_schedule_days (
  schedule_day_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  schedule_id BIGINT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  is_open TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (schedule_day_id),
  UNIQUE KEY uq_enrollment_schedule_day (schedule_id, appointment_date),
  KEY ix_enrollment_schedule_day_date (appointment_date, is_open),
  CONSTRAINT fk_enrollment_schedule_day_schedule FOREIGN KEY (schedule_id)
    REFERENCES enrollment_schedules (schedule_id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_schedule_day_capacity FOREIGN KEY (appointment_date)
    REFERENCES enrollment_daily_capacity (appointment_date)
) ENGINE=InnoDB;

ALTER TABLE enrollment_appointment_slots
  MODIFY capacity SMALLINT UNSIGNED NOT NULL DEFAULT 150;

INSERT IGNORE INTO appointment_status (status_code, status_name, is_terminal, sort_order)
VALUES
  ('confirmed', 'Confirmed', 0, 4),
  ('rescheduled', 'Rescheduled', 0, 5),
  ('completed', 'Completed', 1, 7),
  ('cancelled', 'Cancelled', 1, 8);

UPDATE enrollment_eligibility_rules
SET is_enabled = 1, rule_value = JSON_ARRAY('active')
WHERE rule_key = 'student_status';
