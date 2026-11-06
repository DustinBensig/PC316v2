<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('GET');

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    student_json_response([
        'success' => true,
        'profile' => student_public_profile($profile),
        'csrfToken' => $_SESSION['student_csrf_token'],
    ]);
} catch (Throwable $error) {
    error_log('Student session lookup failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'The student session service is unavailable.'], $error),
        503
    );
}
