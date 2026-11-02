-- Record who made each doctor verification decision and why.
CREATE TABLE IF NOT EXISTS ProviderReviews (
    review_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    provider_id BIGINT UNSIGNED NOT NULL,
    admin_user_id BIGINT UNSIGNED NOT NULL,
    decision ENUM('APPROVED', 'REJECTED') NOT NULL,
    review_note VARCHAR(500) NOT NULL,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX provider_review_history (provider_id, reviewed_at),
    FOREIGN KEY (provider_id) REFERENCES Providers(provider_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_user_id) REFERENCES Users(user_id)
);
