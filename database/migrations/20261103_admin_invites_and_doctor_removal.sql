-- Apply once before deploying doctor removal or additional admin invitations.
ALTER TABLE Providers MODIFY COLUMN verification_status
    ENUM('PENDING', 'APPROVED', 'REJECTED', 'REMOVED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE ProviderReviews MODIFY COLUMN decision
    ENUM('APPROVED', 'REJECTED', 'REMOVED') NOT NULL;

CREATE TABLE IF NOT EXISTS AdminInvitations (
    invitation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    invited_by BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    revoked_at DATETIME NULL,
    revoked_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX invitation_email_status (email, expires_at),
    FOREIGN KEY (invited_by) REFERENCES Users(user_id),
    FOREIGN KEY (revoked_by) REFERENCES Users(user_id)
);
