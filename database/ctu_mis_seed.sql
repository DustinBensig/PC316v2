-- =========================================================================
-- CEBU TECHNOLOGICAL UNIVERSITY (CTU) - DAANBANTAYAN CAMPUS
-- CENTRAL MIS DATABASE: MASTER SEED DATA (RUN IN ctu-mis-database SQL EDITOR)
-- =========================================================================

-- Step 1: Ensure full public access for web portal queries & updates
ALTER TABLE IF EXISTS mis_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mis_curriculum_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mis_fee_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mis_students_master DISABLE ROW LEVEL SECURITY;

-- Remove program foreign key constraint from mis_fee_structures so fee schedules are universal for ALL students
ALTER TABLE IF EXISTS mis_fee_structures DROP CONSTRAINT IF EXISTS mis_fee_structures_program_code_fkey;
ALTER TABLE IF EXISTS mis_fee_structures ALTER COLUMN program_code DROP NOT NULL;
ALTER TABLE IF EXISTS mis_fee_structures ALTER COLUMN program_code SET DEFAULT 'ALL';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 2: Clear old records
TRUNCATE TABLE mis_curriculum_subjects RESTART IDENTITY CASCADE;
TRUNCATE TABLE mis_fee_structures RESTART IDENTITY CASCADE;
DELETE FROM mis_students_master;
DELETE FROM mis_programs;

-- Step 3: Insert Programs
INSERT INTO mis_programs (code, name, department) VALUES
('BSIT', 'Bachelor of Science in Information Technology', 'CodeTech'),
('BSHM', 'Bachelor of Science in Hospitality Management', 'HM'),
('BSIE', 'Bachelor of Science in Industrial Engineering', 'COED'),
('BEED', 'Bachelor of Elementary Education', 'COED'),
('BSED', 'Bachelor of Secondary Education Major in Mathematics', 'COED'),
('BTLED', 'Bachelor in Technology and Livelihood Education Major in Home Economics', 'COED'),
('BSF', 'Bachelor of Science in Fisheries', 'Fisheries'),
('BIT-CT', 'Bachelor of Industrial Technology Major in Computer Technology', 'BIT'),
('BIT-ET', 'Bachelor of Industrial Technology Major in Electronics Technology', 'BIT'),
('BIT-AT', 'Bachelor of Industrial Technology Major in Automotive Technology', 'BIT'),
('ALL', 'All University Programs (Standard CTU Fee Schedule)', 'Central Administration');

-- Step 4: Insert 1-2 Students Per Course (with 7-Digit Student IDs from Real CTU Records)
INSERT INTO mis_students_master (student_id, full_name, program_code, year_level, section, block_name, email, contact, academic_status, clearance_status) VALUES
-- BSIT
('8240873', 'CAPECENIO, LLYOD', 'BSIT', 2, 'BSIT 2-A', 'BLK_BSIT-2A_DAY', 'capecenio.llyod@ctu.edu.ph', '09123456789', 'Officially Enrolled', 'Cleared'),
('8250740', 'ARCENAL, SHAIRA MAE', 'BSIT', 2, 'BSIT 2-B', 'BLK_BSIT-2B_DAY', 'arcenal.shaira@ctu.edu.ph', '09172345678', 'Officially Enrolled', 'Cleared'),
('8260236', 'ALAJID, WHELLA MAE MARIE', 'BSIT', 1, 'BSIT 1-A', 'BLK_BSIT-1A_DAY', 'alajid.whella@ctu.edu.ph', '09183456789', 'Officially Enrolled', 'Cleared'),

-- BSHM
('8250473', 'ALBURO, ROBERTSON', 'BSHM', 2, 'BSHM 2-A', 'BLK_BSHM-2A_DAY', 'alburo.robertson@ctu.edu.ph', '09194567890', 'Officially Enrolled', 'Cleared'),
('8261058', 'ABADILLA, CRYSLER JAY', 'BSHM', 1, 'BSHM 1-A', 'BLK_BSHM-1A_DAY', 'abadilla.crysler@ctu.edu.ph', '09205678901', 'Officially Enrolled', 'Cleared'),

