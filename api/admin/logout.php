<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
start_admin_session();
require_http_method('POST');
verify_request_origin();
verify_csrf_token($_POST['csrf_token'] ?? null);

$_SESSION = [];
$cookie = session_get_cookie_params();
if (ini_get('session.use_cookies')) {
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $cookie['path'],
        'domain' => $cookie['domain'],
        'secure' => $cookie['secure'],
        'httponly' => $cookie['httponly'],
        'samesite' => 'Lax',
    ]);
}
session_destroy();

header('Location: ../../admin-login/admin-login.html', true, 303);
exit;
