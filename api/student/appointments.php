<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('GET');

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    $query = $database->prepare(
        'SELECT a.reference_number, a.scheduled_at, st.status_name
         FROM appointments AS a
         INNER JOIN appointment_status AS st ON st.id = a.appointment_status_id
         WHERE a.student_id = ? AND a.appointment_type = \'Enrollment Appointment\'
         ORDER BY a.scheduled_at DESC, a.id DESC'
    );
    $query->execute([(int)$profile['student_id']]);
    $appointments = array_map(static function (array $row): array {
        return [
            'referenceNumber' => $row['reference_number'],
            'date' => substr($row['scheduled_at'], 0, 10),
            'time' => date('g:i A', strtotime($row['scheduled_at'])),
            'status' => $row['status_name'],
        ];
    }, $query->fetchAll());
    student_json_response(['success' => true, 'appointments' => $appointments]);
} catch (Throwable $error) {
    error_log('Student appointments lookup failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(['success' => false, 'message' => 'Your enrollment appointments could not be loaded.'], $error),
        503
    );
}