-- BSIE
('8252960', 'ARRANCHADO, CARL JOSHUA', 'BSIE', 2, 'BSIE 2-A', 'BLK_BSIE-2A_DAY', 'arranchado.carl@ctu.edu.ph', '09216789012', 'Officially Enrolled', 'Cleared'),
('8261200', 'AGUIPO, COLYN', 'BSIE', 1, 'BSIE 1-A', 'BLK_BSIE-1A_DAY', 'aguipo.colyn@ctu.edu.ph', '09227890123', 'Officially Enrolled', 'Cleared'),

-- BEED
('8250260', 'ARCENAL, MEA KYLA', 'BEED', 2, 'BEED 2-A', 'BLK_BEED-2A_DAY', 'arcenal.mea@ctu.edu.ph', '09238901234', 'Officially Enrolled', 'Cleared'),
('8260898', 'AUMAN, VANESSA', 'BEED', 1, 'BEED 1-A', 'BLK_BEED-1A_DAY', 'auman.vanessa@ctu.edu.ph', '09249012345', 'Officially Enrolled', 'Cleared'),

-- BSED
('8250693', 'AUMAN, ARVIE', 'BSED', 2, 'BSED 2-A', 'BLK_BSED-2A_DAY', 'auman.arvie@ctu.edu.ph', '09250123456', 'Officially Enrolled', 'Cleared'),
('8240537', 'AMODIA, HONEYLYN', 'BSED', 3, 'BSED 3-A', 'BLK_BSED-3A_DAY', 'amodia.honeylyn@ctu.edu.ph', '09261234567', 'Officially Enrolled', 'Cleared'),

-- BTLED
('8250529', 'AMODIA, KYLA', 'BTLED', 2, 'BTLED 2-A', 'BLK_BTLED-2A_DAY', 'amodia.kyla@ctu.edu.ph', '09272345678', 'Officially Enrolled', 'Cleared'),
('8230056', 'ARREGLADO, IVAN KET', 'BTLED', 4, 'BTLED 4-A', 'BLK_BTLED-4A_DAY', 'arreglado.ivan@ctu.edu.ph', '09283456789', 'Officially Enrolled', 'Cleared'),

-- BSF
('8260980', 'ARRIESGADO, JUN LLOYD', 'BSF', 1, 'BSF 1-A', 'BLK_BSF-1A_DAY', 'arriesgado.jun@ctu.edu.ph', '09294567890', 'Officially Enrolled', 'Cleared'),
('8250654', 'AUMAN, IRENE', 'BSF', 2, 'BSF 2-A', 'BLK_BSF-2A_DAY', 'auman.irene@ctu.edu.ph', '09305678901', 'Officially Enrolled', 'Cleared'),

-- BIT-CT
('8261355', 'ATIENZA, RIAN', 'BIT-CT', 1, 'BIT-CT 1-A', 'BLK_BIT-CT-1A_DAY', 'atienza.rian@ctu.edu.ph', '09316789012', 'Officially Enrolled', 'Cleared'),
('8241011', 'ARMEAN, LEIKA', 'BIT-CT', 3, 'BIT-CT 3-A', 'BLK_BIT-CT-3A_DAY', 'armean.leika@ctu.edu.ph', '09327890123', 'Officially Enrolled', 'Cleared'),

-- BIT-ET
('8260513', 'ABINA, JOHN LLOYD', 'BIT-ET', 1, 'BIT-ET 1-A', 'BLK_BIT-ET-1A_DAY', 'abina.john@ctu.edu.ph', '09338901234', 'Officially Enrolled', 'Cleared'),
('8251277', 'ARRABIS, KYLE CHRISTIAN', 'BIT-ET', 2, 'BIT-ET 2-A', 'BLK_BIT-ET-2A_DAY', 'arrabis.kyle@ctu.edu.ph', '09349012345', 'Officially Enrolled', 'Cleared'),

