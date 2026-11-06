<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/admin/database.php';

function prompt(string $label): string
{
    fwrite(STDOUT, $label);
    return trim((string)fgets(STDIN));
}

$username = prompt('Shared administrator username: ');
$email = strtolower(prompt('Administrator email: '));
$firstName = prompt('First name: ');
$lastName = prompt('Last name: ');
$password = getenv('ADMIN_INITIAL_PASSWORD');
putenv('ADMIN_INITIAL_PASSWORD');

if (
    !preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $username) ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 190 ||
    $firstName === '' ||
    strlen($firstName) > 100 ||
    $lastName === '' ||
    strlen($lastName) > 100 ||
    !is_string($password) ||
    strlen($password) < 12 ||
    strlen($password) > 72
) {
    fwrite(STDERR, "Invalid account details. Use a 3-64 character username (letters, numbers, dot, underscore, hyphen), a valid email, and set ADMIN_INITIAL_PASSWORD to a 12-72 byte password.\n");
    exit(1);
}

try {
    $database = admin_database();
    $lockQuery = $database->prepare('SELECT GET_LOCK(?, 10)');
    $lockQuery->execute(['enrollease_shared_admin_setup']);
    $lock = $lockQuery->fetchColumn();
    if ((int)$lock !== 1) {
        throw new RuntimeException('Could not lock administrator setup. Try again.');
    }

    $roleQuery = $database->prepare('SELECT id FROM roles WHERE role_key = ? LIMIT 1');
    $roleQuery->execute(['SHARED_ADMIN']);
    $roleId = $roleQuery->fetchColumn();
    if (!$roleId) {
        throw new RuntimeException('The shared administrator role is missing. Apply database/schema.sql or database/shared-admin-migration.sql first.');
    }

    $exists = $database->prepare('SELECT 1 FROM admins WHERE is_active = ? LIMIT 1');
    $exists->execute([1]);
    if ($exists->fetchColumn()) {
        throw new RuntimeException('An active admin account already exists. Use the shared-admin migration to consolidate existing accounts.');
    }

    $database->beginTransaction();
    $insertUser = $database->prepare(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, account_type)
         VALUES (?, ?, ?, ?, ?, \'admin\')'
    );
    $insertUser->execute([
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName,
    ]);
    $userId = (int)$database->lastInsertId();

    $insertAdmin = $database->prepare(
        'INSERT INTO admins (user_id, role_id, department_id, is_active)
         VALUES (?, ?, NULL, 1)'
    );
    $insertAdmin->execute([$userId, (int)$roleId]);
    $database->commit();

    fwrite(STDOUT, "Created the shared admin account '{$username}'.\n");
} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    fwrite(STDERR, 'Administrator creation failed: ' . $error->getMessage() . "\n");
    exit(1);
} finally {
    if (isset($database) && $database instanceof PDO) {
        $releaseLock = $database->prepare('SELECT RELEASE_LOCK(?)');
        $releaseLock->execute(['enrollease_shared_admin_setup']);
    }
    unset($password);
}
