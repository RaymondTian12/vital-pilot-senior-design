-- Additive migration. Apply once to the intended development database.
CREATE TABLE IF NOT EXISTS UserAuthIdentities (
    user_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_subject VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider, provider_subject),
    UNIQUE KEY user_provider (user_id, provider),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
