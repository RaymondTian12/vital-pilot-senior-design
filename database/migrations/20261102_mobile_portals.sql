-- Additive: existing provider assignments do NOT grant portal consent.
CREATE TABLE IF NOT EXISTS PatientSharingConsents (
    patient_user_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_user_id, provider_id),
    FOREIGN KEY (patient_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES Providers(provider_id) ON DELETE CASCADE
);

-- Widen goal storage to support step goals above 9,999.99.
ALTER TABLE MetricGoals MODIFY goal_value DECIMAL(10, 2) NOT NULL;
ALTER TABLE MetricGoalsHistory MODIFY old_value DECIMAL(10, 2) NOT NULL;
