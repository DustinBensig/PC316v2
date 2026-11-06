<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/database.php';
require_once __DIR__ . '/../rate-limit.php';
require_once dirname(__DIR__) . '/enrollment-booking.php';

function student_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '1800');
    session_name('ENROLLEASE_STUDENT');
    $https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    if (
        isset($_SESSION['student_user_id'], $_SESSION['student_last_activity']) &&
        time() - (int)$_SESSION['student_last_activity'] > 1800
    ) {
        unset($_SESSION['student_user_id'], $_SESSION['student_last_activity']);
        session_regenerate_id(true);
    }
    if (isset($_SESSION['student_user_id'])) {
        $_SESSION['student_last_activity'] = time();
    }

    if (!isset($_SESSION['student_csrf_token'])) {
        $_SESSION['student_csrf_token'] = bin2hex(random_bytes(32));
    }
}

function student_debug_enabled(): bool
{
    $configurationPath = dirname(__DIR__, 2) . '/config/app.php';
    if (!is_file($configurationPath)) {
        return false;
    }

    $configuration = require $configurationPath;
    return is_array($configuration) && ($configuration['debug'] ?? false) === true;
}

function student_debug_error_detail(array $payload, Throwable $error): array
{
    if (student_debug_enabled()) {
        $payload['detail'] = $error->getMessage();
    }
    return $payload;
}

function student_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function student_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        student_json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
    }
}

function student_verify_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return;
    }
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $expected = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '');
    if (!hash_equals($expected, $origin)) {
        student_json_response(['success' => false, 'message' => 'Request could not be verified.'], 403);
    }
}

function student_verify_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $known = $_SESSION['student_csrf_token'] ?? '';
    if (!is_string($token) || !is_string($known) || $known === '' || !hash_equals($known, $token)) {
        student_json_response(['success' => false, 'message' => 'Request could not be verified.'], 403);
    }
}

function student_read_json(): array
{
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 8192) {
        student_json_response(['success' => false, 'message' => 'Request is too large.'], 413);
    }
    $data = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($data)) {
        student_json_response(['success' => false, 'message' => 'Invalid request.'], 400);
    }
    return $data;
}

function student_profile(PDO $database, int $userId): ?array
{
    $query = $database->prepare(
        'SELECT u.id AS user_id, u.email, u.first_name, u.last_name, u.is_active,
                s.id AS student_id, s.student_number, s.program, s.year_level,
                s.academic_status
         FROM users AS u
         INNER JOIN students AS s ON s.user_id = u.id
         WHERE u.id = ? AND u.account_type = \'student\' AND u.is_active = 1
         LIMIT 1'
    );
    $query->execute([$userId]);
    $profile = $query->fetch();
    return $profile ?: null;
}

function student_public_profile(array $profile): array
{
    return [
        'name' => trim($profile['first_name'] . ' ' . $profile['last_name']),
        'sid' => $profile['student_number'],
        'email' => $profile['email'],
        'program' => $profile['program'],
        'year' => $profile['year_level'] ?: '',
        'yearLevel' => $profile['year_level'] ?: '',
        'status' => $profile['academic_status'],
    ];
}

function student_require_profile(PDO $database): array
{
    $userId = filter_var($_SESSION['student_user_id'] ?? null, FILTER_VALIDATE_INT);
    $profile = $userId ? student_profile($database, (int)$userId) : null;
    if (!$profile) {
        student_json_response(['success' => false, 'message' => 'Student sign-in is required.'], 401);
    }
    return $profile;
}

function student_send_appointment_email(array $profile, array $appointment, string $event): bool
{
    $autoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        throw new RuntimeException('PHPMailer is not installed. Run Composer install for this project.');
    }
    require_once $autoload;
    $configuration = require dirname(__DIR__, 2) . '/config/mail.php';
    if (
        $configuration['host'] === '' ||
        $configuration['username'] === '' ||
        $configuration['password'] === '' ||
        !filter_var($configuration['from_email'], FILTER_VALIDATE_EMAIL) ||
        !filter_var($profile['email'], FILTER_VALIDATE_EMAIL)
    ) {
        throw new RuntimeException('SMTP configuration or the student email address is incomplete.');
    }

    $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mailer->isSMTP();
    $mailer->Host = $configuration['host'];
    $mailer->SMTPAuth = true;
    $mailer->Username = $configuration['username'];
    $mailer->Password = $configuration['password'];
    $mailer->Port = $configuration['port'];
    $mailer->SMTPSecure = $configuration['port'] === 465
        ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mailer->CharSet = 'UTF-8';
    $mailer->setFrom($configuration['from_email'], $configuration['from_name']);
    $mailer->addAddress($profile['email'], trim($profile['first_name'] . ' ' . $profile['last_name']));
    $mailer->isHTML(false);

    $date = date('F j, Y', strtotime($appointment['scheduled_at']));
    $time = date('g:i A', strtotime($appointment['scheduled_at']));
    $weekStart = $appointment['week_start'] ?? $appointment['schedule_start'] ?? '';
    $weekEnd = $appointment['week_end'] ?? $appointment['schedule_end'] ?? '';
    $week = $weekStart !== '' && $weekEnd !== ''
        ? date('F j', strtotime($weekStart)) . '–' . date('F j, Y', strtotime($weekEnd))
        : 'Week ' . (enrollment_year_assignment((string)($profile['year_level'] ?? ''))['week_number'] ?? '—');
    $mailer->Subject = 'Enrollment Appointment ' . ucfirst($event);
    $mailer->Body = "Hello " . $profile['first_name'] . " " . $profile['last_name'] . ",\n\n";
    $mailer->Body .= "Your enrollment appointment has been {$event}.\n\n";
    $mailer->Body .= "Student name: " . $profile['first_name'] . " " . $profile['last_name'] . "\n";
    $mailer->Body .= "Student ID: " . $profile['student_number'] . "\n";
    $mailer->Body .= "Year level: " . ($profile['year_level'] ?? '—') . "\n";
    $mailer->Body .= "Enrollment week: {$week}\n";
    $mailer->Body .= "Appointment date: {$date}\nAppointment time: {$time}\n";
    $mailer->Body .= "Reference number: " . $appointment['reference_number'] . "\n\n";
    $mailer->Body .= "Please arrive 15 minutes early and bring your verified enrollment documents and student ID.\n";
    return $mailer->send();
}
