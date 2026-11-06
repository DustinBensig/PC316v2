<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
start_admin_session();
require_http_method('POST');
verify_request_origin();

$request = read_json_request();
verify_csrf_token($request['csrf_token'] ?? null);

$usernameInput = $request['username'] ?? null;
$username = is_string($usernameInput) ? trim($usernameInput) : '';
$password = $request['password'] ?? null;

if (
    !preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $username) ||
    !is_string($password) ||
    strlen($password) > 72 ||
    $password === ''
) {
    admin_json_response(['success' => false, 'message' => 'Enter a valid username and password.'], 400);
}

try {
    $database = admin_database();
    $retryAfter = auth_rate_limit_retry_after($database, 'admin-login', $username);
    if ($retryAfter > 0) {
        header('Retry-After: ' . $retryAfter);
        admin_json_response([
            'success' => false,
            'message' => "Too many sign-in attempts. Try again in {$retryAfter} seconds.",
            'retryAfter' => $retryAfter,
        ], 429);
    }
    $statement = $database->prepare(
        'SELECT u.id AS user_id, u.username, u.password_hash,
                u.first_name, u.last_name, a.id AS admin_id,
                r.role_key, a.department_id, d.department_code
         FROM users AS u
         INNER JOIN admins AS a ON a.user_id = u.id
         INNER JOIN roles AS r ON r.id = a.role_id
         LEFT JOIN departments AS d ON d.id = a.department_id
         WHERE u.username = ?
           AND u.account_type = \'admin\'
           AND u.is_active = 1
           AND a.is_active = 1
           AND a.deactivated_at IS NULL
           AND r.role_key = \'SHARED_ADMIN\'
           AND a.department_id IS NULL
         LIMIT 1'
    );
    $statement->execute([$username]);
    $account = $statement->fetch();

    if (
        !$account ||
        !password_verify($password, $account['password_hash']) ||
        !admin_role_assignment_is_valid($account)
    ) {
        auth_rate_limit_record_attempt($database, 'admin-login', $username);
        admin_json_response([
            'success' => false,
            'message' => 'The username or password is incorrect.',
        ], 401);
    }

    auth_rate_limit_clear($database, 'admin-login', $username);
    $storedPasswordHash = $account['password_hash'];
    if (password_needs_rehash($storedPasswordHash, PASSWORD_DEFAULT)) {
        $storedPasswordHash = password_hash($password, PASSWORD_DEFAULT);
        $updated = $database->prepare(
            'UPDATE users SET password_hash = ?, last_login_at = NOW() WHERE id = ?'
        );
        $updated->execute([$storedPasswordHash, (int)$account['user_id']]);
    } else {
        $updated = $database->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
        $updated->execute([(int)$account['user_id']]);
    }

    session_regenerate_id(true);
    $_SESSION['admin_user_id'] = (int)$account['user_id'];
    $_SESSION['admin_password_fingerprint'] = hash('sha256', $storedPasswordHash);
    $_SESSION['admin_last_activity'] = time();
    $_SESSION['admin_csrf_token'] = bin2hex(random_bytes(32));

    admin_json_response([
        'success' => true,
        'admin' => [
            'name' => trim($account['first_name'] . ' ' . $account['last_name']),
            'username' => $account['username'],
        ],
    ]);
} catch (Throwable $error) {
    error_log('Admin login failed: ' . $error->getMessage());
    admin_json_response(['success' => false, 'message' => 'The sign-in service is unavailable.'], 503);
}
