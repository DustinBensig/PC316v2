<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../enrollment-eligibility.php';
student_session_start();
student_require_method('GET');

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    $result = enrollment_eligibility($database, (int)$profile['student_id']);
    $schedule = enrollment_schedule_for_student($database, (string)$profile['year_level']);
    student_json_response([
        'success' => true,
        'student' => student_public_profile($profile),
        'eligibility' => $result,
        'schedule' => $schedule,
    ]);
} catch (Throwable $error) {
    error_log('Enrollment eligibility check failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'Eligibility records could not be checked. Please try again later.'], $error),
        503
    );
}
