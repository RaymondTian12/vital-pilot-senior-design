-- VitalPilot database schema
-- Generated from docs/database_design.md. Run against the MySQL instance
-- referenced by backend/.env (see backend/db.py for connection handling).

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient', 'provider', 'admin') NOT NULL DEFAULT 'patient',
    date_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UserHealthProfiles (
    profile_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    baseline_height_in DECIMAL(4, 2) NOT NULL,
    sex ENUM('Female', 'Male') NOT NULL,
    date_of_birth DATE NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Providers (
    provider_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    npi VARCHAR(10) NOT NULL UNIQUE,
    specialty VARCHAR(100) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    clinic_name VARCHAR(255) NULL,
    clinic_phone VARCHAR(20) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PatientProviderAssignments (
    assignment_id SERIAL PRIMARY KEY,
    provider_id BIGINT UNSIGNED NOT NULL,
    patient_profile_id BIGINT UNSIGNED NOT NULL,
    assignment_status ENUM('ACTIVE', 'PENDING', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES Providers(provider_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ClinicalThresholds (
    threshold_id SERIAL PRIMARY KEY,
    metric_type ENUM('BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BLOOD_OXYGEN', 'BODY_MASS_INDEX', 'PEAK_FLOW_RATE', 'WATER_INTAKE', 'PHYSICAL_ACTIVITY', 'SLEEP') NOT NULL,
    sub_metric ENUM('SYSTOLIC', 'DIASTOLIC', 'FASTING', 'POST_PRANDIAL', 'UNIVERSAL', 'FEMALE', 'MALE') NOT NULL,
    classification VARCHAR(50) NOT NULL,
    min_value DECIMAL(8, 2) NOT NULL,
    max_value DECIMAL(8, 2) NOT NULL,
    alert_state ENUM('LOG_SUCCESS_AND_BANNER', 'LOG_WARNING_AND_BANNER', 'LOG_CRITICAL_AND_BANNER', 'DISPLAY_GOAL_NOTICE') NOT NULL,
    alert_message TEXT NOT NULL
);

-- NOTE: docs/database_design.md specifies MetricGoals.goal_id as plain
-- `INT PRIMARY KEY` (no auto-increment), unlike every other table's
-- surrogate key. That would require the application to generate and supply
-- goal_id on every insert. Using SERIAL here instead for consistency with
-- the rest of the schema -- flag this with the team if INT was intentional.
CREATE TABLE IF NOT EXISTS MetricGoals (
    goal_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    metric_type ENUM('Sleep', 'Steps', 'Water', 'Peak Flow') NOT NULL,
    goal_value DECIMAL(6, 2) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MetricGoalsHistory (
    history_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    metric_type ENUM('Sleep', 'Steps', 'Water', 'Peak Flow') NOT NULL,
    old_value DECIMAL(6, 2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BloodGlucose (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    glucose_mgdl INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BloodOxygenSaturation (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    spo2_percentage INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BloodPressure (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    systolic_mmhg INT NOT NULL,
    diastolic_mmhg INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BodyMassIndex (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    weight_lbs DECIMAL(5, 2) NOT NULL,
    bmi_value DECIMAL(4, 1) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PeakFlowRate (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    flow_rate_lmin INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PhysicalActivity (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    steps_taken INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Sleep (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    duration_hours DECIMAL(4, 2) NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS WaterIntake (
    log_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    amount_cups DECIMAL(4, 2) NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ChatMessages (
    message_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    sender_role ENUM('user', 'AI') NOT NULL,
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ClinicalReports (
    report_id SERIAL PRIMARY KEY,
    patient_profile_id BIGINT UNSIGNED NOT NULL,
    generated_by_user_id BIGINT UNSIGNED NOT NULL,
    report_title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    summary_text TEXT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_kb INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by_user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Badges (
    badge_id VARCHAR(50) PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UserBadges (
    user_badge_id SERIAL PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_profile_badge (profile_id, badge_id),
    FOREIGN KEY (profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES Badges(badge_id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
