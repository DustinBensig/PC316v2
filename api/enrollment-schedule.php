<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $database = application_database();
    $query = $database->prepare(
        'SELECT start_date
         FROM enrollment_schedules
         WHERE status = ? AND start_date >= CURRENT_DATE
         ORDER BY start_date, schedule_id
         LIMIT 1'
    );
    $query->execute(['Active']);
    $nextDate = $query->fetchColumn();
    echo json_encode([
        'success' => true,
        'nextEnrollmentDate' => $nextDate ?: null,
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('Public enrollment schedule lookup failed: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'nextEnrollmentDate' => null,
    ], JSON_UNESCAPED_SLASHES);
}
