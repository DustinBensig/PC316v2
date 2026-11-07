<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
start_admin_session();

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    admin_json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

function admin_password_meets_policy(string $password): bool
{
    $len = strlen($password);
    return $len >= 8 && $len <= 72 && preg_match('/[A-Za-z]/', $password) === 1 && preg_match('/[0-9]/', $password) === 1;
}

try {
    $database = admin_database();
    $admin = require_admin_api($database);

    if ($method === 'GET') {
        require_admin_permission($database, $admin, 'admins.read');

        $stmt = $database->query(
            'SELECT a.id AS admin_id, a.user_id, u.username, u.email, u.first_name, u.last_name,
                    a.is_active, a.deactivated_at, a.created_at,
                    r.id AS role_id, r.role_key, r.role_name,
                    d.id AS department_id, d.department_code, d.department_name
             FROM admins AS a
             INNER JOIN users AS u ON u.id = a.user_id
             INNER JOIN roles AS r ON r.id = a.role_id
             LEFT JOIN departments AS d ON d.id = a.department_id
             ORDER BY a.id ASC'
        );
        $adminRows = $stmt->fetchAll();
        $adminsList = array_map(static fn(array $row): array => [
            'id' => (int)$row['admin_id'],
            'userId' => (int)$row['user_id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'firstName' => $row['first_name'],
            'lastName' => $row['last_name'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name']),
            'roleId' => (int)$row['role_id'],
            'roleKey' => $row['role_key'],
            'roleName' => $row['role_name'],
            'departmentId' => $row['department_id'] !== null ? (int)$row['department_id'] : null,
            'departmentCode' => $row['department_code'],
            'departmentName' => $row['department_name'],
            'isActive' => (bool)$row['is_active'],
            'deactivatedAt' => $row['deactivated_at'],
            'createdAt' => $row['created_at'],
            'isSharedAdmin' => $row['role_key'] === 'SHARED_ADMIN',
        ], $adminRows);

        $rolesStmt = $database->query('SELECT id, role_key, role_name, description FROM roles ORDER BY id ASC');
        $departmentsStmt = $database->query('SELECT id, department_code, department_name FROM departments WHERE is_active = 1 ORDER BY department_name ASC');

        admin_json_response([
            'success' => true,
            'admins' => $adminsList,
            'roles' => $rolesStmt->fetchAll(),
            'departments' => $departmentsStmt->fetchAll(),
        ]);
    }

    // POST request
    verify_request_origin();
    $request = read_json_request();
    verify_csrf_token($request['csrf_token'] ?? null);
    require_admin_permission($database, $admin, 'admins.write');

    $action = trim((string)($request['action'] ?? ''));

    if ($action === 'create') {
        $username = trim((string)($request['username'] ?? ''));
        $email = strtolower(trim((string)($request['email'] ?? '')));
        $firstName = trim((string)($request['firstName'] ?? ''));
        $lastName = trim((string)($request['lastName'] ?? ''));
        $password = (string)($request['password'] ?? '');
        $roleId = filter_var($request['roleId'] ?? null, FILTER_VALIDATE_INT);

        if (!preg_match('/\A[A-Za-z0-9._-]{3,64}\z/', $username)) {
            admin_json_response(['success' => false, 'message' => 'Username must be 3-64 characters using letters, numbers, dots, hyphens, or underscores.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
            admin_json_response(['success' => false, 'message' => 'Please provide a valid email address.'], 400);
        }
        if ($firstName === '' || strlen($firstName) > 100 || $lastName === '' || strlen($lastName) > 100) {
            admin_json_response(['success' => false, 'message' => 'First and last name are required (up to 100 characters each).'], 400);
        }
        if (!admin_password_meets_policy($password)) {
            admin_json_response(['success' => false, 'message' => 'Password must be 8-72 characters long and include at least one letter and one number.'], 400);
        }
        if (!$roleId) {
            admin_json_response(['success' => false, 'message' => 'Please select a valid administrator role.'], 400);
        }

        $roleQuery = $database->prepare('SELECT id, role_key, role_name FROM roles WHERE id = ? LIMIT 1');
        $roleQuery->execute([$roleId]);
        $targetRole = $roleQuery->fetch();
        if (!$targetRole) {
            admin_json_response(['success' => false, 'message' => 'The selected role does not exist.'], 404);
        }

        if ($targetRole['role_key'] === 'SHARED_ADMIN') {
            admin_json_response(['success' => false, 'message' => 'Only one shared administrator account is permitted.'], 400);
        }

        // Determine department based on role
        $departmentId = null;
        if (!in_array($targetRole['role_key'], ['SHARED_ADMIN', 'MIS'], true)) {
            $departmentByRole = [
                'SSG_ADMIN' => 'SSG',
                'CODETECH_ADMIN' => 'CodeTech',
                'COED_ADMIN' => 'COED',
                'HM_ADMIN' => 'HM',
                'BIT_ADMIN' => 'BIT',
                'REGISTRAR_ADMIN' => 'Registrar',
                'CLINIC_ADMIN' => 'Clinic',
                'CASHIER_ADMIN' => 'Cashier',
                'GUIDANCE_ADMIN' => 'Guidance',
            ];
            $expectedDeptCode = $departmentByRole[$targetRole['role_key']] ?? null;
            if ($expectedDeptCode) {
                $deptQuery = $database->prepare('SELECT id FROM departments WHERE department_code = ? LIMIT 1');
                $deptQuery->execute([$expectedDeptCode]);
                $departmentId = $deptQuery->fetchColumn();
                if (!$departmentId) {
                    admin_json_response(['success' => false, 'message' => "Matching department {$expectedDeptCode} not found."], 400);
                }
                $departmentId = (int)$departmentId;
            }
        }

        // Check uniqueness of username and email
        $checkStmt = $database->prepare('SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1');
        $checkStmt->execute([$username, $email]);
        if ($checkStmt->fetchColumn()) {
            admin_json_response(['success' => false, 'message' => 'An account with that username or email already exists.'], 409);
        }

        $database->beginTransaction();
        $userInsert = $database->prepare(
            'INSERT INTO users (username, email, password_hash, first_name, last_name, account_type, is_active)
             VALUES (?, ?, ?, ?, ?, \'admin\', 1)'
        );
        $userInsert->execute([
            $username,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $firstName,
            $lastName,
        ]);
        $newUserId = (int)$database->lastInsertId();

        $adminInsert = $database->prepare(
            'INSERT INTO admins (user_id, role_id, department_id, created_by, is_active)
             VALUES (?, ?, ?, ?, 1)'
        );
        $adminInsert->execute([
            $newUserId,
            (int)$targetRole['id'],
            $departmentId,
            (int)$admin['admin_id'],
        ]);
        $newAdminId = (int)$database->lastInsertId();

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'admin.created\', \'admin\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $newAdminId,
            json_encode([
                'username' => $username,
                'email' => $email,
                'role' => $targetRole['role_key'],
                'departmentId' => $departmentId,
            ], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        admin_json_response(['success' => true, 'message' => "Created admin account '{$username}'."]);
    }

    if ($action === 'toggle_status') {
        $targetAdminId = filter_var($request['adminId'] ?? null, FILTER_VALIDATE_INT);
        if (!$targetAdminId) {
            admin_json_response(['success' => false, 'message' => 'Please provide a valid admin ID.'], 400);
        }

        $targetQuery = $database->prepare(
            'SELECT a.id, a.user_id, a.is_active, r.role_key, u.username
             FROM admins AS a
             INNER JOIN users AS u ON u.id = a.user_id
             INNER JOIN roles AS r ON r.id = a.role_id
             WHERE a.id = ? LIMIT 1 FOR UPDATE'
        );
        $database->beginTransaction();
        $targetQuery->execute([$targetAdminId]);
        $target = $targetQuery->fetch();
        if (!$target) {
            $database->rollBack();
            admin_json_response(['success' => false, 'message' => 'Administrator account not found.'], 404);
        }

        if ($target['role_key'] === 'SHARED_ADMIN') {
            $database->rollBack();
            admin_json_response(['success' => false, 'message' => 'The shared administrator cannot be deactivated or deleted.'], 403);
        }

        $newActive = $target['is_active'] ? 0 : 1;
        $deactivatedAt = $newActive === 1 ? null : date('Y-m-d H:i:s');

        $updateAdmin = $database->prepare('UPDATE admins SET is_active = ?, deactivated_at = ? WHERE id = ?');
        $updateAdmin->execute([$newActive, $deactivatedAt, $targetAdminId]);

        $updateUser = $database->prepare('UPDATE users SET is_active = ? WHERE id = ?');
        $updateUser->execute([$newActive, (int)$target['user_id']]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, \'admin\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $newActive === 1 ? 'admin.activated' : 'admin.deactivated',
            $targetAdminId,
            json_encode(['username' => $target['username'], 'status' => $newActive === 1 ? 'active' : 'inactive'], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        $statusText = $newActive === 1 ? 'activated' : 'deactivated';
        admin_json_response(['success' => true, 'message' => "Administrator account '{$target['username']}' {$statusText}."]);
    }

    if ($action === 'reset_password') {
        $targetAdminId = filter_var($request['adminId'] ?? null, FILTER_VALIDATE_INT);
        $newPassword = (string)($request['newPassword'] ?? '');

        if (!$targetAdminId) {
            admin_json_response(['success' => false, 'message' => 'Please provide a valid admin ID.'], 400);
        }
        if (!admin_password_meets_policy($newPassword)) {
            admin_json_response(['success' => false, 'message' => 'Password must be 8-72 characters long and include at least one letter and one number.'], 400);
        }

        $database->beginTransaction();
        $targetQuery = $database->prepare(
            'SELECT a.id, a.user_id, u.username
             FROM admins AS a
             INNER JOIN users AS u ON u.id = a.user_id
             WHERE a.id = ? LIMIT 1 FOR UPDATE'
        );
        $targetQuery->execute([$targetAdminId]);
        $target = $targetQuery->fetch();
        if (!$target) {
            $database->rollBack();
            admin_json_response(['success' => false, 'message' => 'Administrator account not found.'], 404);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateUser = $database->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $updateUser->execute([$newHash, (int)$target['user_id']]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'admin.password_reset\', \'admin\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $targetAdminId,
            json_encode(['username' => $target['username']], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        admin_json_response(['success' => true, 'message' => "Password reset successfully for '{$target['username']}'."]);
    }

    admin_json_response(['success' => false, 'message' => 'Unsupported action.'], 400);

} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Admin accounts management error: ' . $error->getMessage());
    admin_json_response(['success' => false, 'message' => 'An unexpected server error occurred: ' . $error->getMessage()], 500);
}
