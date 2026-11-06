<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/admin/database.php';

if ($argc !== 2 || !preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $argv[1])) {
    fwrite(STDERR, "Usage: php database/change-admin-password.php admin-username\n");
    exit(1);
}

$username = $argv[1];
$password = getenv('ADMIN_NEW_PASSWORD');
putenv('ADMIN_NEW_PASSWORD');
if (!is_string($password) || strlen($password) < 12 || strlen($password) > 72) {
    fwrite(STDERR, "Set ADMIN_NEW_PASSWORD to a 12-72 byte password, then run this command again.\n");
    exit(1);
}

try {
    $database = admin_database();
    $update = $database->prepare(
        'UPDATE users AS u
         INNER JOIN admins AS a ON a.user_id = u.id
         INNER JOIN roles AS r ON r.id = a.role_id
         SET u.password_hash = ?
         WHERE u.username = ?
           AND u.account_type = \'admin\'
           AND u.is_active = 1
           AND a.is_active = 1
           AND a.deactivated_at IS NULL
           AND a.department_id IS NULL
           AND r.role_key = \'SHARED_ADMIN\''
    );
    $update->execute([password_hash($password, PASSWORD_DEFAULT), $username]);
    if ($update->rowCount() !== 1) {
        throw new RuntimeException('No active shared administrator account matched that username.');
    }
    fwrite(STDOUT, "Updated the password for '{$username}'.\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Password update failed: ' . $error->getMessage() . "\n");
    exit(1);
} finally {
    unset($password);
}
