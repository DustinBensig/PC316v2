<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
$request = student_read_json();
$loginId = trim(is_string($request['loginId'] ?? null) ? $request['loginId'] : '');
$password = $request['password'] ?? null;
if ($loginId === '' || strlen($loginId) > 190 || !is_string($password) || strlen($password) > 72) {
    student_json_response(['success' => false, 'message' => 'Enter your email or student number and password.'], 400);
}

try {
    $database = admin_database();
    $retryAfter = auth_rate_limit_retry_after($database, 'student-login', $loginId);
    if ($retryAfter > 0) {
        header('Retry-After: ' . $retryAfter);
        student_json_response([
            'success' => false,
            'message' => "Too many sign-in attempts. Try again in {$retryAfter} seconds.",
            'retryAfter' => $retryAfter,
        ], 429);
    }
    $query = $database->prepare(
        'SELECT u.id, u.password_hash, campuses.campus_name, s.student_status
         FROM users AS u
         INNER JOIN students AS s ON s.user_id = u.id
         LEFT JOIN campuses ON campuses.campus_id = s.campus_id
         WHERE (u.email = ? OR s.student_number = ?)
           AND u.account_type = \'student\' AND u.is_active = 1
         LIMIT 1'
    );
    $query->execute([$loginId, $loginId]);
    $account = $query->fetch();
    if (!$account || !password_verify($password, $account['password_hash'])) {
        auth_rate_limit_record_attempt($database, 'student-login', $loginId);
        student_json_response(['success' => false, 'message' => 'The email/student number or password is incorrect.'], 401);
    }
    if (($account['student_status'] ?? '') !== 'Active') {
        student_json_response(['success' => false, 'message' => 'Your student account is currently inactive. Please contact the registrar.'], 403);
    }
    if ($account['campus_name'] !== 'Daanbantayan Campus') {
        student_campus_access_denied();
    }

    auth_rate_limit_clear($database, 'student-login', $loginId);
    $passwordHash = $account['password_hash'];
    if (password_needs_rehash($passwordHash, PASSWORD_DEFAULT)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    }
    $update = $database->prepare('UPDATE users SET password_hash = ?, last_login_at = NOW() WHERE id = ?');
    $update->execute([$passwordHash, (int)$account['id']]);
    session_regenerate_id(true);
    $_SESSION['student_user_id'] = (int)$account['id'];
    $_SESSION['student_last_activity'] = time();
    $_SESSION['student_csrf_token'] = bin2hex(random_bytes(32));

    $profile = student_profile($database, (int)$account['id']);
    if (!$profile) {
        unset($_SESSION['student_user_id']);
        student_json_response(['success' => false, 'message' => 'The student account is not available.'], 403);
    }
    student_json_response([
        'success' => true,
        'profile' => student_public_profile($profile),
        'csrfToken' => $_SESSION['student_csrf_token'],
    ]);
} catch (Throwable $error) {
    error_log('Student login failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'The sign-in service is unavailable.'], $error),
        503
    );
}