-- BIT-AT
('8260622', 'BACOLOD, JOHN MICHAEL', 'BIT-AT', 1, 'BIT-AT 1-A', 'BLK_BIT-AT-1A_DAY', 'bacolod.john@ctu.edu.ph', '09350123456', 'Officially Enrolled', 'Cleared'),
('8240871', 'ABADILLA, CLINT JOHN', 'BIT-AT', 3, 'BIT-AT 3-A', 'BLK_BIT-AT-3A_DAY', 'abadilla.clint@ctu.edu.ph', '09361234567', 'Officially Enrolled', 'Cleared');


-- Step 5: Insert Prioritized Curriculum Subjects for COR
INSERT INTO mis_curriculum_subjects (program_code, year_level, semester, section_code, subject_code, description, unit, time, day, room) VALUES
-- BSIT Year 2 (Real 10 CTU Subjects from Official Document!)
('BSIT', 2, '1st Semester', 'CO379', 'MS31', 'MILITARY SCIENCE 31', 3.00, '08:00AM-12:00PM', 'Sat', 'FIELD'),
('BSIT', 2, '1st Semester', 'CO58', 'GEC-E', 'ETHICS', 3.00, '11:00AM-12:00PM', 'M', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO59', 'GEE-ES', 'ENVIRONMENTAL SCIENCE', 3.00, '01:00PM-02:00PM', 'Tue', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO60', 'GEC-LWR', 'LIFE AND WORKS OF RIZAL', 3.00, '11:00AM-12:00PM', 'Tue', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO61', 'PC 212', 'QUANTITATIVE METHODS (MODELING & SIMULATION)', 3.00, '10:00AM-11:00AM', 'M', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO62', 'CC 214', 'DATA STRUCTURES AND ALGORITHMS (LEC)', 2.00, '08:00AM-10:00AM', 'M', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO63', 'CC 214L', 'DATA STRUCTURES AND ALGORITHMS (LAB)', 3.00, '08:00AM-11:00AM', 'TueWTh', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO64', 'P ELEC 1', 'OBJECT - ORIENTED PROGRAMMING', 3.00, '01:00PM-03:00PM', 'M', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO65', 'P ELEC 2', 'WEB SYSTEMS AND TECHNOLOGIES', 3.00, '03:00PM-04:00PM', 'MWF', 'ROOM 10'),
('BSIT', 2, '1st Semester', 'CO66', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS 3: DANCE/SPORTS', 2.00, '03:00PM-04:00PM', 'M', 'ROOM 10'),

-- BSIT Year 1
('BSIT', 1, '1st Semester', 'CO101', 'CC 101', 'INTRODUCTION TO COMPUTING', 3.00, '08:00AM-10:00AM', 'MWF', 'LAB 1'),
('BSIT', 1, '1st Semester', 'CO102', 'CC 102', 'FUNDAMENTALS OF PROGRAMMING', 3.00, '10:00AM-12:00PM', 'TTH', 'LAB 2'),
('BSIT', 1, '1st Semester', 'CO103', 'GE 101', 'UNDERSTANDING THE SELF', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 201'),
('BSIT', 1, '1st Semester', 'CO104', 'MATH 101', 'MATHEMATICS IN THE MODERN WORLD', 3.00, '02:30PM-04:00PM', 'TTH', 'ROOM 202'),
('BSIT', 1, '1st Semester', 'CO105', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BSIT', 1, '1st Semester', 'CO106', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSHM Year 1
('BSHM', 1, '1st Semester', 'HM101', 'HM 111', 'INTRODUCTION TO HOSPITALITY MANAGEMENT', 3.00, '08:00AM-09:30AM', 'MWF', 'HM RM 1'),
('BSHM', 1, '1st Semester', 'HM102', 'HM 112', 'KITCHEN ESSENTIALS AND BASIC FOOD PREPARATION', 3.00, '09:30AM-12:30PM', 'TTH', 'KITCHEN LAB'),
('BSHM', 1, '1st Semester', 'HM103', 'GE 101', 'UNDERSTANDING THE SELF', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 101'),
('BSHM', 1, '1st Semester', 'HM104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BSHM', 1, '1st Semester', 'HM105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSHM Year 2
('BSHM', 2, '1st Semester', 'HM201', 'HM 211', 'FOOD AND BEVERAGE SERVICE OPERATIONS', 3.00, '08:00AM-11:00AM', 'M', 'F&B LAB'),
('BSHM', 2, '1st Semester', 'HM202', 'HM 212', 'FRONT OFFICE OPERATIONS AND MANAGEMENT', 3.00, '01:00PM-03:00PM', 'Tue', 'HOTEL SUITE'),
('BSHM', 2, '1st Semester', 'HM203', 'HM 213', 'HOUSEKEEPING OPERATIONS', 3.00, '08:00AM-10:00AM', 'W', 'HOTEL SUITE'),
('BSHM', 2, '1st Semester', 'HM204', 'HM 214', 'SANITATION, HYGIENE, AND SAFETY IN HOSPITALITY', 3.00, '10:00AM-12:00PM', 'Th', 'HM RM 2'),
('BSHM', 2, '1st Semester', 'HM205', 'GEC-E', 'ETHICS', 3.00, '01:00PM-02:00PM', 'MWF', 'ROOM 102'),
('BSHM', 2, '1st Semester', 'HM206', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSIE Year 1
('BSIE', 1, '1st Semester', 'IE101', 'IE 111', 'INTRODUCTION TO INDUSTRIAL ENGINEERING', 2.00, '08:00AM-10:00AM', 'M', 'ENG 101'),
('BSIE', 1, '1st Semester', 'IE102', 'ENG 101', 'ENGINEERING DRAWING AND CAD', 3.00, '10:00AM-01:00PM', 'Tue', 'CAD LAB'),
('BSIE', 1, '1st Semester', 'IE103', 'MATH 111', 'CALCULUS 1 (DIFFERENTIAL CALCULUS)', 4.00, '01:00PM-03:00PM', 'MW', 'ENG 102'),
('BSIE', 1, '1st Semester', 'IE104', 'CHEM 101', 'CHEMISTRY FOR ENGINEERS', 4.00, '08:00AM-11:00AM', 'Th', 'CHEM LAB'),
('BSIE', 1, '1st Semester', 'IE105', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BSIE', 1, '1st Semester', 'IE106', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSIE Year 2
('BSIE', 2, '1st Semester', 'IE201', 'IE 211', 'WORK STUDY AND MEASUREMENT', 3.00, '08:00AM-10:00AM', 'MW', 'IE LAB 1'),
('BSIE', 2, '1st Semester', 'IE202', 'IE 212', 'ADVANCED ENGINEERING MATHEMATICS', 3.00, '10:00AM-11:30AM', 'TTH', 'ENG 201'),
('BSIE', 2, '1st Semester', 'IE203', 'IE 213', 'STATISTICAL ANALYSIS FOR INDUSTRIAL ENGINEERING', 3.00, '01:00PM-02:30PM', 'MW', 'IE LAB 2'),
('BSIE', 2, '1st Semester', 'IE204', 'IE 214', 'MANUFACTURING PROCESSES AND SYSTEMS', 3.00, '02:30PM-04:30PM', 'TTH', 'WORKSHOP 1'),
('BSIE', 2, '1st Semester', 'IE205', 'GEC-E', 'ETHICS', 3.00, '11:00AM-12:00PM', 'MWF', 'ENG 103'),
('BSIE', 2, '1st Semester', 'IE206', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BEED Year 1
('BEED', 1, '1st Semester', 'ED101', 'ED 111', 'THE CHILD AND ADOLESCENT LEARNERS', 3.00, '08:00AM-09:30AM', 'MWF', 'COED 101'),
('BEED', 1, '1st Semester', 'ED102', 'ED 112', 'FOUNDATIONS OF SPECIAL AND INCLUSIVE EDUCATION', 3.00, '09:30AM-11:00AM', 'TTH', 'COED 102'),
('BEED', 1, '1st Semester', 'ED103', 'GE 101', 'UNDERSTANDING THE SELF', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 203'),
('BEED', 1, '1st Semester', 'ED104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BEED', 1, '1st Semester', 'ED105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BEED Year 2
('BEED', 2, '1st Semester', 'ED201', 'EED 211', 'TEACHING SCIENCE IN THE ELEMENTARY GRADES', 3.00, '08:00AM-09:30AM', 'MWF', 'COED 201'),
('BEED', 2, '1st Semester', 'ED202', 'EED 212', 'TEACHING MATHEMATICS IN THE PRIMARY GRADES', 3.00, '09:30AM-11:00AM', 'TTH', 'COED 202'),
('BEED', 2, '1st Semester', 'ED203', 'EED 213', 'TEACHING SOCIAL STUDIES IN ELEMENTARY GRADES', 3.00, '01:00PM-02:30PM', 'MWF', 'COED 203'),
('BEED', 2, '1st Semester', 'ED204', 'ED 201', 'ASSESSMENT IN LEARNING 1', 3.00, '02:30PM-04:00PM', 'TTH', 'COED 204'),
('BEED', 2, '1st Semester', 'ED205', 'GEC-E', 'ETHICS', 3.00, '11:00AM-12:00PM', 'MWF', 'ROOM 104'),
('BEED', 2, '1st Semester', 'ED206', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSED Year 2
('BSED', 2, '1st Semester', 'SED201', 'MATH 211', 'CALCULUS WITH ANALYTIC GEOMETRY 1', 4.00, '08:00AM-10:00AM', 'MW', 'COED 301'),
('BSED', 2, '1st Semester', 'SED202', 'MATH 212', 'NUMBER THEORY', 3.00, '10:00AM-11:30AM', 'TTH', 'COED 302'),
('BSED', 2, '1st Semester', 'SED203', 'MATH 213', 'MATHEMATICAL INVESTIGATION AND MODELLING', 3.00, '01:00PM-02:30PM', 'MWF', 'COED 303'),
('BSED', 2, '1st Semester', 'SED204', 'ED 201', 'ASSESSMENT IN LEARNING 1', 3.00, '02:30PM-04:00PM', 'TTH', 'COED 204'),
('BSED', 2, '1st Semester', 'SED205', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSED Year 3
('BSED', 3, '1st Semester', 'SED301', 'MATH 311', 'ABSTRACT ALGEBRA', 3.00, '08:00AM-09:30AM', 'MWF', 'COED 304'),
('BSED', 3, '1st Semester', 'SED302', 'MATH 312', 'ADVANCED CALCULUS', 3.00, '10:00AM-11:30AM', 'TTH', 'COED 305'),
('BSED', 3, '1st Semester', 'SED303', 'MATH 313', 'MODERN GEOMETRY', 3.00, '01:00PM-02:30PM', 'MWF', 'COED 306'),
('BSED', 3, '1st Semester', 'SED304', 'ED 301', 'THE TEACHER AND THE COMMUNITY', 3.00, '02:30PM-04:00PM', 'TTH', 'COED 307'),
('BSED', 3, '1st Semester', 'SED305', 'ED 302', 'FIELD STUDY 1 (OBSERVATIONS)', 3.00, '08:00AM-11:00AM', 'Fri', 'LAB SCHOOL'),

-- BTLED Year 2
('BTLED', 2, '1st Semester', 'TLE201', 'TLE 211', 'MEAL MANAGEMENT AND NUTRITION', 3.00, '08:00AM-11:00AM', 'M', 'HE LAB 1'),
('BTLED', 2, '1st Semester', 'TLE202', 'TLE 212', 'CLOTHING CONSTRUCTION AND DESIGN', 3.00, '01:00PM-04:00PM', 'Tue', 'SEWING LAB'),
('BTLED', 2, '1st Semester', 'TLE203', 'TLE 213', 'HOME AND FAMILY LIVING', 3.00, '08:00AM-10:00AM', 'W', 'HE RM 2'),
('BTLED', 2, '1st Semester', 'TLE204', 'ED 201', 'ASSESSMENT IN LEARNING 1', 3.00, '10:00AM-11:30AM', 'TTH', 'COED 204'),
('BTLED', 2, '1st Semester', 'TLE205', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BTLED Year 4
('BTLED', 4, '1st Semester', 'TLE401', 'TLE 411', 'PRACTICE TEACHING AND INTERNSHIP', 6.00, '08:00AM-05:00PM', 'MTWThF', 'PRACTICE SCHOOL'),
('BTLED', 4, '1st Semester', 'TLE402', 'TLE 412', 'SEMINAR IN SPECIAL TOPICS IN HOME ECONOMICS', 3.00, '08:00AM-11:00AM', 'Sat', 'HE RM 1'),
('BTLED', 4, '1st Semester', 'TLE403', 'TLE 413', 'VOCATIONAL AND OCCUPATIONAL GUIDANCE', 3.00, '01:00PM-04:00PM', 'Sat', 'HE RM 2'),

-- BSF Year 1
('BSF', 1, '1st Semester', 'FSH101', 'FISH 111', 'INTRODUCTION TO FISHERIES SCIENCE', 3.00, '08:00AM-10:00AM', 'MW', 'FISH LAB 1'),
('BSF', 1, '1st Semester', 'FSH102', 'FISH 112', 'ICHTHYOLOGY AND FISH BIOLOGY', 3.00, '10:00AM-12:00PM', 'TTH', 'FISH LAB 2'),
('BSF', 1, '1st Semester', 'FSH103', 'CHEM 101', 'GENERAL INORGANIC CHEMISTRY', 4.00, '01:00PM-04:00PM', 'M', 'CHEM LAB'),
('BSF', 1, '1st Semester', 'FSH104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BSF', 1, '1st Semester', 'FSH105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BSF Year 2
('BSF', 2, '1st Semester', 'FSH201', 'FISH 211', 'AQUACULTURE PRINCIPLES AND PRACTICES', 3.00, '08:00AM-11:00AM', 'MW', 'AQUA LAB'),
('BSF', 2, '1st Semester', 'FSH202', 'FISH 212', 'AQUATIC ECOLOGY AND WATER QUALITY', 3.00, '01:00PM-03:00PM', 'TTH', 'FISH LAB 1'),
('BSF', 2, '1st Semester', 'FSH203', 'GEC-E', 'ETHICS', 3.00, '10:00AM-11:00AM', 'MWF', 'ROOM 105'),
('BSF', 2, '1st Semester', 'FSH204', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BIT-CT Year 1
('BIT-CT', 1, '1st Semester', 'CT101', 'CT 111', 'COMPUTER HARDWARE FUNDAMENTALS', 3.00, '08:00AM-10:00AM', 'MWF', 'HARDWARE LAB'),
('BIT-CT', 1, '1st Semester', 'CT102', 'CT 112', 'BASIC ELECTRONICS FOR COMPUTER TECHNOLOGY', 3.00, '10:00AM-12:00PM', 'TTH', 'ELEC LAB 1'),
('BIT-CT', 1, '1st Semester', 'CT103', 'MATH 101', 'MATHEMATICS IN THE MODERN WORLD', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 205'),
('BIT-CT', 1, '1st Semester', 'CT104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BIT-CT', 1, '1st Semester', 'CT105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BIT-CT Year 3
('BIT-CT', 3, '1st Semester', 'CT301', 'CT 311', 'NETWORK ADMINISTRATION AND SERVERS', 3.00, '08:00AM-11:00AM', 'MW', 'CISCO LAB'),
('BIT-CT', 3, '1st Semester', 'CT302', 'CT 312', 'EMBEDDED SYSTEMS AND IOT DESIGN', 3.00, '01:00PM-04:00PM', 'TTH', 'IOT LAB'),
('BIT-CT', 3, '1st Semester', 'CT303', 'CT 313', 'INDUSTRIAL COMPUTER INTERFACING', 3.00, '11:00AM-01:00PM', 'F', 'ROBOTICS LAB'),
('BIT-CT', 3, '1st Semester', 'CT304', 'IT 301', 'APPLIED RESEARCH AND TECHNOLOGY PROJECT 1', 3.00, '09:00AM-11:00AM', 'Sat', 'ROOM 301'),

-- BIT-ET Year 1
('BIT-ET', 1, '1st Semester', 'ET101', 'ET 111', 'DIRECT AND ALTERNATING CURRENT CIRCUITS', 3.00, '08:00AM-10:00AM', 'MWF', 'ELEC LAB 1'),
('BIT-ET', 1, '1st Semester', 'ET102', 'ET 112', 'ELECTRONICS TOOLS AND WORKSHOP PRACTICE', 3.00, '10:00AM-01:00PM', 'TTH', 'WORKSHOP 2'),
('BIT-ET', 1, '1st Semester', 'ET103', 'MATH 101', 'MATHEMATICS IN THE MODERN WORLD', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 205'),
('BIT-ET', 1, '1st Semester', 'ET104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BIT-ET', 1, '1st Semester', 'ET105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BIT-ET Year 2
('BIT-ET', 2, '1st Semester', 'ET201', 'ET 211', 'SOLID STATE DEVICES AND AMPLIFIERS', 3.00, '08:00AM-11:00AM', 'MW', 'ELEC LAB 2'),
('BIT-ET', 2, '1st Semester', 'ET202', 'ET 212', 'DIGITAL ELECTRONICS AND SWITCHING CIRCUITS', 3.00, '01:00PM-04:00PM', 'TTH', 'DIGITAL LAB'),
('BIT-ET', 2, '1st Semester', 'ET203', 'GEC-E', 'ETHICS', 3.00, '11:00AM-12:00PM', 'MWF', 'ROOM 106'),
('BIT-ET', 2, '1st Semester', 'ET204', 'PATHFIT 3', 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BIT-AT Year 1
('BIT-AT', 1, '1st Semester', 'AT101', 'AT 111', 'AUTOMOTIVE SHOP SAFETY AND BASIC HAND TOOLS', 3.00, '08:00AM-10:00AM', 'MWF', 'AUTO SHOP'),
('BIT-AT', 1, '1st Semester', 'AT102', 'AT 112', 'INTERNAL COMBUSTION ENGINES 1', 3.00, '10:00AM-01:00PM', 'TTH', 'AUTO SHOP'),
('BIT-AT', 1, '1st Semester', 'AT103', 'MATH 101', 'MATHEMATICS IN THE MODERN WORLD', 3.00, '01:00PM-02:30PM', 'MWF', 'ROOM 205'),
('BIT-AT', 1, '1st Semester', 'AT104', 'NSTP 1', 'NATIONAL SERVICE TRAINING PROGRAM 1', 3.00, '08:00AM-11:00AM', 'Sun', 'FIELD'),
('BIT-AT', 1, '1st Semester', 'AT105', 'PATHFIT 1', 'MOVEMENT ENHANCEMENT', 2.00, '03:00PM-05:00PM', 'Fri', 'GYM'),

-- BIT-AT Year 3
('BIT-AT', 3, '1st Semester', 'AT301', 'AT 311', 'AUTOMOTIVE AIR CONDITIONING AND CLIMATE CONTROL', 3.00, '08:00AM-11:00AM', 'MW', 'AC SHOP'),
('BIT-AT', 3, '1st Semester', 'AT302', 'AT 312', 'ELECTRONIC FUEL INJECTION AND DIAGNOSTICS', 3.00, '01:00PM-04:00PM', 'TTH', 'SCAN LAB'),
('BIT-AT', 3, '1st Semester', 'AT303', 'AT 313', 'AUTOMATIC TRANSMISSIONS AND DRIVETRAIN', 3.00, '10:00AM-01:00PM', 'F', 'AUTO SHOP'),
('BIT-AT', 3, '1st Semester', 'AT304', 'IT 301', 'APPLIED RESEARCH AND TECHNOLOGY PROJECT 1', 3.00, '09:00AM-11:00AM', 'Sat', 'ROOM 301');

-- Step 6: Fee Assessment Structures (Standard CTU Schedule for ALL Students Across All Programs)
INSERT INTO mis_fee_structures (program_code, year_level, fee_name, amount) VALUES
-- Default Standard CTU Fee Schedule for 2nd Year (₱9,205.00 Total - Universal for All Degree Programs)
('ALL', 2, 'Tuition', 4200.00), ('ALL', 2, 'Athletics Fee', 200.00), ('ALL', 2, 'Computer Fee', 400.00),
('ALL', 2, 'Cultural Fee', 150.00), ('ALL', 2, 'Development Fee', 2815.00), ('ALL', 2, 'Guidance Fee', 90.00),
('ALL', 2, 'Laboratory Fee', 750.00), ('ALL', 2, 'Library Fee', 350.00), ('ALL', 2, 'Medical and Dental Fee', 200.00), ('ALL', 2, 'Registration Fee', 50.00),

-- Standard CTU Fee Schedule for 1st Year (₱8,655.00 Total - Universal for All Degree Programs)
('ALL', 1, 'Tuition', 3800.00), ('ALL', 1, 'Athletics Fee', 200.00), ('ALL', 1, 'Computer Fee', 400.00),
('ALL', 1, 'Cultural Fee', 150.00), ('ALL', 1, 'Development Fee', 2815.00), ('ALL', 1, 'Guidance Fee', 90.00),
('ALL', 1, 'Laboratory Fee', 600.00), ('ALL', 1, 'Library Fee', 350.00), ('ALL', 1, 'Medical and Dental Fee', 200.00), ('ALL', 1, 'Registration Fee', 50.00),

-- Standard CTU Fee Schedule for 3rd Year (₱9,205.00 Total - Universal for All Degree Programs)
('ALL', 3, 'Tuition', 4200.00), ('ALL', 3, 'Athletics Fee', 200.00), ('ALL', 3, 'Computer Fee', 400.00),
('ALL', 3, 'Cultural Fee', 150.00), ('ALL', 3, 'Development Fee', 2815.00), ('ALL', 3, 'Guidance Fee', 90.00),
('ALL', 3, 'Laboratory Fee', 750.00), ('ALL', 3, 'Library Fee', 350.00), ('ALL', 3, 'Medical and Dental Fee', 200.00), ('ALL', 3, 'Registration Fee', 50.00),

-- Standard CTU Fee Schedule for 4th Year (₱9,205.00 Total - Universal for All Degree Programs)
('ALL', 4, 'Tuition', 4200.00), ('ALL', 4, 'Athletics Fee', 200.00), ('ALL', 4, 'Computer Fee', 400.00),
('ALL', 4, 'Cultural Fee', 150.00), ('ALL', 4, 'Development Fee', 2815.00), ('ALL', 4, 'Guidance Fee', 90.00),
('ALL', 4, 'Laboratory Fee', 750.00), ('ALL', 4, 'Library Fee', 350.00), ('ALL', 4, 'Medical and Dental Fee', 200.00), ('ALL', 4, 'Registration Fee', 50.00);
