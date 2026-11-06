# EnrollEase

EnrollEase is a PHP/PDO and MySQL student enrollment appointment system. Its browser interface is served from the project directory; student and administrator actions are handled by PHP APIs.

## XAMPP setup

1. Put the project in `C:\xampp\htdocs\PC316v2`.
2. Start **Apache** and **MySQL** in the XAMPP Control Panel. This project is expected at `http://localhost:8888/PC316v2/`.
3. Configure the local database settings. Copy `config\database.example.php` to `config\database.php` if the local config is missing. Defaults are MySQL at `127.0.0.1:3306`, database `enrollment_system`, user `root`, and a blank password. The actual config is ignored by Git.
4. Open phpMyAdmin and import `database\schema.sql`. It creates/selects `enrollment_system` and creates the complete schema and example enrollment schedules. **Fresh setup = import `database/schema.sql` (creates `enrollment_system`), then optionally `database/enrollment_system.sql` for test students.** The fixture depends on the schema and must be imported second.
5. To re-import the fresh schema or its fixtures, first drop the existing `enrollment_system` database in phpMyAdmin, then repeat the import order. Do not import `database/enrollment-appointments-migration.sql` or `database/shared-admin-migration.sql` into a fresh database created from `schema.sql`.
6. For an existing database with the outdated student columns, back it up and inspect the existing `students.student_number` values. Run `database/migrations/20261106_align_student_registration_schema.sql` only after confirming all populated student numbers are seven digits beginning with `824`; the migration stops before alteration if it finds incompatible values. Apply `database/migrations/20261106_create_auth_rate_limits.sql` to an existing database to enable persistent login/registration rate limiting.
7. Open `http://localhost:8888/PC316v2/api/student/session.php` in a browser. Without a student session it should return JSON containing `"Student sign-in is required."`.
8. Create the shared administrator account from PowerShell:

   ```powershell
   $env:ADMIN_INITIAL_PASSWORD = 'replace-with-a-unique-strong-password'
   & 'C:\xampp\php\php.exe' database\create-first-admin.php
   Remove-Item Env:\ADMIN_INITIAL_PASSWORD
   ```

   Follow the prompts. The shared administrator signs in at `admin-login/admin-login.html`.

### Optional email support

Booking works without email; PHPMailer and SMTP are optional. If confirmation emails are wanted, copy `config\mail.example.php` to the ignored `config\mail.php`, run `composer install` from the project directory (or use `C:\xampp\php\php.exe C:\path\to\composer.phar install`), and configure the SMTP environment variables described in `ENROLLMENT-XAMPP-SETUP.md`. No SMTP credentials are required for booking.

### Optional local diagnostics

Copy `config\app.example.php` to the ignored `config\app.php` and set `debug` to `true` only on a local development instance. Student API 503 responses then include the caught exception message as a `detail` field. The default and production setting is `false`; never enable this on a public server.

## Local test accounts

Import `database/enrollment_system.sql` after `database/schema.sql`. All fixture accounts use the local-only password `Local-Enrollment-Test-2026!`.

| Student number | Expected eligibility result |
|---|---|
| `8240000` | Qualified; eligible for a booking when the assigned schedule is active. |
| `8240001` | Blocked by missing/incomplete grades (IT101 and IT312). |
| `8240002` | Blocked by an outstanding ₱3,500 balance. |
| `8240003` | Blocked by a missing required document and unresolved Transcript of Records requirement. |
| `8240004` | Blocked by an active enrollment hold. |

These are local test accounts only. Their `@example.com` addresses are placeholders.

For a locally registered student that needs to be made eligible for testing, edit the student number in the final `CALL` in `database/dev-make-student-eligible.sql` and import/run that script after `database/schema.sql`. It deliberately marks grades complete, zeroes local balances, releases enrollment holds, resolves blocking requirements, and verifies all required documents. It is local-testing-only and must never be run against production or shared data.

## Schedules and appointments

Year-level enrollment weeks and example appointment slots are seeded by `database/schema.sql`. Edit schedules through the shared administrator dashboard. Student booking rechecks eligibility, assigned-week dates, daily and slot capacity, and duplicate appointments in the PHP API.

Students can reschedule or cancel active enrollment appointments from **My Schedule**. Rescheduling rechecks eligibility, the assigned week, date/time availability, and capacity; both actions update appointment status history and record email notification results. Email remains optional.

Appointments are committed before email is attempted. A missing PHPMailer installation or SMTP configuration produces an explicit email warning, but does not undo a successful booking.

The shared administrator dashboard includes **Student eligibility records**. Search by student number or use **Edit eligibility** in the Students results to update year level, academic status, required subjects and grades, financial records, holds, enrollment requirements, and required-document statuses. Changes are saved in one transaction, written to `activity_logs`, and followed by a fresh eligibility check. The dashboard API requires the administrator session and CSRF token; only the shared administrator role is currently admitted.

Rate limiting uses the database-backed `auth_rate_limits` table in the fresh schema. For an existing database, apply `database/migrations/20261106_create_auth_rate_limits.sql`. Login and registration requests are limited by both the client IP address and the normalized login identifier; retry responses include a `Retry-After` header and `retryAfter` seconds.

The browser stores the student CSRF token and display-session key in `sessionStorage` only. Both keys are removed from `localStorage` and `sessionStorage` on any student API `401` response and on logout.
