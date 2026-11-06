<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/admin/database.php';

if (
    $argc !== 3 ||
    !filter_var($argv[1], FILTER_VALIDATE_EMAIL) ||
    !filter_var($argv[2], FILTER_VALIDATE_EMAIL) ||
    strlen($argv[2]) > 190
) {
    fwrite(STDERR, "Usage: php database/change-admin-email.php current@example.edu new@example.edu\n");
    exit(1);
}

$currentEmail = strtolower($argv[1]);
$newEmail = strtolower($argv[2]);

try {
    $database = admin_database();
    $update = $database->prepare(
        'UPDATE users AS u
         INNER JOIN admins AS a ON a.user_id = u.id
         INNER JOIN roles AS r ON r.id = a.role_id
         SET u.email = ?
         WHERE u.email = ?
           AND u.account_type = \'admin\'
           AND u.is_active = 1
           AND a.is_active = 1
           AND a.deactivated_at IS NULL
           AND a.department_id IS NULL
           AND r.role_key = \'SHARED_ADMIN\''
    );
    $update->execute([$newEmail, $currentEmail]);
    if ($update->rowCount() !== 1) {
        throw new RuntimeException('No active administrator account matched that email, or the email was unchanged.');
    }
    fwrite(STDOUT, "Updated the administrator email to {$newEmail}.\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Email update failed: ' . $error->getMessage() . "\n");
    exit(1);
}
