<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/database.php';

function admin_database(): PDO
{
    return application_database();
}
