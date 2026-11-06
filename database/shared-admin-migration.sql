-- MySQL 8.0+. Run once against the existing enrollment_system database.
-- Keeps one active MIS account (if present) as the shared admin, disables
-- department-specific admin accounts, and retains their audit references.
USE enrollment_system;

INSERT INTO roles (role_key, role_name, description)
SELECT 'SHARED_ADMIN', 'System Administrator',
       'Single shared administrator account with full system access'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_key = 'SHARED_ADMIN'
);

INSERT IGNORE INTO role_permissions (role_id, permission_key)
SELECT shared_role.id, permission.permission_key
FROM roles AS shared_role
INNER JOIN roles AS mis_role ON mis_role.role_key = 'MIS'
INNER JOIN role_permissions AS permission ON permission.role_id = mis_role.id
WHERE shared_role.role_key = 'SHARED_ADMIN';

SET @shared_admin_id = (
  SELECT MIN(candidate.admin_id)
  FROM (
    SELECT a.id AS admin_id
    FROM admins AS a
    INNER JOIN roles AS r ON r.id = a.role_id
    INNER JOIN users AS u ON u.id = a.user_id
    WHERE r.role_key = 'MIS'
      AND a.department_id IS NULL
      AND a.is_active = 1
      AND a.deactivated_at IS NULL
      AND u.account_type = 'admin'
      AND u.is_active = 1
  ) AS candidate
);

SET @shared_admin_user_id = (
  SELECT user_id FROM admins WHERE id = @shared_admin_id
);

UPDATE admins
SET is_active = 0,
    deactivated_at = COALESCE(deactivated_at, CURRENT_TIMESTAMP)
WHERE is_active = 1
  AND (@shared_admin_id IS NULL OR id <> @shared_admin_id);

UPDATE users AS u
INNER JOIN admins AS a ON a.user_id = u.id
SET u.is_active = 0
WHERE a.is_active = 0
  AND u.account_type = 'admin'
  AND u.id <> COALESCE(@shared_admin_user_id, 0);

UPDATE users
SET username = 'admin'
WHERE id = @shared_admin_user_id;

UPDATE admins
SET role_id = (SELECT id FROM roles WHERE role_key = 'SHARED_ADMIN' LIMIT 1)
WHERE id = @shared_admin_id;

-- If @shared_admin_id is NULL, create the first shared account after running
-- this migration with: php database/create-first-admin.php
