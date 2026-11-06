-- Local-only test fixtures for the canonical schema in database/schema.sql.
-- Import only into an empty enrollment_system database. Test password for all
-- five accounts: Local-Enrollment-Test-2026!
USE enrollment_system;

START TRANSACTION;

INSERT INTO users (email, password_hash, first_name, last_name, account_type)
VALUES
  ('enrollment-test-8240000@example.com', '$2y$10$IKj1wunZK8KUwJrRQSIYV.ytyOTSEkZFgaPfghz47hyIZj/SQJPUu', 'Test', 'Qualified', 'student'),
  ('enrollment-test-8240001@example.com', '$2y$10$IKj1wunZK8KUwJrRQSIYV.ytyOTSEkZFgaPfghz47hyIZj/SQJPUu', 'Test', 'MissingGrade', 'student'),
  ('enrollment-test-8240002@example.com', '$2y$10$IKj1wunZK8KUwJrRQSIYV.ytyOTSEkZFgaPfghz47hyIZj/SQJPUu', 'Test', 'OutstandingBalance', 'student'),
  ('enrollment-test-8240003@example.com', '$2y$10$IKj1wunZK8KUwJrRQSIYV.ytyOTSEkZFgaPfghz47hyIZj/SQJPUu', 'Test', 'MissingRequirement', 'student'),
  ('enrollment-test-8240004@example.com', '$2y$10$IKj1wunZK8KUwJrRQSIYV.ytyOTSEkZFgaPfghz47hyIZj/SQJPUu', 'Test', 'ActiveHold', 'student');

INSERT INTO students (id, user_id, student_number, program, year_level, department_id, academic_status)
SELECT 8240000, users.id, '8240000', 'BSIT', 'First Year', departments.id, 'active'
FROM users CROSS JOIN departments
WHERE users.email = 'enrollment-test-8240000@example.com' AND departments.department_code = 'CodeTech';

INSERT INTO students (id, user_id, student_number, program, year_level, department_id, academic_status)
SELECT 8240001, users.id, '8240001', 'BSIT', 'First Year', departments.id, 'active'
FROM users CROSS JOIN departments
WHERE users.email = 'enrollment-test-8240001@example.com' AND departments.department_code = 'CodeTech';

INSERT INTO students (id, user_id, student_number, program, year_level, department_id, academic_status)
SELECT 8240002, users.id, '8240002', 'BSIT', 'Second Year', departments.id, 'active'
FROM users CROSS JOIN departments
WHERE users.email = 'enrollment-test-8240002@example.com' AND departments.department_code = 'CodeTech';

INSERT INTO students (id, user_id, student_number, program, year_level, department_id, academic_status)
SELECT 8240003, users.id, '8240003', 'BSIT', 'Third Year', departments.id, 'active'
FROM users CROSS JOIN departments
WHERE users.email = 'enrollment-test-8240003@example.com' AND departments.department_code = 'CodeTech';

INSERT INTO students (id, user_id, student_number, program, year_level, department_id, academic_status)
SELECT 8240004, users.id, '8240004', 'BSIT', 'Fourth Year', departments.id, 'active'
FROM users CROSS JOIN departments
WHERE users.email = 'enrollment-test-8240004@example.com' AND departments.department_code = 'CodeTech';

INSERT INTO student_enrollment_subjects (student_id, subject, is_required)
SELECT students.id, subjects.subject, 1
FROM students
JOIN (
  SELECT 8240000 AS student_id, 'IT101' AS subject UNION ALL
  SELECT 8240001, 'IT101' UNION ALL
  SELECT 8240001, 'IT312' UNION ALL
  SELECT 8240002, 'IT101' UNION ALL
  SELECT 8240003, 'IT101' UNION ALL
  SELECT 8240004, 'IT101'
) AS subjects ON subjects.student_id = students.id;

INSERT INTO grades (student_id, subject, grade, grade_status)
VALUES
  (8240000, 'IT101', 90.00, 'complete'),
  (8240001, 'IT101', NULL, 'missing'),
  (8240001, 'IT312', NULL, 'incomplete'),
  (8240002, 'IT101', 88.00, 'complete'),
  (8240003, 'IT101', 85.00, 'complete'),
  (8240004, 'IT101', 91.00, 'complete');

INSERT INTO financial_records (student_id, balance, payment_status, description)
VALUES
  (8240000, 0.00, 'paid', 'Test account'),
  (8240001, 0.00, 'paid', 'Test account'),
  (8240002, 3500.00, 'unpaid', 'Outstanding enrollment balance'),
  (8240003, 0.00, 'paid', 'Test account'),
  (8240004, 0.00, 'paid', 'Test account');

INSERT INTO student_enrollment_documents (student_id, document_type_id, status)
SELECT students.id, document_types.id,
       CASE
         WHEN students.id = 8240003 AND document_types.id = (
           SELECT MIN(id) FROM enrollment_document_types
           WHERE is_active = 1 AND is_required = 1
         ) THEN 'missing'
         ELSE 'verified'
       END
FROM students
CROSS JOIN enrollment_document_types AS document_types
WHERE students.id BETWEEN 8240000 AND 8240004
  AND document_types.is_active = 1 AND document_types.is_required = 1;

INSERT INTO student_enrollment_requirements
  (student_id, requirement_name, status, blocks_enrollment)
VALUES (8240003, 'Transcript of Records', 'unresolved', 1);

INSERT INTO enrollment_holds (student_id, reason, status)
VALUES (8240004, 'Active enrollment hold for testing', 'active');

COMMIT;

-- Enrollment schedules and appointment times are seeded by database/schema.sql.
