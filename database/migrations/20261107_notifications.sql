-- Persists in-app notifications server-side. The mobile notification
-- system (bell icon, notifications screen, banners, critical-alert modal)
-- was fully built but nothing ever called into it -- every notification
-- lived only in local React state and vanished on app restart.
--
-- Adds a Notifications table for both per-reading alerts (created when a
-- submitted vital is classified as a warning/critical reading) and
-- temporal alerts (created when backend/engine/temporal_engine.py's
-- sustained/chronic-elevation rules trigger across multiple days).

CREATE TABLE IF NOT EXISTS Notifications (
    notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    severity ENUM('info', 'success', 'warning', 'critical') NOT NULL,
    category ENUM('metric', 'report', 'reminder', 'system', 'health-alert') NOT NULL,
    metric_name VARCHAR(50) NULL,
    metric_value VARCHAR(50) NULL,
    action_label VARCHAR(80) NULL,
    action_route VARCHAR(200) NULL,
    alert_key VARCHAR(100) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX user_notification_history (user_id, created_at),
    INDEX user_alert_key_history (user_id, alert_key, created_at),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
