<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/admin/database.php';

if (
    $argc !== 3 ||
    !preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $argv[1]) ||
    !preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $argv[2])
) {
    fwrite(STDERR, "Usage: php database/change-admin-username.php current-username new-username\n");
    exit(1);
}

$currentUsername = $argv[1];
$newUsername = $argv[2];
if (strcasecmp($currentUsername, $newUsername) === 0) {
    fwrite(STDERR, "The new username must be different from the current username.\n");
    exit(1);
}

try {
    $database = admin_database();
    $update = $database->prepare(
        'UPDATE users AS u
         INNER JOIN admins AS a ON a.user_id = u.id
         INNER JOIN roles AS r ON r.id = a.role_id
         SET u.username = ?
         WHERE u.username = ?
           AND u.account_type = \'admin\'
           AND u.is_active = 1
           AND a.is_active = 1
           AND a.deactivated_at IS NULL
           AND a.department_id IS NULL
           AND r.role_key = \'SHARED_ADMIN\''
    );
    $update->execute([$newUsername, $currentUsername]);
    if ($update->rowCount() !== 1) {
        throw new RuntimeException('No active shared administrator account matched that username.');
    }

    fwrite(STDOUT, "Updated the shared admin username to '{$newUsername}'.\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Username update failed: ' . $error->getMessage() . "\n");
    exit(1);
}
