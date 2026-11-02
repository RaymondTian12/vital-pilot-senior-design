-- Existing provider records require review before they can read patient data.
ALTER TABLE Providers ADD COLUMN verification_status
    ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
