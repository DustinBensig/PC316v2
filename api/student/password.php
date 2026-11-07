<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
student_verify_csrf();
$request = student_read_json();
$currentPassword = $request['currentPassword'] ?? null;
$newPassword = $request['newPassword'] ?? null;
if (
    !is_string($currentPassword) || strlen($currentPassword) > 72 ||
    !is_string($newPassword) || strlen($newPassword) < 8 || strlen($newPassword) > 72 ||
    !preg_match('/[A-Za-z]/', $newPassword) || !preg_match('/[0-9]/', $newPassword)
) {
    student_json_response(['success' => false, 'message' => 'Enter your current password and a new password between 8 and 72 characters containing at least one letter and one number.'], 400);
}

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    $query = $database->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $query->execute([(int)$profile['user_id']]);
    $hash = $query->fetchColumn();
    if (!$hash || !password_verify($currentPassword, $hash)) {
        student_json_response(['success' => false, 'message' => 'The current password is incorrect.'], 403);
    }

    $update = $database->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([password_hash($newPassword, PASSWORD_DEFAULT), (int)$profile['user_id']]);
    student_json_response(['success' => true, 'message' => 'Password updated successfully.']);
} catch (Throwable $error) {
    error_log('Student password update failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'The password could not be updated.'], $error),
        503
    );
}
