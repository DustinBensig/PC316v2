<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
start_admin_session();

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    admin_json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $database = admin_database();
    $admin = require_admin_api($database);
    require_admin_permission($database, $admin, 'students.update');

    if ($method === 'GET') {
        // 1. Allowed academic statuses
        $ruleStmt = $database->prepare('SELECT rule_key, is_enabled, rule_value FROM enrollment_eligibility_rules WHERE rule_key = ? LIMIT 1');
        $ruleStmt->execute(['student_status']);
        $ruleRow = $ruleStmt->fetch();
        $allowedStatuses = [];
        if ($ruleRow && $ruleRow['rule_value']) {
            $allowedStatuses = json_decode($ruleRow['rule_value'], true) ?: [];
        }

        // 2. Document types
        $docStmt = $database->query('SELECT id, document_name, is_required, is_active FROM enrollment_document_types ORDER BY id ASC');
        $docTypes = array_map(static fn(array $r): array => [
            'id' => (int)$r['id'],
            'name' => $r['document_name'],
            'isRequired' => (bool)$r['is_required'],
            'isActive' => (bool)$r['is_active'],
        ], $docStmt->fetchAll());

        admin_json_response([
            'success' => true,
            'allowedStatuses' => $allowedStatuses,
            'allStatuses' => ['applicant', 'active', 'inactive', 'graduated', 'dropped', 'suspended', 'enrolling', 'enrolled'],
            'documentTypes' => $docTypes,
        ]);
    }

    // POST
    verify_request_origin();
    $request = read_json_request();
    verify_csrf_token($request['csrf_token'] ?? null);

    $action = trim((string)($request['action'] ?? ''));

    // 7c: Update allowed academic statuses
    if ($action === 'update_allowed_statuses') {
        $statuses = $request['statuses'] ?? null;
        if (!is_array($statuses)) {
            admin_json_response(['success' => false, 'message' => 'Provide a list of allowed statuses.'], 400);
        }

        $allValid = ['applicant', 'active', 'inactive', 'graduated', 'dropped', 'suspended', 'enrolling', 'enrolled'];
        $clean = [];
        foreach ($statuses as $s) {
            $sLower = strtolower(trim((string)$s));
            if (in_array($sLower, $allValid, true) && !in_array($sLower, $clean, true)) {
                $clean[] = $sLower;
            }
        }

        if (count($clean) === 0) {
            admin_json_response(['success' => false, 'message' => 'At least one student status must be allowed for enrollment.'], 400);
        }

        $database->beginTransaction();
        $update = $database->prepare(
            'UPDATE enrollment_eligibility_rules
             SET rule_value = ?, is_enabled = 1
             WHERE rule_key = \'student_status\''
        );
        $update->execute([json_encode($clean, JSON_UNESCAPED_SLASHES)]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'eligibility_rule.statuses_updated\', \'eligibility_rule\', NULL, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            json_encode(['allowed_statuses' => $clean], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        admin_json_response(['success' => true, 'message' => 'Allowed enrollment academic statuses updated successfully.']);
    }

    // 7b: Document Types Management
    if ($action === 'add_document_type') {
        $name = trim((string)($request['name'] ?? ''));
        $isRequired = !empty($request['isRequired']);

        if ($name === '' || strlen($name) > 180) {
            admin_json_response(['success' => false, 'message' => 'Document name is required (max 180 characters).'], 400);
        }

        $dupCheck = $database->prepare('SELECT 1 FROM enrollment_document_types WHERE document_name = ? LIMIT 1');
        $dupCheck->execute([$name]);
        if ($dupCheck->fetchColumn()) {
            admin_json_response(['success' => false, 'message' => 'A document type with this name already exists.'], 409);
        }

        $database->beginTransaction();
        $insert = $database->prepare(
            'INSERT INTO enrollment_document_types (document_name, is_required, is_active)
             VALUES (?, ?, 1)'
        );
        $insert->execute([$name, $isRequired ? 1 : 0]);
        $newId = (int)$database->lastInsertId();

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'document_type.created\', \'document_type\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $newId,
            json_encode(['name' => $name, 'is_required' => $isRequired], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        admin_json_response(['success' => true, 'message' => "Added document type '{$name}'."]);
    }

    if ($action === 'rename_document_type') {
        $id = filter_var($request['id'] ?? null, FILTER_VALIDATE_INT);
        $name = trim((string)($request['name'] ?? ''));

        if (!$id) {
            admin_json_response(['success' => false, 'message' => 'Valid document type ID is required.'], 400);
        }
        if ($name === '' || strlen($name) > 180) {
            admin_json_response(['success' => false, 'message' => 'Document name is required (max 180 characters).'], 400);
        }

        $check = $database->prepare('SELECT document_name FROM enrollment_document_types WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        $oldName = $check->fetchColumn();
        if ($oldName === false) {
            admin_json_response(['success' => false, 'message' => 'Document type not found.'], 404);
        }

        $dupCheck = $database->prepare('SELECT 1 FROM enrollment_document_types WHERE document_name = ? AND id <> ? LIMIT 1');
        $dupCheck->execute([$name, $id]);
        if ($dupCheck->fetchColumn()) {
            admin_json_response(['success' => false, 'message' => 'Another document type already has this name.'], 409);
        }

        $database->beginTransaction();
        $update = $database->prepare('UPDATE enrollment_document_types SET document_name = ? WHERE id = ?');
        $update->execute([$name, $id]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'document_type.renamed\', \'document_type\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $id,
            json_encode(['old_name' => $oldName, 'new_name' => $name], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        admin_json_response(['success' => true, 'message' => "Renamed document type to '{$name}'."]);
    }

    if ($action === 'toggle_required_document_type') {
        $id = filter_var($request['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) {
            admin_json_response(['success' => false, 'message' => 'Valid document type ID is required.'], 400);
        }

        $check = $database->prepare('SELECT is_required, document_name FROM enrollment_document_types WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        $doc = $check->fetch();
        if (!$doc) {
            admin_json_response(['success' => false, 'message' => 'Document type not found.'], 404);
        }

        $newRequired = $doc['is_required'] ? 0 : 1;
        $database->beginTransaction();
        $update = $database->prepare('UPDATE enrollment_document_types SET is_required = ? WHERE id = ?');
        $update->execute([$newRequired, $id]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'document_type.toggle_required\', \'document_type\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $id,
            json_encode(['name' => $doc['document_name'], 'is_required' => (bool)$newRequired], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        $msg = $newRequired === 1 ? "marked as required" : "marked as optional";
        admin_json_response(['success' => true, 'message' => "Document type '{$doc['document_name']}' {$msg}."]);
    }

    if ($action === 'toggle_active_document_type') {
        $id = filter_var($request['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) {
            admin_json_response(['success' => false, 'message' => 'Valid document type ID is required.'], 400);
        }

        $check = $database->prepare('SELECT is_active, document_name FROM enrollment_document_types WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        $doc = $check->fetch();
        if (!$doc) {
            admin_json_response(['success' => false, 'message' => 'Document type not found.'], 404);
        }

        $newActive = $doc['is_active'] ? 0 : 1;
        $database->beginTransaction();
        // Deactivating must not delete student document rows!
        $update = $database->prepare('UPDATE enrollment_document_types SET is_active = ? WHERE id = ?');
        $update->execute([$newActive, $id]);

        $logStmt = $database->prepare(
            'INSERT INTO activity_logs (actor_user_id, actor_role_id, department_id, action_key, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, \'document_type.toggle_active\', \'document_type\', ?, ?, ?, ?)'
        );
        $logStmt->execute([
            (int)$admin['user_id'],
            (int)$admin['role_id'],
            $admin['department_id'],
            $id,
            json_encode(['name' => $doc['document_name'], 'is_active' => (bool)$newActive], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500) ?: null,
        ]);

        $database->commit();
        $msg = $newActive === 1 ? "activated" : "deactivated";
        admin_json_response(['success' => true, 'message' => "Document type '{$doc['document_name']}' {$msg}."]);
    }

    admin_json_response(['success' => false, 'message' => 'Unsupported action.'], 400);

} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Eligibility settings error: ' . $error->getMessage());
    admin_json_response(['success' => false, 'message' => 'Server error: ' . $error->getMessage()], 500);
}
