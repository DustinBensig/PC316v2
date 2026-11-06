<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
$request = student_read_json();

$studentNumber = trim(is_string($request['studentId'] ?? null) ? $request['studentId'] : '');
$firstName = trim(is_string($request['firstName'] ?? null) ? $request['firstName'] : '');
$middleName = trim(is_string($request['middleName'] ?? null) ? $request['middleName'] : '');
$lastName = trim(is_string($request['lastName'] ?? null) ? $request['lastName'] : '');
$email = strtolower(trim(is_string($request['email'] ?? null) ? $request['email'] : ''));
$phone = trim(is_string($request['phone'] ?? null) ? $request['phone'] : '');
$program = trim(is_string($request['program'] ?? null) ? $request['program'] : '');
$yearLevel = $request['yearLevel'] ?? null;
$password = $request['password'] ?? null;
$confirmPassword = $request['confirmPassword'] ?? null;
$yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

if (
    (array_key_exists('campus', $request) && $request['campus'] !== 'Daanbantayan Campus') ||
    array_key_exists('campusId', $request) ||
    array_key_exists('campus_id', $request)
) {
    student_campus_access_denied();
}
if (!preg_match('/\A824[0-9]{4}\z/', $studentNumber)) {
    student_json_response([
        'success' => false,
        'message' => 'Invalid Student ID. Please enter a valid CTU Daanbantayan Campus Student ID.',
    ], 400);
}
if (
    $firstName === '' || strlen($firstName) > 100 ||
    $middleName === '' || strlen($middleName) > 100 ||
    $lastName === '' || strlen($lastName) > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 ||
    !preg_match('/\A[\d\s()+-]{7,32}\z/', $phone) ||
    $program === '' || strlen($program) > 150
) {
    student_json_response(['success' => false, 'message' => 'Complete all required student details with valid values.'], 400);
}
if (!is_string($yearLevel) || !in_array($yearLevel, $yearLevels, true)) {
    student_json_response(['success' => false, 'message' => 'Please select a valid year level.'], 400);
}
if (
    !is_string($password) || strlen($password) < 8 || strlen($password) > 72 ||
    !is_string($confirmPassword) || !hash_equals($password, $confirmPassword)
) {
    student_json_response([
        'success' => false,
        'message' => !is_string($password) || strlen($password) < 8 || strlen($password) > 72
            ? 'Enter a password of 8 to 72 characters.'
            : 'Passwords do not match.',
    ], 400);
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

    $campusQuery = $database->prepare(
        'SELECT campus_id FROM campuses WHERE campus_name = ? LIMIT 1'
    );
    $campusQuery->execute(['Daanbantayan Campus']);
    $campusId = $campusQuery->fetchColumn();
    $departmentQuery = $database->prepare(
        'SELECT id FROM departments WHERE department_code = ? LIMIT 1'
    );
    $departmentQuery->execute(['CodeTech']);
    $departmentId = $departmentQuery->fetchColumn();
    if (!$campusId || !$departmentId) {
        throw new RuntimeException('Student registration campus or department is not configured.');
    }

    $existingId = $database->prepare('SELECT 1 FROM students WHERE student_number = ? LIMIT 1');
    $existingId->execute([$studentNumber]);
    if ($existingId->fetchColumn()) {
        student_json_response(['success' => false, 'message' => 'This Student ID is already registered.'], 409);
    }
    $existingEmail = $database->prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1');
    $existingEmail->execute([$email]);
    if ($existingEmail->fetchColumn()) {
        student_json_response(['success' => false, 'message' => 'This email address is already registered.'], 409);
    }

    $database->beginTransaction();
    $userQuery = $database->prepare(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone, account_type)
         VALUES (?, ?, ?, ?, ?, \'student\')'
    );
    $userQuery->execute([
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName,
        $phone,
    ]);
    $userId = (int)$database->lastInsertId();
    $studentQuery = $database->prepare(
        'INSERT INTO students
          (user_id, student_number, middle_name, program, year_level, campus_id,
           student_status, department_id, academic_status)
         VALUES (?, ?, ?, ?, ?, ?, \'Active\', ?, \'active\')'
    );
    $studentQuery->execute([
        $userId,
        $studentNumber,
        $middleName,
        $program,
        $yearLevel,
        (int)$campusId,
        (int)$departmentId,
    ]);
    $database->commit();
    auth_rate_limit_clear($database, 'student-register', $email);

    student_json_response([
        'success' => true,
        'studentId' => $studentNumber,
        'message' => 'Account created successfully.',
    ], 201);
} catch (Throwable $error) {
    if (isset($database) && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Student registration failed: ' . $error->getMessage());
    if ($error instanceof PDOException && $error->getCode() === '23000') {
        $detail = (string)($error->errorInfo[2] ?? '');
        $message = str_contains($detail, 'student_number') || str_contains($detail, 'students_number')
            ? 'This Student ID is already registered.'
            : 'This email address is already registered.';
        student_json_response(['success' => false, 'message' => $message], 409);
    }
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'The registration service is unavailable.'], $error),
        503
    );
}
