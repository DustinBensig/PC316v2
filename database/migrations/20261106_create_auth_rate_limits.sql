USE enrollment_system;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  scope VARCHAR(40) NOT NULL,
  subject_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL,
  locked_until DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, subject_hash),
  KEY ix_auth_rate_limits_locked_until (locked_until),
  KEY ix_auth_rate_limits_window_started (window_started_at)
) ENGINE=InnoDB;
