-- Normalize existing students.year_level values to the canonical format:
-- '1st Year', '2nd Year', '3rd Year', '4th Year'
USE enrollment_system;

UPDATE students
SET year_level = CASE
  WHEN LOWER(TRIM(year_level)) IN ('1st year', 'first year', '1st', 'first') THEN '1st Year'
  WHEN LOWER(TRIM(year_level)) IN ('2nd year', 'second year', '2nd', 'second') THEN '2nd Year'
  WHEN LOWER(TRIM(year_level)) IN ('3rd year', 'third year', '3rd', 'third') THEN '3rd Year'
  WHEN LOWER(TRIM(year_level)) IN ('4th year', 'fourth year', '4th', 'fourth') THEN '4th Year'
  ELSE year_level
END
WHERE year_level IS NOT NULL;
