<?php
declare(strict_types=1);

return [
    'host' => getenv('SMTP_HOST') ?: '',
    'port' => (int)(getenv('SMTP_PORT') ?: 587),
    'username' => getenv('SMTP_USERNAME') ?: '',
    'password' => getenv('SMTP_PASSWORD') ?: '',
    'from_email' => getenv('SMTP_FROM_EMAIL') ?: '',
    'from_name' => getenv('SMTP_FROM_NAME') ?: 'EnrollEase',
];
