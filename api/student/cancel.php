<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
student_session_start();
student_require_method('POST');
student_verify_origin();
student_verify_csrf();

$request = student_read_json();
$referenceNumber = trim(is_string($request['referenceNumber'] ?? null) ? $request['referenceNumber'] : '');
if ($referenceNumber === '' || strlen($referenceNumber) > 40) {
    student_json_response(['success' => false, 'message' => 'Select a valid enrollment appointment.'], 400);
}

try {
    $database = admin_database();
    $profile = student_require_profile($database);
    $database->beginTransaction();

    $studentLock = $database->prepare('SELECT id FROM students WHERE id = ? AND user_id = ? FOR UPDATE');
    $studentLock->execute([(int)$profile['student_id'], (int)$profile['user_id']]);
    if (!$studentLock->fetchColumn()) {
        $database->rollBack();
        student_json_response(['success' => false, 'message' => 'The student record could not be verified.'], 403);
    }

    $appointmentQuery = $database->prepare(
        'SELECT a.id, a.reference_number, a.scheduled_at, a.appointment_status_id,
                statuses.status_code
         FROM appointments AS a
         INNER JOIN appointment_status AS statuses ON statuses.id = a.appointment_status_id
         WHERE a.student_id = ? AND a.reference_number = ?
           AND a.appointment_type = \'Enrollment Appointment\'
         LIMIT 1'
    );
    $appointmentQuery->execute([(int)$profile['student_id'], $referenceNumber]);
    $appointment = $appointmentQuery->fetch();
    $activeStatuses = ['submitted', 'pending', 'approved', 'confirmed', 'rescheduled'];
    if (!$appointment || !in_array($appointment['status_code'], $activeStatuses, true)) {
        $database->rollBack();
        student_json_response(['success' => false, 'message' => 'That active appointment could not be found.'], 404);
    }

    $appointmentId = (int)$appointment['id'];
    $originalScheduledAt = (string)$appointment['scheduled_at'];
    $originalDate = substr($originalScheduledAt, 0, 10);
    enrollment_lock_schedule_days($database, (string)$profile['year_level'], [$originalDate]);

    $appointmentLock = $database->prepare(
        'SELECT a.id, a.scheduled_at, a.appointment_status_id, statuses.status_code
         FROM appointments AS a
         INNER JOIN appointment_status AS statuses ON statuses.id = a.appointment_status_id
         WHERE a.id = ? AND a.student_id = ? AND a.reference_number = ?
         LIMIT 1 FOR UPDATE'
    );
    $appointmentLock->execute([$appointmentId, (int)$profile['student_id'], $referenceNumber]);
    $lockedAppointment = $appointmentLock->fetch();
    if (
        !$lockedAppointment ||
        $lockedAppointment['scheduled_at'] !== $originalScheduledAt ||
        !in_array($lockedAppointment['status_code'], $activeStatuses, true)
    ) {
        $database->rollBack();
        student_json_response(['success' => false, 'message' => 'The appointment changed. Reload your schedule and try again.'], 409);
    }

    $statusQuery = $database->prepare('SELECT id FROM appointment_status WHERE status_code = ? LIMIT 1');
    $statusQuery->execute(['cancelled']);
    $cancelledStatusId = $statusQuery->fetchColumn();
    if (!$cancelledStatusId) {
        throw new RuntimeException('The cancelled appointment status is not configured.');
    }

    $update = $database->prepare(
        'UPDATE appointments
         SET appointment_status_id = ?, updated_by = ?
         WHERE id = ? AND student_id = ?'
    );
    $update->execute([
        (int)$cancelledStatusId,
        (int)$profile['user_id'],
        $appointmentId,
        (int)$profile['student_id'],
    ]);
    $history = $database->prepare(
        'INSERT INTO appointment_status_history (appointment_id, from_status_id, to_status_id, changed_by, note)
         VALUES (?, ?, ?, ?, ?)'
    );
    $history->execute([
        $appointmentId,
        (int)$lockedAppointment['appointment_status_id'],
        (int)$cancelledStatusId,
        (int)$profile['user_id'],
        'Cancelled by student.',
    ]);
    $notification = $database->prepare(
        'INSERT INTO notifications
         (user_id, appointment_id, notification_type, subject, message, delivery_channel, delivery_status)
         VALUES (?, ?, \'enrollment_appointment_cancelled\', ?, ?, \'email\', \'queued\')'
    );
    $notification->execute([
        (int)$profile['user_id'],
        $appointmentId,
        'Enrollment appointment cancelled',
        'Enrollment appointment cancelled; email delivery is pending.',
    ]);
    $notificationId = (int)$database->lastInsertId();
    $database->commit();

    $cancelledAppointment = [
        'reference_number' => $referenceNumber,
        'scheduled_at' => $originalScheduledAt,
    ];
    $emailSent = false;
    if (student_mail_is_configured()) {
        try {
            $emailSent = student_send_appointment_email($profile, $cancelledAppointment, 'cancelled');
            $message = $emailSent
                ? 'Enrollment appointment cancelled. A confirmation email was sent.'
                : 'Enrollment appointment cancelled, but the confirmation email could not be sent. Please contact the registrar.';
        } catch (Throwable $error) {
            error_log('Enrollment appointment was cancelled but notification email failed: ' . $error->getMessage());
            $emailSent = false;
            $message = 'Enrollment appointment cancelled, but the confirmation email could not be sent. Please contact the registrar.';
        }
    } else {
        $message = 'Enrollment appointment cancelled. Email notifications are not enabled.';
    }
    try {
        $notificationUpdate = $database->prepare(
            'UPDATE notifications
             SET message = ?, delivery_status = ?, sent_at = ?
             WHERE id = ?'
        );
        $notificationUpdate->execute([
            $message,
            $emailSent ? 'sent' : 'failed',
            $emailSent ? date('Y-m-d H:i:s') : null,
            $notificationId,
        ]);
    } catch (Throwable $error) {
        error_log('Enrollment appointment cancellation notification status update failed: ' . $error->getMessage());
    }

    student_json_response([
        'success' => true,
        'appointment' => [
            'referenceNumber' => $referenceNumber,
            'date' => substr($originalScheduledAt, 0, 10),
            'time' => date('g:i A', strtotime($originalScheduledAt)),
            'status' => 'Cancelled',
            'emailSent' => $emailSent,
        ],
        'message' => $message,
    ]);
} catch (Throwable $error) {
    if (isset($database) && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Enrollment appointment cancellation failed: ' . $error->getMessage());
    student_json_response(
        student_debug_error_detail(
            ['success' => false, 'message' => 'The enrollment appointment could not be cancelled. Please try again later.'],
            $error
        ),
        503
    );
}
