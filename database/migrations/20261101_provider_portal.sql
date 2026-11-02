-- New relationships must require an explicit patient grant.
ALTER TABLE PatientProviderAssignments
    MODIFY COLUMN assignment_status ENUM('ACTIVE', 'PENDING', 'REVOKED') NOT NULL DEFAULT 'PENDING';

-- Existing ACTIVE rows predate patient-facing consent and must not grant access.
UPDATE PatientProviderAssignments SET assignment_status = 'REVOKED'
WHERE assignment_status = 'ACTIVE';

-- Keep the newest row if an older database has duplicate pairs.
DELETE older FROM PatientProviderAssignments older
JOIN PatientProviderAssignments newer
  ON older.patient_profile_id = newer.patient_profile_id
 AND older.provider_id = newer.provider_id
 AND older.assignment_id < newer.assignment_id;

-- A patient/provider pair represents one permission, including after revocation.
ALTER TABLE PatientProviderAssignments
    ADD UNIQUE KEY unique_patient_provider (patient_profile_id, provider_id);
