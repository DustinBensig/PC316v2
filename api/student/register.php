<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
$request = student_read_json();

$name = trim(is_string($request['name'] ?? null) ? $request['name'] : '');
$email = strtolower(trim(is_string($request['email'] ?? null) ? $request['email'] : ''));
$phone = trim(is_string($request['phone'] ?? null) ? $request['phone'] : '');
$program = trim(is_string($request['program'] ?? null) ? $request['program'] : '');
$password = $request['password'] ?? null;
$nameParts = preg_split('/\s+/', $name, 2) ?: [];

if (count($nameParts) !== 2) {
    student_json_response(['success' => false, 'message' => 'Enter your first name and last name.'], 400);
}
if (
    strlen($nameParts[0]) > 100 || strlen($nameParts[1]) > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 || strlen($phone) > 32 ||
    $program === '' || strlen($program) > 150 ||
    !is_string($password) || strlen($password) < 8 || strlen($password) > 72
) {
    student_json_response(['success' => false, 'message' => 'Enter valid student details and a password of 8 to 72 characters.'], 400);
}
if (
    array_key_exists('confirmPassword', $request) &&
    (!is_string($request['confirmPassword']) || !is_string($password) ||
        !hash_equals($password, $request['confirmPassword']))
) {
    student_json_response(['success' => false, 'message' => 'Passwords do not match.'], 400);
}

try {
    $database = admin_database();
    $retryAfter = auth_rate_limit_retry_after($database, 'student-register', $email);
    if ($retryAfter > 0) {
        header('Retry-After: ' . $retryAfter);
        student_json_response([
            'success' => false,
            'message' => "Too many registration attempts. Try again in {$retryAfter} seconds.",
            'retryAfter' => $retryAfter,
        ], 429);
    }
    auth_rate_limit_record_attempt($database, 'student-register', $email);
    $departmentQuery = $database->prepare('SELECT id FROM departments WHERE department_code = ? LIMIT 1');
    $departmentQuery->execute(['CodeTech']);
    $departmentId = $departmentQuery->fetchColumn();
    if (!$departmentId) {
        throw new RuntimeException('Student registration department is not configured.');
    }

    $database->beginTransaction();
    $userQuery = $database->prepare(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone, account_type)
         VALUES (?, ?, ?, ?, ?, \'student\')'
    );
    $userQuery->execute([
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $nameParts[0],
        $nameParts[1],
        $phone ?: null,
    ]);
    $userId = (int)$database->lastInsertId();
    $studentQuery = $database->prepare(
        'INSERT INTO students (user_id, student_number, program, year_level, department_id, academic_status)
         VALUES (?, NULL, ?, NULL, ?, \'applicant\')'
    );
    $studentQuery->execute([$userId, $program, (int)$departmentId]);
    $studentId = (int)$database->lastInsertId();
    if ($studentId < 8240000 || $studentId > 8249999) {
        throw new RuntimeException('The seven-digit student ID range is exhausted or not configured. Apply the enrollment database migration.');
    }
    $assignNumber = $database->prepare('UPDATE students SET student_number = ? WHERE id = ?');
    $assignNumber->execute([(string)$studentId, $studentId]);
    $database->commit();
    student_json_response([
        'success' => true,
        'studentId' => (string)$studentId,
        'message' => 'Account created. Your Student ID is ' . $studentId . '. Your year level, student status, and enrollment records must be verified before an enrollment appointment can be booked.',
    ], 201);
} catch (Throwable $error) {
    if (isset($database) && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Student registration failed: ' . $error->getMessage());
    $duplicate = $error instanceof PDOException && $error->getCode() === '23000';
    $payload = [
        'success' => false,
        'message' => $duplicate
            ? 'That student number or email is already registered.'
            : 'The registration service is unavailable.',
    ];
    if (!$duplicate) {
        $payload = student_debug_error_detail($payload, $error);
    }
    student_json_response($payload, $duplicate ? 409 : 503);
}