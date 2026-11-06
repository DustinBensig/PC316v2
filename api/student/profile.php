<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
student_verify_csrf();
$request = student_read_json();

$email = strtolower(trim(is_string($request['email'] ?? null) ? $request['email'] : ''));
$phone = trim(is_string($request['contactNumber'] ?? null) ? $request['contactNumber'] : '');
if (
    (array_key_exists('campus', $request) && $request['campus'] !== 'Daanbantayan Campus') ||
    array_key_exists('campusId', $request) ||
    array_key_exists('campus_id', $request) ||
    array_key_exists('yearLevel', $request) ||
    array_key_exists('assignedWeek', $request) ||
    array_key_exists('studentId', $request)
) {
    student_campus_access_denied();
}
if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190 ||
    ($phone !== '' && (strlen($phone) > 32 || !preg_match('/\A[\d\s+-]{7,32}\z/', $phone)))
) {
    student_json_response(['success' => false, 'message' => 'Enter a valid email address and contact number.'], 400);
}

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    $duplicate = $database->prepare('SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1');
    $duplicate->execute([$email, (int)$profile['user_id']]);
    if ($duplicate->fetchColumn()) {
        student_json_response(['success' => false, 'message' => 'This email address is already registered.'], 409);
    }

    $update = $database->prepare('UPDATE users SET email = ?, phone = ? WHERE id = ?');
    $update->execute([$email, $phone !== '' ? $phone : null, (int)$profile['user_id']]);
    $profile['email'] = $email;
    $profile['phone'] = $phone;
    student_json_response([
        'success' => true,
        'profile' => student_public_profile($profile),
        'message' => 'Contact information updated successfully.',
    ]);
} catch (Throwable $error) {
    error_log('Student profile update failed: ' . $error->getMessage());
    if ($error instanceof PDOException && $error->getCode() === '23000') {
        student_json_response(['success' => false, 'message' => 'This email address is already registered.'], 409);
    }
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'The contact information could not be updated.'], $error),
        503
    );
}
