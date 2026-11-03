-- Apply once before deploying doctor removal and reapproval controls.
ALTER TABLE Providers MODIFY COLUMN verification_status
    ENUM('PENDING', 'APPROVED', 'REJECTED', 'REMOVED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE ProviderReviews MODIFY COLUMN decision
    ENUM('APPROVED', 'REJECTED', 'REMOVED') NOT NULL;
