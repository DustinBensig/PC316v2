<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
start_admin_session();
require_http_method('GET');

try {
    $database = admin_database();
    $admin = current_admin($database);
    if (!$admin && isset($_SESSION['admin_user_id'])) {
        unset($_SESSION['admin_user_id'], $_SESSION['admin_password_fingerprint']);
        session_regenerate_id(true);
    }

    admin_json_response([
        'success' => true,
        'authenticated' => $admin !== null,
        'csrf_token' => $_SESSION['admin_csrf_token'],
    ]);
} catch (Throwable $error) {
    error_log('Admin session check failed: ' . $error->getMessage());
    admin_json_response(['success' => false, 'message' => 'The sign-in service is unavailable.'], 503);
}
