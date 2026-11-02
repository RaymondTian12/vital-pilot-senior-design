-- An admin can suspend an account without deleting its records.
ALTER TABLE Users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS AdminAccountActions (
    action_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    target_user_id BIGINT UNSIGNED NOT NULL,
    admin_user_id BIGINT UNSIGNED NOT NULL,
    action ENUM('SUSPEND', 'RESTORE') NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX target_action_history (target_user_id, created_at),
    FOREIGN KEY (target_user_id) REFERENCES Users(user_id),
    FOREIGN KEY (admin_user_id) REFERENCES Users(user_id)
);
